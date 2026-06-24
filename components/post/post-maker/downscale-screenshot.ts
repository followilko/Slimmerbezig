/** Max long edge before JPEG downscale (keeps payloads under Vercel limits). */
const MAX_LONG_EDGE = 1600
const JPEG_QUALITY = 0.8

/**
 * Downscale an image file to a JPEG data URL suitable for vision API upload.
 * Runs entirely in the browser; the original file is never persisted.
 */
export async function downscaleScreenshot(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const longEdge = Math.max(width, height)
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas_unavailable")
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY)
}

/** True when a clipboard/drop item is an image we can ingest. */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}
