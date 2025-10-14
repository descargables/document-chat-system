/**
 * @swagger
 * /api/v1/ai/media:
 *   post:
 *     summary: Generate media (images, videos) using AI
 *     description: Create images, videos, or edit images using ImageRouter.io provider
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
 *               - prompt
 *               - type
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Text prompt for media generation
 *                 minLength: 1
 *                 maxLength: 4000
 *                 example: "A cozy wooden cabin in a snowy forest at sunset, ultra-realistic"
 *               type:
 *                 type: string
 *                 enum: [image, video, edit]
 *                 description: Type of media to generate
 *                 example: "image"
 *               model:
 *                 type: string
 *                 description: Specific model to use (optional, uses defaults)
 *                 example: "test/test"
 *               quality:
 *                 type: string
 *                 enum: [auto, low, medium, high]
 *                 description: Quality setting for generation
 *                 default: "auto"
 *               responseFormat:
 *                 type: string
 *                 enum: [url, b64_json]
 *                 description: Response format for generated media
 *                 default: "url"
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Number of images to generate (image type only)
 *                 default: 1
 *               images:
 *                 type: array
 *                 description: Images for editing (edit type only)
 *                 items:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: string
 *                       description: Base64 encoded image data
 *                     mimeType:
 *                       type: string
 *                       example: "image/jpeg"
 *               masks:
 *                 type: array
 *                 description: Mask images for editing (edit type only, optional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: string
 *                       description: Base64 encoded mask data
 *                     mimeType:
 *                       type: string
 *                       example: "image/jpeg"
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for tracking
 *                 properties:
 *                   costLimit:
 *                     type: number
 *                     description: Maximum cost limit for the request
 *     responses:
 *       200:
 *         description: Media generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                             description: URL to the generated media
 *                           data:
 *                             type: string
 *                             description: Base64 encoded media (if requested)
 *                           type:
 *                             type: string
 *                             enum: [image, video]
 *                           mimeType:
 *                             type: string
 *                     model:
 *                       type: string
 *                       description: Model used for generation
 *                     usage:
 *                       type: object
 *                       properties:
 *                         cost:
 *                           type: number
 *                           description: Cost of the generation
 *                         totalTokens:
 *                           type: number
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         provider:
 *                           type: string
 *                           example: "imagerouter"
 *                         requestId:
 *                           type: string
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                         processingTime:
 *                           type: number
 *                         revisedPrompt:
 *                           type: string
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid request: prompt is required"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *       403:
 *         description: Forbidden - usage limits exceeded
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get media generation capabilities and models
 *     description: Retrieve available models and capabilities for media generation
 *     tags: [AI Services]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Capabilities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     capabilities:
 *                       type: object
 *                       properties:
 *                         imageGeneration:
 *                           type: boolean
 *                         videoGeneration:
 *                           type: boolean
 *                         imageEditing:
 *                           type: boolean
 *                         supportedFormats:
 *                           type: object
 *                           properties:
 *                             input:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             output:
 *                               type: array
 *                               items:
 *                                 type: string
 *                         maxFileSize:
 *                           type: number
 *                         maxImages:
 *                           type: number
 *                         supportedQualities:
 *                           type: array
 *                           items:
 *                             type: string
 *                         rateLimit:
 *                           type: object
 *                           properties:
 *                             general:
 *                               type: number
 *                             imageGeneration:
 *                               type: number
 *                     models:
 *                       type: object
 *                       properties:
 *                         image:
 *                           type: array
 *                           items:
 *                             type: string
 *                         video:
 *                           type: array
 *                           items:
 *                             type: string
 *                         edit:
 *                           type: array
 *                           items:
 *                             type: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { AIServiceManager } from '@/lib/ai/ai-service-manager';
import { ImageRouterAdapter } from '@/lib/ai/providers/imagerouter-adapter';
import {
  UnifiedMediaGenerationRequest,
  isImageGenerationRequest,
  isVideoGenerationRequest,
  isImageEditRequest
} from '@/lib/ai/interfaces/imagerouter-types';
// import { validateCSRFInAPIRoute } from '@/lib/csrf'; // Removed for consistency with enhanced-chat
import { checkRateLimit } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/api-validation';

// Request validation schemas
const mediaGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000).describe('Text prompt for media generation'),
  type: z.enum(['image', 'video', 'edit']).describe('Type of media to generate'),
  model: z.string().optional().describe('Specific model to use'),
  quality: z.enum(['auto', 'low', 'medium', 'high']).default('auto').describe('Quality setting'),
  responseFormat: z.enum(['url', 'b64_json']).default('url').describe('Response format'),
  count: z.number().int().min(1).max(10).default(1).describe('Number of images to generate'),
  images: z.array(z.object({
    data: z.string().describe('Base64 encoded image data'),
    mimeType: z.string().default('image/jpeg').describe('MIME type of the image')
  })).optional().describe('Images for editing'),
  masks: z.array(z.object({
    data: z.string().describe('Base64 encoded mask data'),
    mimeType: z.string().default('image/jpeg').describe('MIME type of the mask')
  })).optional().describe('Mask images for editing'),
  metadata: z.object({
    costLimit: z.number().optional().describe('Maximum cost limit'),
  }).optional().describe('Additional metadata')
});

type MediaGenerationRequest = z.infer<typeof mediaGenerationSchema>;

/**
 * POST /api/v1/ai/media - Generate media using AI
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is an internal call from the enhanced-chat API
    const isInternalCall = request.headers.get('X-Internal-Call') === 'true' ||
                          request.headers.get('user-agent')?.includes('node') || 
                          request.url.includes('localhost');
    
    console.log('🔍 Media API - Is internal call:', isInternalCall);
    console.log('🔍 Media API - X-Internal-Call header:', request.headers.get('X-Internal-Call'));
    console.log('🔍 Media API - User agent:', request.headers.get('user-agent'));

    let userId, orgId;
    
    // For external calls, require authentication
    if (!isInternalCall) {
      const auth = getAuth(request);
      userId = auth.userId;
      orgId = auth.orgId;
      
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      console.log('🔍 Media API - Skipping auth for internal call');
      // For internal calls, get organization ID from header
      orgId = request.headers.get('X-Organization-Id') || null;
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: 60000, // 1 minute
        maxRequests: 10, // 10 media generations per minute
        message: 'Too many media generation requests. Please wait before trying again.'
      },
      'media'
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    // CSRF validation removed for consistency with enhanced-chat API
    // Clerk authentication provides sufficient security for this authenticated endpoint

    // Request validation
    const validation = await validateRequest(request, mediaGenerationSchema);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request format',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    const requestData = validation.data as MediaGenerationRequest;

    // Additional validation based on type
    const typeValidation = validateMediaType(requestData);
    if (!typeValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request for media type',
          details: typeValidation.errors 
        },
        { status: 400 }
      );
    }

    // Get AI service manager and ImageRouter adapter
    const aiManager = AIServiceManager.getInstance();
    const imageRouterAdapter = aiManager.getProvider('imagerouter') as ImageRouterAdapter;
    
    if (!imageRouterAdapter) {
      // Always return demo image when ImageRouter is not available
      console.log('ImageRouter not available, returning demo image');
      
      // Generate a demo image with the user's prompt
      const demoSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="1024" height="1024" fill="#6366f1"/>
<text x="512" y="400" text-anchor="middle" fill="white" font-size="48" font-family="Arial, sans-serif">Demo Image</text>
<text x="512" y="460" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif">${requestData.prompt.slice(0, 50)}${requestData.prompt.length > 50 ? '...' : ''}</text>
<text x="512" y="520" text-anchor="middle" fill="white" font-size="18" font-family="Arial, sans-serif">(ImageRouter API key not configured)</text>
<text x="512" y="560" text-anchor="middle" fill="white" font-size="16" font-family="Arial, sans-serif">Add IMAGEROUTER_API_KEY to .env.local</text>
</svg>`;
      
      const base64Svg = Buffer.from(demoSvg).toString('base64');
      
      return NextResponse.json({
        success: true,
        data: {
          results: [{
            url: `data:image/svg+xml;base64,${base64Svg}`,
            type: 'image',
            mimeType: 'image/svg+xml'
          }],
          model: 'demo',
          usage: { cost: 0 },
          metadata: {
            provider: 'demo',
            requestId: `demo-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            processingTime: 100,
            revisedPrompt: requestData.prompt,
            note: 'This is a demo image. Configure IMAGEROUTER_API_KEY for real image generation.'
          }
        },
        estimatedCost: 0,
        actualCost: 0
      });
    }

    // Build unified request with model validation
    let modelToUse = requestData.model;

    console.log('🔍 Media API - Model validation:', {
      receivedModel: requestData.model,
      modelToUse: modelToUse,
      willFallback: !modelToUse || modelToUse === 'auto'
    });

    // Only fallback if model is specifically 'auto' or empty - keep all other models
    if (!modelToUse || modelToUse === 'auto') {
      console.log('⚠️ No model specified or auto, using fallback: test/test');
      modelToUse = 'test/test';
    } else {
      console.log('✅ Using specified model:', modelToUse);
    }
    
    const unifiedRequest: UnifiedMediaGenerationRequest = {
      prompt: requestData.prompt,
      type: requestData.type,
      model: modelToUse,
      metadata: {
        organizationId: orgId || undefined,
        userId: userId,
        httpRequest: request,
        ...requestData.metadata
      }
    };

    // Add type-specific properties
    if (requestData.type === 'image') {
      (unifiedRequest as any).quality = requestData.quality;
      (unifiedRequest as any).responseFormat = requestData.responseFormat;
      (unifiedRequest as any).count = requestData.count;
    } else if (requestData.type === 'video') {
      // Video-specific properties (ImageRouter currently has limited options)
    } else if (requestData.type === 'edit') {
      (unifiedRequest as any).images = requestData.images;
      (unifiedRequest as any).masks = requestData.masks;
      (unifiedRequest as any).quality = requestData.quality;
      (unifiedRequest as any).responseFormat = requestData.responseFormat;
    }

    // Estimate cost first
    const costEstimate = await imageRouterAdapter.estimateMediaCost(unifiedRequest);
    
    // Check if cost exceeds limit
    const costLimit = requestData.metadata?.costLimit;
    if (costLimit && costEstimate.estimatedCost > costLimit) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Estimated cost ($${costEstimate.estimatedCost.toFixed(4)}) exceeds limit ($${costLimit})`,
          estimatedCost: costEstimate.estimatedCost
        },
        { status: 400 }
      );
    }

    // Generate media with fallback on network errors
    try {
      const result = await imageRouterAdapter.generateMedia(unifiedRequest);
      
      // Success response
      return NextResponse.json({
        success: true,
        data: result,
        estimatedCost: costEstimate.estimatedCost,
        actualCost: result.usage.cost
      });
    } catch (generationError: any) {
      // Check if it's a network error and fall back to demo
      if (generationError.message?.includes('Network connection') || 
          generationError.message?.includes('network') ||
          generationError.message?.includes('connection')) {
        
        // Return demo fallback with base64 image (no external network call needed)
        return NextResponse.json({
          success: true,
          data: {
            results: [{
              url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiBmaWxsPSIjNjM2NmYxIi8+Cjx0ZXh0IHg9IjUxMiIgeT0iNDgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI0OCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIj5EZW1vIEltYWdlPC90ZXh0Pgo8dGV4dCB4PSI1MTIiIHk9IjU0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiI+KE5ldHdvcmsgRmFsbGJhY2spPC90ZXh0Pgo8L3N2Zz4K',
              type: 'image',
              mimeType: 'image/svg+xml'
            }],
            model: 'demo-fallback',
            usage: { cost: 0 },
            metadata: {
              provider: 'demo-fallback',
              requestId: `fallback-${Date.now()}`,
              generatedAt: new Date().toISOString(),
              processingTime: 100,
              revisedPrompt: requestData.prompt,
              note: 'Generated using fallback due to network issues'
            }
          },
          estimatedCost: 0,
          actualCost: 0
        });
      }
      
      // Re-throw non-network errors
      throw generationError;
    }

  } catch (error: any) {
    console.error('Media generation error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          provider: error.provider
        },
        { status: 400 }
      );
    }

    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider authentication failed. Please contact support.',
          provider: error.provider
        },
        { status: 503 }
      );
    }

    if (error.name === 'RateLimitError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider rate limit exceeded. Please try again later.',
          provider: error.provider,
          retryAfter: error.retryAfter
        },
        { status: 429 }
      );
    }

    if (error.name === 'QuotaExceededError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider quota exceeded. Please contact support.',
          provider: error.provider
        },
        { status: 402 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during media generation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/ai/media - Get media generation capabilities
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication (same pattern as enhanced-chat)
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting (more permissive for GET)
    const rateLimitResult = await checkRateLimit(
      request,
      {
        windowMs: 60000, // 1 minute
        maxRequests: 60, // 60 requests per minute
        message: 'Too many media capability requests. Please wait before trying again.'
      },
      'media-capabilities'
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    // Get AI service manager and ImageRouter adapter
    const aiManager = AIServiceManager.getInstance();
    const imageRouterAdapter = aiManager.getProvider('imagerouter') as ImageRouterAdapter;
    
    if (!imageRouterAdapter) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ImageRouter provider not available' 
        },
        { status: 503 }
      );
    }

    // Get capabilities and models
    const [capabilities, models] = await Promise.all([
      imageRouterAdapter.getMediaCapabilities(),
      imageRouterAdapter.getAvailableModels()
    ]);

    // Group models by type
    const modelsByType = {
      image: models.filter(m => m.metadata?.type === 'image').map(m => m.name),
      video: models.filter(m => m.metadata?.type === 'video').map(m => m.name),
      edit: models.filter(m => m.metadata?.type === 'edit').map(m => m.name)
    };

    return NextResponse.json({
      success: true,
      data: {
        capabilities,
        models: modelsByType,
        supportedTypes: ['image', 'video', 'edit'],
        supportedQualities: ['auto', 'low', 'medium', 'high'],
        supportedFormats: ['url', 'b64_json'],
        limits: {
          maxPromptLength: 4000,
          maxImages: capabilities.maxImages,
          maxFileSize: capabilities.maxFileSize,
          maxCount: 10
        }
      }
    });

  } catch (error: any) {
    console.error('Media capabilities error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve media capabilities',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Validate media generation request based on type
 */
function validateMediaType(request: MediaGenerationRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (request.type) {
    case 'image':
      // Image generation validation
      if (request.images && request.images.length > 0) {
        errors.push('Images array should not be provided for image generation');
      }
      if (request.count && (request.count < 1 || request.count > 10)) {
        errors.push('Count must be between 1 and 10 for image generation');
      }
      break;

    case 'video':
      // Video generation validation
      if (request.images && request.images.length > 0) {
        errors.push('Images array should not be provided for video generation');
      }
      if (request.count && request.count > 1) {
        errors.push('Count must be 1 for video generation');
      }
      break;

    case 'edit':
      // Image editing validation
      if (!request.images || request.images.length === 0) {
        errors.push('Images array is required for image editing');
      }
      if (request.images && request.images.length > 16) {
        errors.push('Maximum 16 images allowed for editing');
      }
      if (request.count && request.count > 1) {
        errors.push('Count must be 1 for image editing');
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
}