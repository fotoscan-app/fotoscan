'use client'
import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import imageCompression from 'browser-image-compression'
import { formatBytes } from '@/lib/utils'

interface UploadFile {
  id: string; file: File; name: string; size: number
  status: 'queued' | 'uploading' | 'done' | 'error' | 'duplicate' | 'flagged'
  error?: string
}

export default function UploadPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadFile[] = accepted.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f, name: f.name, size: f.size, status: 'queued',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  })

  function updateFile(id: string, patch: Partial<UploadFile>) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  async function uploadFile(item: UploadFile) {
    updateFile(item.id, { status: 'uploading' })

    try {
      // Client-side compression before upload
      let fileToUpload = item.file
      try {
        fileToUpload = await imageCompression(item.file, {
          maxSizeMB: 8, maxWidthOrHeight: 3840, useWebWorker: true,
        })
      } catch { /* use original if compression fails */ }

      // Step 1: Get presigned URL from our API
      let presignData: any
      try {
        const presignRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId, fileName: item.name,
            fileSize: fileToUpload.size, contentType: fileToUpload.type,
          }),
        })
        presignData = await presignRes.json()
      } catch {
        return updateFile(item.id, { status: 'error', error: 'Step 1 failed: could not reach server.' })
      }

      if (!presignData.success) {
        const code = presignData.code || ''
        if (code === 'PS-204') return updateFile(item.id, { status: 'error', error: 'Storage limit reached. Please upgrade your plan.' })
        return updateFile(item.id, { status: 'error', error: presignData.error || 'Failed to get upload URL.' })
      }

      // Step 2: Upload directly to S3 using presigned URL
      try {
        const s3Res = await fetch(presignData.data.uploadUrl, {
          method: 'PUT', body: fileToUpload,
          headers: { 'Content-Type': fileToUpload.type },
        })
        if (!s3Res.ok) {
          return updateFile(item.id, { status: 'error', error: `Step 2 failed: S3 returned ${s3Res.status}. Check S3 CORS settings.` })
        }
      } catch {
        return updateFile(item.id, { status: 'error', error: 'Step 2 failed: S3 upload blocked. Check S3 CORS settings (see guide).' })
      }

      // Step 3: Notify backend to process
      let completeData: any
      try {
        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId, s3Key: presignData.data.s3Key,
            fileName: item.name, fileSize: fileToUpload.size,
          }),
        })
        completeData = await completeRes.json()
      } catch {
        return updateFile(item.id, { status: 'error', error: 'Step 3 failed: processing error.' })
      }

      if (!completeData.success) {
        const code = completeData.code || ''
        if (code === 'PS-305') return updateFile(item.id, { status: 'duplicate', error: 'Duplicate photo skipped.' })
        if (code === 'PS-301') return updateFile(item.id, { status: 'error', error: 'Invalid file type rejected.' })
        return updateFile(item.id, { status: 'error', error: completeData.error || 'Processing failed.' })
      }

      const isFlagged = completeData.data.photo.isFlagged
      updateFile(item.id, { status: isFlagged ? 'flagged' : 'done' })
    } catch (err) {
      updateFile(item.id, { status: 'error', error: 'Unexpected error. Please retry.' })
    }
  }

  async function startUpload() {
    setUploading(true)
    const queued = files.filter(f => f.status === 'queued')
    // Upload 3 at a time
    for (let i = 0; i < queued.length; i += 3) {
      await Promise.all(queued.slice(i, i + 3).map(uploadFile))
    }
    setUploading(false)
  }

  const queued = files.filter(f => f.status === 'queued').length
  const done = files.filter(f => ['done', 'flagged'].includes(f.status)).length
  const errors = files.filter(f => f.status === 'error').length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href={`/dashboard/events/${eventId}`}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back to event
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload photos</h1>
      <p className="text-gray-500 mb-8">JPEG, PNG, or WebP. Max 20 MB per photo. AI will process each photo after upload.</p>

      {/* Drop zone */}
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-6 ${
        isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">
          {isDragActive ? 'Drop photos here…' : 'Drag & drop photos, or click to browse'}
        </p>
        <p className="text-sm text-gray-400 mt-1">Supports JPEG, PNG, WebP up to 20 MB each</p>
      </div>

      {files.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 text-sm mb-4">
            <span className="text-gray-600">{files.length} files selected</span>
            {queued > 0 && <span className="text-brand-600">{queued} queued</span>}
            {done > 0 && <span className="text-green-600">{done} uploaded</span>}
            {errors > 0 && <span className="text-red-600">{errors} failed</span>}
            <button className="text-gray-400 hover:text-red-500 ml-auto text-xs"
              onClick={() => setFiles([])} disabled={uploading}>Clear all</button>
          </div>

          {/* File list */}
          <div className="card divide-y divide-gray-100 mb-6 max-h-80 overflow-auto">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(f.size)}</p>
                </div>
                <div className="shrink-0">
                  {f.status === 'queued' && <span className="text-xs text-gray-400">Queued</span>}
                  {f.status === 'uploading' && (
                    <span className="text-xs text-brand-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" /> Uploading…
                    </span>
                  )}
                  {f.status === 'done' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                  {f.status === 'flagged' && (
                    <span className="text-xs text-accent-600 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-4 h-4" /> Pending review
                    </span>
                  )}
                  {f.status === 'duplicate' && <span className="text-xs text-gray-400">Duplicate</span>}
                  {f.status === 'error' && (
                    <span className="text-xs text-red-500 max-w-[160px] text-right">{f.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {queued > 0 && (
            <button onClick={startUpload} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5" />
              {uploading ? `Uploading…` : `Upload ${queued} photo${queued !== 1 ? 's' : ''}`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
