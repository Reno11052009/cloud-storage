'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (token) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    }
  }, [loading, token, router])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      Loading...
    </div>
  )
}