/** UTC Monday boundary for `(user_id, week_start)` unique index on weekly_checkins. */
export function currentWeekStartUtc(date = new Date()): string {
  const dow = date.getUTCDay() // Sun=0 … Sat=6
  const delta = dow === 0 ? -6 : 1 - dow
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + delta)
  )
  return monday.toISOString().slice(0, 10)
}
