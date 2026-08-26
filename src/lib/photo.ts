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

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process that photo.'))),
      'image/jpeg',
      quality,
    )
  })
}

export async function lecturePhotoBlob(file: File) {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Choose a photo of your notes.')
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

  const maxEdge = 1600
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not process that photo.')
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const maxBytes = 700_000
  let quality = 0.82
  let blob = await canvasBlob(canvas, quality)
  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08
    blob = await canvasBlob(canvas, quality)
  }
  if (blob.size > 900_000) {
    throw new Error('That photo is too detailed. Try a closer shot of one page.')
  }
  return blob
}
