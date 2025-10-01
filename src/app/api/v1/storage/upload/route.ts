/**
 * File Upload API Endpoint
 * 
 * Handles file uploads for certification documents and other attachments.
 * Integrates with Supabase Storage for secure file management.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOrganizationId } from '@/lib/auth/get-organization-id'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/v1/storage/upload
 * 
 * Upload files to Supabase Storage
 */
export async function POST(request: NextRequest) {
  console.log('🚀 Upload endpoint hit')
  
  try {
    const { userId } = await auth()
    console.log('📝 User ID from auth:', userId ? 'authenticated' : 'not authenticated')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized. Please check SUPABASE environment variables.')
      return NextResponse.json(
        { 
          success: false, 
          error: 'File upload service not available', 
          message: 'Storage service is not configured. Please contact support.' 
        },
        { status: 503 }
      )
    }

    // Get user's organization ID
    const orgId = await getOrganizationId(userId)
    
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'No organization found for user' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general'
    
    console.log('File upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      uploadType: type
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large (max 10MB)' },
        { status: 400 }
      )
    }

    // Generate unique filename with proper folder structure
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    
    // Handle special image types for organizations
    const imageTypes = ['logo', 'banner', 'contact-profile', 'contact']
    let fileName: string
    const bucketName = 'documents' // Always use documents bucket
    
    if (imageTypes.includes(type)) {
      // For organization images: {orgId}/images/{type}/{filename}
      fileName = `${orgId}/images/${type}/${timestamp}_${randomString}.${fileExtension}`
    } else {
      // For other files: {orgId}/docs/{filename}  
      fileName = `${orgId}/docs/${timestamp}_${randomString}.${fileExtension}`
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage (documents bucket only)
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: userId,
          organizationId: orgId,
          type: type,
        }
      })

    if (error) {
      console.error('Supabase upload error details:', {
        error: error,
        message: error.message,
        fileName: fileName,
        bucketName: 'documents'
      })
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to upload file'
      let statusCode = 500
      
      if (error.message?.includes('not found')) {
        errorMessage = 'Storage bucket not found. Please contact support.'
        statusCode = 503
      } else if (error.message?.includes('permissions') || error.message?.includes('access')) {
        errorMessage = 'Storage access denied. Please contact support.'
        statusCode = 403
      } else if (error.message?.includes('size') || error.message?.includes('limit')) {
        errorMessage = 'File too large. Maximum size is 10MB.'
        statusCode = 413
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: statusCode }
      )
    }

    // Try to get public URL first, fallback to signed URL
    let fileUrl: string
    
    // First try public URL (for public buckets)
    const { data: publicData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName)
    
    if (publicData?.publicUrl) {
      // Test if the public URL actually works by making a quick HEAD request with timeout
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const testResponse = await fetch(publicData.publicUrl, { 
          method: 'HEAD',
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (testResponse.ok) {
          fileUrl = publicData.publicUrl
          console.log('Generated public URL:', fileUrl)
        } else {
          throw new Error(`Public URL not accessible: ${testResponse.status} ${testResponse.statusText}`)
        }
      } catch (error) {
        console.log('Public URL not accessible, creating long-term signed URL...', error instanceof Error ? error.message : 'Unknown error')
        // Fallback to signed URL with very long expiry (10 years for profile images)
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
          .from('documents')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10) // 10 years expiry
        
        if (signedError || !signedData?.signedUrl) {
          console.error('Failed to generate signed URL:', signedError)
          return NextResponse.json(
            { success: false, error: 'Failed to generate file URL' },
            { status: 500 }
          )
        }
        
        fileUrl = signedData.signedUrl
        console.log('Generated signed URL:', fileUrl)
      }
    } else {
      console.error('Failed to generate public URL for file:', fileName)
      return NextResponse.json(
        { success: false, error: 'Failed to generate file URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        originalName: file.name,
        url: fileUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      },
      message: 'File uploaded successfully',
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}