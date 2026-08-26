import { useEffect, useRef, useState } from 'react'
import { SwitchCamera, X } from 'lucide-react'

type CameraCaptureProps = {
  stream: MediaStream
  onClose: () => void
  onCapture: (file: File) => void
  onStream: (stream: MediaStream) => void
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export async function startCameraStream(preferBack: boolean) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera is not available in this browser.')
  }
  const facingMode = preferBack ? 'environment' : 'user'
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facingMode } },
    })
  } catch {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
  }
}

async function stillFromVideo(video: HTMLVideoElement) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, video.videoWidth)
  canvas.height = Math.max(1, video.videoHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not capture that frame.')
  ctx.drawImage(video, 0, 0)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error('Could not capture that frame.'))),
      'image/jpeg',
      0.88,
    )
  })
  return new File([blob], `lecture-${Date.now()}.jpg`, { type: 'image/jpeg' })
}

export function CameraCapture({ stream, onClose, onCapture, onStream }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preferBack, setPreferBack] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    setReady(false)
    video.srcObject = stream
    const onMeta = () => setReady(true)
    video.addEventListener('loadedmetadata', onMeta)
    void video.play().then(() => setReady(true)).catch(() => {
      setError('Could not start the camera preview.')
    })
    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      video.srcObject = null
    }
  }, [stream])

  async function snap() {
    const video = videoRef.current
    if (!video || !ready) return
    setBusy(true)
    setError('')
    try {
      const file = await stillFromVideo(video)
      onCapture(file)
    } catch {
      setError('Could not take that photo.')
    } finally {
      setBusy(false)
    }
  }

  async function flip() {
    setError('')
    const nextFacing = !preferBack
    try {
      const next = await startCameraStream(nextFacing)
      stopStream(stream)
      setPreferBack(nextFacing)
      onStream(next)
    } catch {
      setError('Could not switch camera.')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-2xl text-white"
          aria-label="Close camera"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm text-white/80">Take a page</p>
        <button
          type="button"
          onClick={() => void flip()}
          className="grid h-11 w-11 place-items-center rounded-2xl text-white"
          aria-label="Switch camera"
        >
          <SwitchCamera className="h-5 w-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="h-full w-full object-cover"
        />
        {error ? (
          <p className="absolute inset-x-0 bottom-4 px-6 text-center text-sm text-white">{error}</p>
        ) : null}
      </div>
      <div className="flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => void snap()}
          className="grid h-16 w-16 place-items-center rounded-full bg-white disabled:opacity-40"
          aria-label="Take photo"
        >
          <span className="h-12 w-12 rounded-full bg-white ring-2 ring-black/25" />
        </button>
      </div>
    </div>
  )
}
