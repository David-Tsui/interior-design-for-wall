// Simple texture upload and processing utilities

export function uploadImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resolve(result)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    }

    input.click()
  })
}

export function cropImage(imageDataUrl: string, cropArea: { x: number, y: number, width: number, height: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      // Set canvas size to crop area
      canvas.width = cropArea.width
      canvas.height = cropArea.height

      // Draw cropped image
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source rectangle
        0, 0, cropArea.width, cropArea.height // Destination rectangle
      )

      resolve(canvas.toDataURL())
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

export function blendImageWithColor(imageDataUrl: string, color: string, blendStrength = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      // Use a reasonable size for texture tiles
      const size = 128
      canvas.width = size
      canvas.height = size

      // Draw and scale the image to fit
      ctx.drawImage(img, 0, 0, size, size)

      // Apply color overlay
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = color
      ctx.globalAlpha = blendStrength
      ctx.fillRect(0, 0, size, size)

      // Add some original image back for texture detail
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 1 - blendStrength
      ctx.drawImage(img, 0, 0, size, size)

      resolve(canvas.toDataURL())
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

export function resizeImageForCropping(imageDataUrl: string, maxSize = 400): Promise<{ dataUrl: string, originalWidth: number, originalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const originalWidth = img.width
      const originalHeight = img.height

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = originalWidth
      let newHeight = originalHeight

      if (originalWidth > maxSize || originalHeight > maxSize) {
        const ratio = Math.min(maxSize / originalWidth, maxSize / originalHeight)
        newWidth = originalWidth * ratio
        newHeight = originalHeight * ratio
      }

      canvas.width = newWidth
      canvas.height = newHeight

      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      resolve({
        dataUrl: canvas.toDataURL(),
        originalWidth,
        originalHeight
      })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}
