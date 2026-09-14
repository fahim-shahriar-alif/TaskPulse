import type { Attendance, AttendanceStatus } from '../types'

export function attendanceId(classId: string, date: string) {
  return `${classId}_${date}`
}

export function normalizeAttendance(raw: Partial<Attendance> & Pick<Attendance, 'id'>): Attendance {
  return {
    id: raw.id,
    classId: raw.classId || '',
    date: raw.date || '',
    status: raw.status === 'missed' ? 'missed' : 'present',
  }
}

export function attendanceOn(records: Attendance[], classId: string, date: string) {
  return records.find((item) => item.classId === classId && item.date === date) ?? null
}

export function attendanceSummary(records: Attendance[], classId: string) {
  const list = records.filter((item) => item.classId === classId)
  return {
    present: list.filter((item) => item.status === 'present').length,
    missed: list.filter((item) => item.status === 'missed').length,
  }
}

export function toggleAttendanceStatus(
  current: AttendanceStatus | undefined,
  next: AttendanceStatus,
): AttendanceStatus | null {
  return current === next ? null : next
}
