import type { ScheduleSlot } from '../types'

const DEFAULT_ACTIVITIES = [
  ['07:30', 'Morning routine'],
  ['08:30', 'Deep work'],
  ['09:30', 'Deep work'],
  ['10:30', 'Short break'],
  ['11:30', 'Focus sprint'],
  ['12:30', 'Lunch'],
  ['13:30', 'Study / work block'],
  ['14:30', 'Study / work block'],
  ['15:30', 'Break / walk'],
  ['16:30', 'Workout'],
  ['17:30', 'Admin / inbox'],
  ['18:30', 'Dinner'],
  ['19:30', 'Personal projects'],
  ['20:30', 'Reading'],
  ['21:30', 'Wind down'],
  ['22:30', 'Plan tomorrow'],
  ['23:30', 'Sleep prep'],
] as const

export function defaultSchedule(): ScheduleSlot[] {
  return DEFAULT_ACTIVITIES.map(([time, activity]) => ({
    id: `slot-${time}`,
    time,
    activity,
  }))
}

export const DEFAULT_HABITS = ['Deep work', 'Move body', 'Read 20 min']
