import { FirebaseError } from 'firebase/app'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebase } from './firebase'
import { lecturePhotoBlob } from './photo'
import type { ClassNote, ClassNoteKind } from '../types'

const MAX_PDF_BYTES = 10 * 1024 * 1024
const PDF_WAIT_MS = 90000

const STORAGE_WAIT_MS = 8000
const FIRESTORE_URL_MAX = 700_000

function skipStorageKey(uid: string) {
  return `tp-skip-storage-${uid}`
}

function shouldSkipStorage(uid: string) {
  try {
    return sessionStorage.getItem(skipStorageKey(uid)) === '1'
  } catch {
    return false
  }
}

function rememberSkipStorage(uid: string) {
  try {
    sessionStorage.setItem(skipStorageKey(uid), '1')
  } catch {
    /* private mode */
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        window.clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export function isPdfNote(note: Pick<ClassNote, 'kind' | 'url' | 'name'>) {
  if (note.kind === 'pdf') return true
  if (note.kind === 'image') return false
  const name = (note.name || note.url).toLowerCase()
  return name.includes('.pdf') || note.url.startsWith('data:application/pdf')
}

export function normalizeClassNote(raw: Partial<ClassNote> & Pick<ClassNote, 'id'>): ClassNote {
  const url = raw.url || ''
  const name = raw.name || ''
  const kind: ClassNoteKind =
    raw.kind === 'pdf' || raw.kind === 'image'
      ? raw.kind
      : url.toLowerCase().includes('.pdf') || name.toLowerCase().endsWith('.pdf')
        ? 'pdf'
        : 'image'
  return {
    id: raw.id,
    classId: raw.classId || '',
    date: raw.date || '',
    url,
    kind,
    name,
    createdAt: raw.createdAt || Date.now(),
  }
}

export function notesForClass(notes: ClassNote[], classId: string) {
  return notes
    .filter((item) => item.classId === classId && item.url)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function classNotesOn(notes: ClassNote[], classId: string, date: string) {
  return notesForClass(notes, classId).filter((item) => item.date === date)
}

export function groupClassNotesByDate(notes: ClassNote[]) {
  const map = new Map<string, ClassNote[]>()
  for (const item of notes) {
    const list = map.get(item.date) ?? []
    list.push(item)
    map.set(item.date, list)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

function notePath(uid: string, classId: string, id: string, ext = 'jpg') {
  return `users/${uid}/subjects/${classId}/${id}.${ext}`
}

function legacyNotePath(uid: string, id: string) {
  return `users/${uid}/classNotes/${id}.jpg`
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read that photo.'))
    reader.readAsDataURL(blob)
  })
}

async function storeImage(uid: string, classId: string, id: string, blob: Blob) {
  const firebase = getFirebase()
  if (firebase?.storage && !shouldSkipStorage(uid)) {
    try {
      const file = ref(firebase.storage, notePath(uid, classId, id, 'jpg'))
      await withTimeout(uploadBytes(file, blob, { contentType: 'image/jpeg' }), STORAGE_WAIT_MS, 'storage-timeout')
      return await withTimeout(getDownloadURL(file), STORAGE_WAIT_MS, 'storage-timeout')
    } catch {
      rememberSkipStorage(uid)
    }
  }
  const url = await blobToDataUrl(blob)
  if (url.length > FIRESTORE_URL_MAX) {
    throw new Error('Could not save that photo. Try a closer shot of one page.')
  }
  return url
}

function pdfUploadMessage(err: unknown) {
  if (err instanceof FirebaseError) {
    if (err.code === 'storage/unauthorized') {
      return 'Storage blocked that PDF. In Firebase, open Storage → Rules and publish the PDF rules.'
    }
    if (err.code === 'storage/retry-limit-exceeded' || err.code === 'storage/canceled') {
      return 'Upload stopped. Try again on a better connection.'
    }
    if (err.code === 'storage/quota-exceeded') {
      return 'Storage quota is full.'
    }
  }
  if (err instanceof Error && err.message.includes('too long')) {
    return 'Storage did not finish. Confirm Storage is on for this project, then try a smaller PDF.'
  }
  return err instanceof Error ? err.message : 'Could not upload that PDF.'
}

async function storePdf(uid: string, classId: string, id: string, file: File) {
  const firebase = getFirebase()
  if (!firebase?.storage) {
    throw new Error('PDFs need Firebase Storage. Photos still save without it.')
  }
  const fileRef = ref(firebase.storage, notePath(uid, classId, id, 'pdf'))
  try {
    await withTimeout(
      uploadBytes(fileRef, file, { contentType: 'application/pdf' }),
      PDF_WAIT_MS,
      'That PDF took too long.',
    )
    return await withTimeout(getDownloadURL(fileRef), 15000, 'That PDF took too long.')
  } catch (err) {
    throw new Error(pdfUploadMessage(err))
  }
}

export async function buildClassNote(uid: string, classId: string, date: string, file: File): Promise<ClassNote> {
  const id = crypto.randomUUID()
  if (isPdfFile(file)) {
    if (file.size > MAX_PDF_BYTES) {
      throw new Error('Use a PDF under 10 MB.')
    }
    const url = await storePdf(uid, classId, id, file)
    return {
      id,
      classId,
      date,
      url,
      kind: 'pdf',
      name: file.name || 'Notes.pdf',
      createdAt: Date.now(),
    }
  }
  const blob = await withTimeout(lecturePhotoBlob(file), 12000, 'That photo took too long to process. Try a JPEG of one page.')
  const url = await storeImage(uid, classId, id, blob)
  return {
    id,
    classId,
    date,
    url,
    kind: 'image',
    name: file.name || '',
    createdAt: Date.now(),
  }
}

export async function deleteClassNoteFile(uid: string, note: ClassNote) {
  if (!note.url || note.url.startsWith('data:')) return
  const firebase = getFirebase()
  if (!firebase?.storage) return
  const ext = isPdfNote(note) ? 'pdf' : 'jpg'
  try {
    await deleteObject(ref(firebase.storage, notePath(uid, note.classId, note.id, ext)))
  } catch {
    try {
      await deleteObject(ref(firebase.storage, notePath(uid, note.classId, note.id, ext === 'pdf' ? 'jpg' : 'pdf')))
    } catch {
      try {
        await deleteObject(ref(firebase.storage, legacyNotePath(uid, note.id)))
      } catch {
        /* already gone */
      }
    }
  }
}
