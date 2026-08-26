import { useRef, useState } from 'react'
import { Camera, ImagePlus, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { buildClassNote, classNotesOn } from '../lib/classNotes'
import { formatDayLabel, parseKey } from '../lib/dates'
import type { UniClass } from '../types'

type ClassNotesSheetProps = {
  item: UniClass
  date: string
  onClose: () => void
}

export function ClassNotesSheet({ item, date, onClose }: ClassNotesSheetProps) {
  const { user } = useAuth()
  const { classNotes, upsertClassNote, removeClassNote } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const shots = classNotesOn(classNotes, item.id, date)
  const dayLabel = formatDayLabel(parseKey(date))

  async function addFiles(list?: FileList | null) {
    const uid = user?.uid
    if (!uid || !list?.length) return
    setBusy(true)
    setError('')
    try {
      for (const file of Array.from(list)) {
        const note = await buildClassNote(uid, item.id, date, file)
        await upsertClassNote(note)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that photo.')
    } finally {
      setBusy(false)
      if (cameraRef.current) cameraRef.current.value = ''
      if (libraryRef.current) libraryRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close notes" onClick={onClose} />
      <div className="glass relative flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col rounded-3xl p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-fg">{item.name}</h2>
            <p className="text-xs text-muted">{dayLabel} · lecture photos</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center text-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-500 text-sm font-medium text-white disabled:opacity-40"
          >
            <Camera className="h-4 w-4" />
            {busy ? 'Saving…' : 'Camera'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => libraryRef.current?.click()}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-field text-sm text-fg ring-1 ring-line disabled:opacity-40"
          >
            <ImagePlus className="h-4 w-4" />
            Library
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}

        <div className="mt-4 min-h-0 flex-1 overflow-auto">
          {shots.length === 0 ? (
            <p className="text-sm text-muted">No pages yet. Photograph the board or your notebook for this class today.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {shots.map((shot) => (
                <div key={shot.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setPreview(shot.url)}
                    className="block w-full overflow-hidden rounded-2xl ring-1 ring-line"
                  >
                    <img src={shot.url} alt="" className="aspect-[3/4] w-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeClassNote(shot)}
                    className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white"
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => void addFiles(event.target.files)}
        />
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => void addFiles(event.target.files)}
        />
      </div>

      {preview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/80" aria-label="Close photo" onClick={() => setPreview(null)} />
          <img src={preview} alt="" className="relative max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      ) : null}
    </div>
  )
}
