import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/utils/prisma'
import { authMiddleware, AuthRequest } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: AuthRequest) {
  const authError = authMiddleware(request)
  if (authError) return authError

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.name)
    const filename = uniqueSuffix + ext
    
    const uploadDir = path.join(process.cwd(), 'src/uploads')
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const savedFile = await prisma.file.create({
      data: {
        filename: file.name,
        filepath: `/uploads/${filename}`,
        size: file.size,
        userId: request.user!.userId
      }
    })

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: savedFile.id,
        filename: savedFile.filename,
        size: savedFile.size,
        createdAt: savedFile.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}