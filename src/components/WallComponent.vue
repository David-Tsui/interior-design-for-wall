<template>
  <div class="wall-container">
    <div 
      class="wall"
      :class="{ 'drag-over': isDragOver, 'invalid-drop': isInvalidDrop }"
      :style="wallStyle"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
    >
      <BlockComponent
        v-for="block in blocks"
        :key="block.id"
        :block="block"
        :is-template="false"
        @block-moved="$emit('block-moved', block.id, $event.x, $event.y)"
        @block-removed="$emit('block-removed', block.id)"
      />
      
      <!-- Preview block during drag -->
      <div 
        v-if="previewBlock" 
        class="preview-block"
        :class="{ 'invalid': !previewBlock.valid }"
        :style="previewBlockStyle"
      ></div>
    </div>
    <div class="wall-info">
      {{ wall.width }}cm × {{ wall.height }}cm
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BlockComponent from './BlockComponent.vue'
import type { Block, Wall } from '../types'
import { canPlaceBlock } from '../utils/helpers'

interface Props {
  wall: Wall
  blocks: Block[]
}

interface Emits {
  (e: 'block-moved', blockId: string, x: number, y: number): void
  (e: 'block-removed', blockId: string): void
  (e: 'template-dropped', template: Block, position: { x: number, y: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isDragOver = ref(false)
const isInvalidDrop = ref(false)
const previewBlock = ref<{ x: number, y: number, width: number, height: number, valid: boolean } | null>(null)

const wallStyle = computed(() => ({
  width: `${props.wall.width}px`,
  height: `${props.wall.height}px`,
  backgroundColor: props.wall.backgroundColor
}))

const previewBlockStyle = computed(() => {
  if (!previewBlock.value) return {}
  return {
    left: `${previewBlock.value.x}px`,
    top: `${previewBlock.value.y}px`,
    width: `${previewBlock.value.width}px`,
    height: `${previewBlock.value.height}px`
  }
})

const onDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const onDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // Only hide drag over state if leaving the wall entirely
  if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
    previewBlock.value = null
    isInvalidDrop.value = false
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  // Basic dragover handling without reading drag data (not available during dragover in some browsers)
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  previewBlock.value = null
  isInvalidDrop.value = false
  
  const data = event.dataTransfer?.getData('text/plain')
  if (!data) return

  try {
    const dragData = JSON.parse(data)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = Math.max(0, Math.min(event.clientX - rect.left, props.wall.width - dragData.block.width))
    const y = Math.max(0, Math.min(event.clientY - rect.top, props.wall.height - dragData.block.height))
    
    if (dragData.type === 'template') {
      emit('template-dropped', dragData.block, { x, y })
    } else if (dragData.type === 'existing') {
      emit('block-moved', dragData.blockId, x, y)
    }
  } catch (error) {
    console.error('Error parsing drag data:', error)
  }
}
</script>

<style lang="scss" scoped>
.wall-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.wall {
  position: relative;
  border: 2px solid #bdc3c7;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-height: 200px;
  min-width: 200px;
  transition: border-color 0.3s ease;

  &.drag-over {
    border-color: #3498db;
    box-shadow: 0 4px 16px rgba(52, 152, 219, 0.3);
  }

  &.invalid-drop {
    border-color: #e74c3c;
    box-shadow: 0 4px 16px rgba(231, 76, 60, 0.3);
  }
}

.preview-block {
  position: absolute;
  border: 2px dashed #3498db;
  background-color: rgba(52, 152, 219, 0.2);
  border-radius: 4px;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.1s ease;

  &.invalid {
    border-color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.2);
  }
}

.wall-info {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}
</style>