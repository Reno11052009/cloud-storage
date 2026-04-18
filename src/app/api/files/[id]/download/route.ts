import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/utils/prisma'
import { authMiddleware, AuthRequest } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function GET(
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

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      )
    }

    const fileBuffer = fs.readFileSync(filepath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileRecord.filename}"`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileRecord.size.toString()
      }
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}