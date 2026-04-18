'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useRouter } from 'next/navigation'

interface File {
  id: number
  filename: string
  size: number
  createdAt: string
}

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { user, token, logout, loading } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !token) {
      router.push('/auth/login')
    }
  }, [loading, token, router])

  useEffect(() => {
    if (token) {
      fetchFiles()
    }
  }, [token])

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setFiles(data.files)
      }
    } catch (err) {
      console.error('Failed to fetch files')
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        fetchFiles()
      } else {
        const data = await res.json()
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileId: number, filename: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError('Download failed')
    }
  }

  const handleDelete = async (fileId: number) => {
    if (!token || !confirm('Are you sure you want to delete this file?')) return
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        fetchFiles()
      }
    } catch (err) {
      setError('Delete failed')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  if (loading || !token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>My Files</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#6b7280' }}>{user?.email}</span>
          <button onClick={handleLogout} className="btn btn-sm" style={{ background: '#ef4444', color: 'white' }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label className="btn btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          {error && <span style={{ color: '#ef4444', fontSize: '14px' }}>{error}</span>}
        </div>

        {loadingFiles ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
        ) : files.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '12px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
            <p>No files yet</p>
            <p style={{ fontSize: '14px' }}>Upload your first file using the button above</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {files.map((file) => (
              <div key={file.id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {file.filename.endsWith('.pdf') ? '📄' :
                     file.filename.match(/\.(jpg|jpeg|png)$/i) ? '🖼️' :
                     file.filename.endsWith('.zip') ? '📦' : '📁'}
                  </span>
                  <div>
                    <div style={{ fontWeight: '500', color: '#111827' }}>{file.filename}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {formatSize(file.size)} • {formatDate(file.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDownload(file.id, file.filename)}
                    className="btn btn-sm"
                    style={{ background: '#3b82f6', color: 'white' }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="btn btn-sm"
                    style={{ background: '#ef4444', color: 'white' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}