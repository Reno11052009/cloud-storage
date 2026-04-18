import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authMiddleware, AuthRequest } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: AuthRequest) {
  const authError = authMiddleware(request)
  if (authError) return authError

  try {
    const files = await prisma.file.findMany({
      where: { userId: request.user!.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        size: true,
        createdAt: true
      }
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}