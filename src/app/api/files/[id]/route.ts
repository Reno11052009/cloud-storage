import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/utils/prisma'
import { authMiddleware, AuthRequest } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: AuthRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request)
  if (authError) return authError

  try {
    const fileId = parseInt(params.id)

    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: 'Invalid file ID' },
        { status: 400 }
      )
    }

    const fileRecord = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: request.user!.userId
      }
    })

    if (!fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const filepath = path.join(process.cwd(), 'src', fileRecord.filepath)

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    await prisma.file.delete({
      where: { id: fileId }
    })

    return NextResponse.json({
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}