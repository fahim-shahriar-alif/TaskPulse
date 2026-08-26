import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebase } from './firebase'
import { lecturePhotoBlob } from './photo'
import type { ClassNote } from '../types'

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

export function normalizeClassNote(raw: Partial<ClassNote> & Pick<ClassNote, 'id'>): ClassNote {
  return {
    id: raw.id,
    classId: raw.classId || '',
    date: raw.date || '',
    url: raw.url || '',
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

function notePath(uid: string, classId: string, id: string) {
  return `users/${uid}/subjects/${classId}/${id}.jpg`
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
      const file = ref(firebase.storage, notePath(uid, classId, id))
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

export async function buildClassNote(uid: string, classId: string, date: string, file: File): Promise<ClassNote> {
  const id = crypto.randomUUID()
  const blob = await withTimeout(lecturePhotoBlob(file), 12000, 'That photo took too long to process. Try a JPEG of one page.')
  const url = await storeImage(uid, classId, id, blob)
  return {
    id,
    classId,
    date,
    url,
    createdAt: Date.now(),
  }
}

export async function deleteClassNoteFile(uid: string, note: ClassNote) {
  if (!note.url || note.url.startsWith('data:')) return
  const firebase = getFirebase()
  if (!firebase?.storage) return
  try {
    await deleteObject(ref(firebase.storage, notePath(uid, note.classId, note.id)))
  } catch {
    try {
      await deleteObject(ref(firebase.storage, legacyNotePath(uid, note.id)))
    } catch {
      /* already gone */
    }
  }
}
