import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebase } from './firebase'
import { lecturePhotoBlob } from './photo'
import type { ClassNote } from '../types'

export function normalizeClassNote(raw: Partial<ClassNote> & Pick<ClassNote, 'id'>): ClassNote {
  return {
    id: raw.id,
    classId: raw.classId || '',
    date: raw.date || '',
    url: raw.url || '',
    createdAt: raw.createdAt || Date.now(),
  }
}

export function classNotesOn(notes: ClassNote[], classId: string, date: string) {
  return notes
    .filter((item) => item.classId === classId && item.date === date && item.url)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function classNoteDates(notes: ClassNote[], classId: string) {
  return [...new Set(notes.filter((item) => item.classId === classId && item.url).map((item) => item.date))].sort(
    (a, b) => b.localeCompare(a),
  )
}

function notePath(uid: string, id: string) {
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

async function storeImage(uid: string, id: string, blob: Blob) {
  const firebase = getFirebase()
  if (firebase?.storage) {
    try {
      const file = ref(firebase.storage, notePath(uid, id))
      await uploadBytes(file, blob, { contentType: 'image/jpeg' })
      return await getDownloadURL(file)
    } catch {
      /* Storage may be off — keep the photo in Firestore instead. */
    }
  }
  const url = await blobToDataUrl(blob)
  if (url.length > 900_000) {
    throw new Error('Could not save that photo. Enable Firebase Storage or try a smaller shot.')
  }
  return url
}

export async function buildClassNote(uid: string, classId: string, date: string, file: File): Promise<ClassNote> {
  const id = crypto.randomUUID()
  const blob = await lecturePhotoBlob(file)
  const url = await storeImage(uid, id, blob)
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
    await deleteObject(ref(firebase.storage, notePath(uid, note.id)))
  } catch {
    /* already gone */
  }
}
