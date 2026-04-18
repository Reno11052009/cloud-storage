import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends NextRequest {
  user?: {
    userId: number
    email: string
  }
}

export function authMiddleware(request: AuthRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number
      email: string
    }
    request.user = decoded
    return null
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid token' },
      { status: 401 }
    )
  }
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
}