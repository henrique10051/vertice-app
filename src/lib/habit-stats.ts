import { addDays } from '@/lib/date-utils'

/** Consecutive-day streak ending today, tolerating today itself being incomplete. */
export function computeStreak(
  activeDates: Set<string>,
  today: string,
): number {
  let streak = 0
  let cursor = activeDates.has(today) ? today : addDays(today, -1)
  while (activeDates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest run of consecutive dates found within the given date list. */
export function computeLongestStreak(activeDates: Set<string>): number {
  let longest = 0
  const visited = new Set<string>()
  for (const date of activeDates) {
    if (visited.has(date)) continue
    let run = 0
    let cursor = date
    while (activeDates.has(cursor)) {
      run += 1
      visited.add(cursor)
      cursor = addDays(cursor, -1)
    }
    longest = Math.max(longest, run)
  }
  return longest
}
