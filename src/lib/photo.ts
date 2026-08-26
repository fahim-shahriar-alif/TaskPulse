const MAX_INPUT_BYTES = 8 * 1024 * 1024
const OUTPUT_SIZE = 512
const MAX_DATA_URL = 220_000

export async function photoDataUrl(file: File) {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Choose a photo.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Use a photo under 8 MB.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('That image format is not supported. Try a JPEG or PNG.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not process that photo.')
  }

  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  bitmap.close()

  let quality = 0.84
  let url = canvas.toDataURL('image/jpeg', quality)
  while (url.length > MAX_DATA_URL && quality > 0.4) {
    quality -= 0.08
    url = canvas.toDataURL('image/jpeg', quality)
  }
  if (url.length > MAX_DATA_URL) {
    throw new Error('That photo is too detailed. Try a simpler or smaller image.')
  }
  return url
}
