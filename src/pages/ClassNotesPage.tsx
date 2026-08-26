import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Camera, ImagePlus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { buildClassNote, groupClassNotesByDate, notesForClass } from '../lib/classNotes'
import { nowDate } from '../lib/clock'
import { formatDayLabel, parseKey, todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { ClassNote, UniClass } from '../types'

export function ClassNotesPage() {
  const { classId } = useParams()
  const { classes } = useStore()
  const item = classes.find((entry) => entry.id === classId)
  if (classId && !item) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
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
    <div className="mx-auto max-w-3xl space-y-5">
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
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const shots = notesForClass(classNotes, item.id)
  const groups = groupClassNotesByDate(shots)

  async function addFiles(list?: FileList | null) {
    const uid = user?.uid
    if (!uid || !list?.length) return
    setBusy(true)
    setError('')
    try {
      for (const file of Array.from(list)) {
        const note = await buildClassNote(uid, item.id, lectureDate, file)
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
    <div className="mx-auto max-w-3xl space-y-5">
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
                  <button
                    type="button"
                    onClick={() => setPreview(shot)}
                    className="block w-full overflow-hidden rounded-3xl ring-1 ring-line"
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
          </section>
        ))
      )}

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

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/80" aria-label="Close photo" onClick={() => setPreview(null)} />
          <div className="relative max-h-full max-w-full">
            <img src={preview.url} alt="" className="max-h-[90dvh] max-w-full rounded-2xl object-contain" />
            <p className="mt-2 text-center text-xs text-white/70">{formatDayLabel(parseKey(preview.date))}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
