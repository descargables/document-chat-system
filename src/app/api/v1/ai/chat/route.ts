import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';
import { crudAuditLogger } from '@/lib/audit/crud-audit-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']).describe("Message role: system for instructions, user for questions, assistant for responses"),
    content: z.string().min(1).describe("Message content text")
  })).min(1).describe("Array of messages for the conversation context"),
  model: z.string().default('gpt-4o-mini').describe("OpenAI model to use for response generation"),
  temperature: z.number().min(0).max(2).default(0.3).describe("Creativity level: 0-2, lower is more focused"),
  max_tokens: z.number().min(1).max(4000).default(800).describe("Maximum tokens in response")
}).describe("Schema for AI chat completion requests with conversation context and generation parameters");

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Generate AI responses for document chat
 *     description: Uses OpenAI to generate intelligent responses based on document context and user questions
 *     tags: [AI Services]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - role
 *                     - content
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                       description: Message role in conversation
 *                     content:
 *                       type: string
 *                       description: Message content
 *               model:
 *                 type: string
 *                 default: gpt-4o-mini
 *                 description: OpenAI model to use
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 default: 0.3
 *                 description: Response creativity level
 *               max_tokens:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 4000
 *                 default: 800
 *                 description: Maximum response length
 *           example:
 *             messages:
 *               - role: system
 *                 content: "You are a document analyst helping users understand government contracts."
 *               - role: user
 *                 content: "What are the key requirements in this solicitation?"
 *             model: "gpt-4o-mini"
 *             temperature: 0.3
 *             max_tokens: 800
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 choices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             example: assistant
 *                           content:
 *                             type: string
 *                             description: AI-generated response
 *                       finish_reason:
 *                         type: string
 *                         example: stop
 *                 usage:
 *                   type: object
 *                   properties:
 *                     prompt_tokens:
 *                       type: number
 *                     completion_tokens:
 *                       type: number
 *                     total_tokens:
 *                       type: number
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: AI service error
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🤖 AI Chat request:', {
      userId,
      messageCount: body.messages?.length,
      model: body.model
    });

    // Validate request
    const validation = chatRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ Chat request validation failed:', validation.error.format());
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const { messages, model, temperature, max_tokens } = validation.data;

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI API
    console.log('🚀 Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      stream: false
    });

    console.log('✅ OpenAI response received:', {
      choices: completion.choices.length,
      usage: completion.usage
    });

    // Get user organization for audit logging
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, organizationId: true, firstName: true, lastName: true }
    });

    // Log AI operation audit trail
    if (user) {
      try {
        const userPrompt = messages.find(m => m.role === 'user')?.content || 'Chat conversation';
        const assistantResponse = completion.choices[0]?.message?.content || '';
        
        await crudAuditLogger.logAIOperation(
          'CREATE',
          `chat_${Date.now()}`,
          `AI Chat Interaction`,
          null,
          {
            model,
            temperature,
            max_tokens,
            prompt: userPrompt.substring(0, 500), // Truncate for storage
            response: assistantResponse.substring(0, 500), // Truncate for storage
            usage: completion.usage
          },
          {
            algorithm: model,
            score: completion.usage?.total_tokens || 0, // Use token count as score
            isAIDecision: true,
            model: model,
            provider: 'openai',
            profileName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
            opportunityTitle: 'AI Chat Session',
            confidence: temperature < 0.5 ? 95 : (temperature < 1.0 ? 85 : 75), // Lower temperature = higher confidence
            factors: {
              messageCount: messages.length,
              promptTokens: completion.usage?.prompt_tokens,
              completionTokens: completion.usage?.completion_tokens,
              totalTokens: completion.usage?.total_tokens,
              temperature,
              max_tokens
            },
            endpoint: '/api/v1/ai/chat',
            method: 'POST'
          }
        );
      } catch (auditError) {
        console.error('Failed to create AI chat audit log:', auditError);
      }
    }

    return NextResponse.json(completion);

  } catch (error) {
    console.error('❌ AI chat error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        type: error.type
      });
      
      return NextResponse.json(
        { 
          error: 'AI service error',
          details: error.message
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}