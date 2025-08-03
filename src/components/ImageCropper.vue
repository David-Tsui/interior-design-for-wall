<template>
  <div class="image-cropper-overlay" v-if="visible" @click="onCancel">
    <div class="image-cropper" @click.stop>
      <h3>Crop Texture Image</h3>
      
      <div class="crop-container" ref="cropContainer">
        <img
          ref="imageRef"
          :src="imageUrl"
          @load="onImageLoad"
          class="crop-image"
        />
        
        <div
          class="crop-selection"
          :style="selectionStyle"
          @mousedown="startDrag"
        >
          <div class="crop-handle" data-handle="nw"></div>
          <div class="crop-handle" data-handle="ne"></div>
          <div class="crop-handle" data-handle="sw"></div>
          <div class="crop-handle" data-handle="se"></div>
        </div>
      </div>
      
      <div class="crop-controls">
        <button @click="onCancel" class="button secondary">Cancel</button>
        <button @click="onCrop" class="button">Crop & Use</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { cropImage } from '../utils/textureUpload'

interface Props {
  visible: boolean
  imageUrl: string
}

interface Emits {
  (e: 'cropped', croppedImage: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const cropContainer = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()

// Crop selection state
const selection = ref({
  x: 50,
  y: 50,
  width: 200,
  height: 200
})

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragHandle = ref('')

const selectionStyle = computed(() => ({
  left: `${selection.value.x}px`,
  top: `${selection.value.y}px`,
  width: `${selection.value.width}px`,
  height: `${selection.value.height}px`
}))

const onImageLoad = () => {
  if (!imageRef.value) return
  
  // Center the selection on the image
  const img = imageRef.value
  selection.value = {
    x: Math.max(0, (img.clientWidth - 200) / 2),
    y: Math.max(0, (img.clientHeight - 200) / 2),
    width: Math.min(200, img.clientWidth - 20),
    height: Math.min(200, img.clientHeight - 20)
  }
}

const startDrag = (event: MouseEvent) => {
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  dragHandle.value = (event.target as HTMLElement).dataset.handle || 'move'
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value || !imageRef.value) return
  
  const deltaX = event.clientX - dragStart.value.x
  const deltaY = event.clientY - dragStart.value.y
  
  const imgRect = imageRef.value.getBoundingClientRect()
  
  const maxX = imgRect.width - selection.value.width
  const maxY = imgRect.height - selection.value.height
  
  if (dragHandle.value === 'move') {
    // Move the entire selection
    selection.value.x = Math.max(0, Math.min(maxX, selection.value.x + deltaX))
    selection.value.y = Math.max(0, Math.min(maxY, selection.value.y + deltaY))
  } else {
    // Resize based on handle
    const minSize = 50
    
    if (dragHandle.value.includes('e')) {
      selection.value.width = Math.max(minSize, Math.min(imgRect.width - selection.value.x, selection.value.width + deltaX))
    }
    if (dragHandle.value.includes('w')) {
      const newWidth = selection.value.width - deltaX
      if (newWidth >= minSize) {
        selection.value.x = Math.max(0, selection.value.x + deltaX)
        selection.value.width = newWidth
      }
    }
    if (dragHandle.value.includes('s')) {
      selection.value.height = Math.max(minSize, Math.min(imgRect.height - selection.value.y, selection.value.height + deltaY))
    }
    if (dragHandle.value.includes('n')) {
      const newHeight = selection.value.height - deltaY
      if (newHeight >= minSize) {
        selection.value.y = Math.max(0, selection.value.y + deltaY)
        selection.value.height = newHeight
      }
    }
  }
  
  dragStart.value = { x: event.clientX, y: event.clientY }
}

const stopDrag = () => {
  isDragging.value = false
  dragHandle.value = ''
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const onCrop = async () => {
  if (!imageRef.value) return
  
  try {
    // Calculate the actual crop coordinates relative to the original image
    const img = imageRef.value
    const scaleX = img.naturalWidth / img.clientWidth
    const scaleY = img.naturalHeight / img.clientHeight
    
    const cropArea = {
      x: selection.value.x * scaleX,
      y: selection.value.y * scaleY,
      width: selection.value.width * scaleX,
      height: selection.value.height * scaleY
    }
    
    const croppedImage = await cropImage(props.imageUrl, cropArea)
    emit('cropped', croppedImage)
  } catch (error) {
    console.error('Failed to crop image:', error)
    alert('Failed to crop image. Please try again.')
  }
}

const onCancel = () => {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
.image-cropper-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-cropper {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h3 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
    text-align: center;
  }
}

.crop-container {
  position: relative;
  display: inline-block;
  max-width: 500px;
  max-height: 400px;
  overflow: hidden;
  border: 2px solid #ddd;
  border-radius: 8px;
}

.crop-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  user-select: none;
}

.crop-selection {
  position: absolute;
  border: 2px solid #3498db;
  background: rgba(52, 152, 219, 0.1);
  cursor: move;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px dashed rgba(52, 152, 219, 0.5);
  }
}

.crop-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #3498db;
  border: 2px solid white;
  border-radius: 50%;
  
  &[data-handle="nw"] {
    top: -6px;
    left: -6px;
    cursor: nw-resize;
  }
  
  &[data-handle="ne"] {
    top: -6px;
    right: -6px;
    cursor: ne-resize;
  }
  
  &[data-handle="sw"] {
    bottom: -6px;
    left: -6px;
    cursor: sw-resize;
  }
  
  &[data-handle="se"] {
    bottom: -6px;
    right: -6px;
    cursor: se-resize;
  }
}

.crop-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(145deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  }

  &.secondary {
    background: linear-gradient(145deg, #95a5a6, #7f8c8d);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(149, 165, 166, 0.4);
    }
  }
}
</style>