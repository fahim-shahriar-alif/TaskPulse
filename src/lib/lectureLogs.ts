import type { LectureLog } from '../types'

export function lectureLogId(classId: string, date: string) {
  return `${classId}_${date}`
}

export function normalizeLectureLog(raw: Partial<LectureLog> & Pick<LectureLog, 'id'>): LectureLog {
  return {
    id: raw.id,
    classId: raw.classId || '',
    date: raw.date || '',
    body: raw.body || '',
    updatedAt: raw.updatedAt || Date.now(),
  }
}

export function lectureLogOn(logs: LectureLog[], classId: string, date: string) {
  return logs.find((item) => item.classId === classId && item.date === date) ?? null
}

export function logsForClass(logs: LectureLog[], classId: string) {
  return logs.filter((item) => item.classId === classId && item.body.trim())
}
