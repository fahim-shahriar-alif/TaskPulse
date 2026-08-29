import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Camera, ImagePlus, Trash2 } from 'lucide-react'
import { CameraCapture, startCameraStream } from '../components/CameraCapture'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { classKindLabel } from '../lib/classes'
import { buildClassNote, classNoteSaveError, groupClassNotesByDate, notesForClass } from '../lib/classNotes'
import { nowDate } from '../lib/clock'
import { formatDayLabel, parseKey, todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { ClassNote, UniClass } from '../types'

function PhotoThumb({ src, onOpen }: { src: string; onOpen: () => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    if (status !== 'loading') return
    const timer = window.setTimeout(() => setStatus('failed'), 12000)
    return () => window.clearTimeout(timer)
  }, [src, status])

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative block w-full overflow-hidden rounded-3xl bg-field ring-1 ring-line"
    >
      {status === 'loading' ? (
        <span className="absolute inset-x-0 top-3 mx-auto h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      ) : null}
      {status === 'failed' ? (
        <span className="grid aspect-[3/4] place-items-center px-3 text-center text-xs text-muted">
          Photo saved, but it would not display. Delete and add it again.
        </span>
      ) : (
        <img
          src={src}
          alt=""
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('failed')}
          className={`aspect-[3/4] w-full object-cover ${status === 'ready' ? 'opacity-100' : 'opacity-40'}`}
        />
      )}
    </button>
  )
}

export function ClassNotesPage() {
  const { classId } = useParams()
  const { classes } = useStore()
  const item = classes.find((entry) => entry.id === classId)
  if (classId && !item) {
    return (
      <div className="w-full space-y-4">
        <p className="text-sm text-muted">That subject is gone.</p>
        <Link to="/class-notes" className="text-sm text-indigo-400">
          Back to Class notes
        </Link>
      </div>
    )
  }
  if (item) return <SubjectAlbum item={item} />
  return <SubjectIndex />
}

function SubjectIndex() {
  const { classes, classNotes } = useStore()
  const subjects = useMemo(
    () =>
      [...classes].sort((a, b) => a.name.localeCompare(b.name)).map((item) => {
        const shots = notesForClass(classNotes, item.id)
        return { item, shots, cover: shots[0]?.url ?? '', count: shots.length }
      }),
    [classNotes, classes],
  )

  return (
    <div className="w-full space-y-5">
      <div>
        <p className={eyebrowClass}>Library</p>
        <h1 className={titleClass}>Class notes</h1>
        <p className="mt-2 text-sm text-muted">
          One album per subject. Add pages against a class and date; open them here any time.
        </p>
      </div>
      {subjects.length === 0 ? (
        <div className="glass rounded-3xl p-6">
          <p className="text-sm text-muted">
            Add a class first, then photograph the board or your notebook into that subject.
          </p>
          <Link to="/classes" className="mt-3 inline-block text-sm text-indigo-400">
            Go to Classes
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(({ item, cover, count, shots }) => (
            <Link
              key={item.id}
              to={`/class-notes/${item.id}`}
              className="glass flex min-h-24 items-center gap-4 rounded-3xl p-4"
            >
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-field ring-1 ring-line">
                {cover ? (
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-[10px] text-faint">Empty</div>
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-fg">{item.name}</span>
                <span className="block text-[11px] text-indigo-400">{classKindLabel(item)}</span>
                {item.course ? <span className="block text-xs text-muted">{item.course}</span> : null}
                <span className="mt-1 block text-xs text-faint">
                  {count
                    ? `${count} page${count === 1 ? '' : 's'} · last ${formatDayLabel(parseKey(shots[0].date))}`
                    : 'No pages yet'}
                </span>
              </span>
              <span className="text-faint">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function SubjectAlbum({ item }: { item: UniClass }) {
  const { user } = useAuth()
  const { classNotes, upsertClassNote, removeClassNote } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const today = todayKey(nowDate())
  const lectureDate = params.get('date') || today
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<ClassNote | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const shots = notesForClass(classNotes, item.id)
  const groups = groupClassNotesByDate(shots)
  const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop())
    }
  }, [cameraStream])

  function closeCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop())
    setCameraStream(null)
  }

  async function openCamera() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraRef.current?.click()
      return
    }
    try {
      const stream = await startCameraStream(true)
      setCameraStream(stream)
    } catch (err) {
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      if (denied) {
        setError('Camera is blocked. Allow it in the address bar, or use Library.')
        return
      }
      cameraRef.current?.click()
    }
  }

  async function addPhotos(files: File[]) {
    const uid = user?.uid
    if (!uid || !files.length) return
    setBusy(true)
    setError('')
    let settled = false
    const watchdog = window.setTimeout(() => {
      if (settled) return
      setBusy(false)
      setError('That photo took too long. Try a smaller JPEG, then tap Library again.')
    }, 20000)
    try {
      for (const file of files) {
        const note = await buildClassNote(uid, item.id, lectureDate, file)
        await upsertClassNote(note)
      }
    } catch (err) {
      setError(classNoteSaveError(err))
    } finally {
      settled = true
      window.clearTimeout(watchdog)
      setBusy(false)
      if (cameraRef.current) cameraRef.current.value = ''
      if (libraryRef.current) libraryRef.current.value = ''
    }
  }

  async function addFiles(list?: FileList | null) {
    if (!list?.length) return
    await addPhotos(Array.from(list))
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/class-notes')}
          className="mb-3 flex min-h-10 items-center gap-2 text-sm text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          All subjects
        </button>
        <p className={eyebrowClass}>Class notes</p>
        <h1 className={titleClass}>{item.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {item.course ? `${item.course} · ` : ''}
          {shots.length ? `${shots.length} page${shots.length === 1 ? '' : 's'}` : 'Empty album'}
        </p>
      </div>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-fg">Add against a date</h2>
        <p className="text-xs text-muted">Photos go into {item.name}, filed under the lecture date you pick.</p>
        <label className="block">
          <span className="text-xs text-muted">Lecture date</span>
          <input
            type="date"
            value={lectureDate}
            onChange={(event) => {
              const next = event.target.value || today
              setParams(next === today ? {} : { date: next }, { replace: true })
            }}
            className={`${fieldClass} mt-1 w-full`}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void openCamera()}
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
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </section>

      {shots.length === 0 ? (
        <p className="text-sm text-muted">No pages in {item.name} yet. Add from camera or the photo library.</p>
      ) : (
        groups.map(([date, pages]) => (
          <section key={date} className="space-y-3">
            <h2 className="text-sm font-semibold text-fg">{formatDayLabel(parseKey(date))}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pages.map((shot) => (
                <div key={shot.id} className="relative">
                  <PhotoThumb src={shot.url} onOpen={() => setPreview(shot)} />
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
          </section>
        ))
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={coarsePointer ? 'environment' : undefined}
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

      {cameraStream ? (
        <CameraCapture
          stream={cameraStream}
          onStream={(next) => setCameraStream(next)}
          onClose={closeCamera}
          onCapture={(file) => {
            closeCamera()
            void addPhotos([file])
          }}
        />
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-50 bg-black">
          <button type="button" className="absolute inset-0" aria-label="Close photo" onClick={() => setPreview(null)} />
          <img src={preview.url} alt="" className="relative h-full w-full object-contain" />
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-white/70">
            {formatDayLabel(parseKey(preview.date))}
          </p>
        </div>
      ) : null}
    </div>
  )
}
