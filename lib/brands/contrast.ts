/** WCAG relative luminance + foreground pick for brand surfaces. */

const LIGHT_FG = "#FAFAFA"
const DARK_FG = "#171717"

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null
  const expanded =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw
  const n = Number.parseInt(expanded, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function channelToLinear(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** WCAG 2.x relative luminance for sRGB hex. */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0.5
  const [r, g, b] = rgb.map(channelToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex)
  const l2 = relativeLuminance(backgroundHex)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Pick light or dark text — whichever yields higher contrast on `backgroundHex`.
 */
export function pickForeground(backgroundHex: string): string {
  const light = contrastRatio(LIGHT_FG, backgroundHex)
  const dark = contrastRatio(DARK_FG, backgroundHex)
  return light >= dark ? LIGHT_FG : DARK_FG
}

/** Muted companion for metadata; keeps hue of the main foreground. */
export function pickMutedForeground(
  backgroundHex: string,
  foregroundHex: string
): string {
  const isLight = foregroundHex.toUpperCase() === LIGHT_FG
  const rgb = parseHex(foregroundHex)
  if (!rgb) {
    return isLight ? "rgba(250, 250, 250, 0.72)" : "rgba(23, 23, 23, 0.62)"
  }
  const [r, g, b] = rgb
  const alpha = isLight ? 0.72 : 0.62
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
