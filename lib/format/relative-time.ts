const rtf = new Intl.RelativeTimeFormat("nl", { numeric: "auto" })

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
]

/**
 * Returns a Dutch relative time string (e.g. "2 dagen geleden").
 * Server-safe — uses Intl.RelativeTimeFormat only.
 */
export function relativeTime(
  date: Date | string,
  now: Date = new Date()
): string {
  const target = typeof date === "string" ? new Date(date) : date
  const diffSec = Math.round((target.getTime() - now.getTime()) / 1000)

  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(diffSec) >= secondsInUnit || unit === "second") {
      const value = Math.round(diffSec / secondsInUnit)
      return rtf.format(value, unit)
    }
  }

  return rtf.format(0, "second")
}
