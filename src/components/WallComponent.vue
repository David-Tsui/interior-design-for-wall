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
      @click="onWallClick"
    >
      <BlockComponent
        v-for="block in blocks"
        :key="block.id"
        :block="block"
        :is-template="false"
        :show-overflow-warnings="showOverflowWarnings"
        :is-selected="selectedBlockId === block.id"
        @block-moved="$emit('block-moved', block.id, $event.x, $event.y)"
        @block-removed="$emit('block-removed', block.id)"
        @block-selected="$emit('block-selected', block.id)"
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
import type { Block, DragData, Wall } from '../types'

interface Props {
  wall: Wall
  blocks: Block[]
  showOverflowWarnings?: boolean
  hideOverflowBlocks?: boolean
  selectedBlockId?: string | null
}

interface Emits {
  (e: 'block-moved', blockId: string, x: number, y: number): void
  (e: 'block-removed', blockId: string): void
  (e: 'block-selected', blockId: string): void
  (e: 'template-dropped', template: Block, position: { x: number, y: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isDragOver = ref(false)
const isInvalidDrop = ref(false)
const previewBlock = ref<{ x: number, y: number, width: number, height: number, valid: boolean } | null>(null)

const wallStyle = computed(() => {
  // Calculate responsive size based on container width
  const baseWidth = 315
  const containerWidth = Math.min(800, window.innerWidth * 0.6) // Max 800px, 60% of viewport
  const scaleFactor = containerWidth / baseWidth

  return {
    width: `${props.wall.width * scaleFactor}px`,
    height: `${props.wall.height * scaleFactor}px`,
    backgroundColor: props.wall.backgroundColor,
    '--scale-factor': scaleFactor,
    overflow: props.hideOverflowBlocks ? 'hidden' : 'visible'
  }
})

const previewBlockStyle = computed(() => {
  if (!previewBlock.value) return {}
  const scaleFactor = wallStyle.value['--scale-factor'] as number
  return {
    left: `${previewBlock.value.x * scaleFactor}px`,
    top: `${previewBlock.value.y * scaleFactor}px`,
    width: `${previewBlock.value.width * scaleFactor}px`,
    height: `${previewBlock.value.height * scaleFactor}px`
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
    const dragData: DragData = JSON.parse(data)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const scaleFactor = wallStyle.value['--scale-factor'] as number

    // Convert from scaled coordinates back to logical coordinates
    const scaledX = event.clientX - rect.left
    const scaledY = event.clientY - rect.top
    const x = Math.max(0, Math.min(scaledX / scaleFactor, props.wall.width - dragData.block.width))
    const y = Math.max(0, Math.min(scaledY / scaleFactor, props.wall.height - dragData.block.height))

    if (dragData.type === 'template') {
      emit('template-dropped', dragData.block, { x, y })
    } else if (dragData.type === 'existing') {
      emit('block-moved', dragData.block.id, x, y)
    }
  } catch (error) {
    console.error('Error parsing drag data:', error)
  }
}

const onWallClick = (event: MouseEvent) => {
  // Only deselect if clicking on the wall itself (not a block)
  if (event.target === event.currentTarget) {
    emit('block-selected', '') // Empty string to deselect all blocks
  }
}
</script>

<style lang="scss" scoped>
.wall-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.wall {
  position: relative;
  border: 2px solid #ddd;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  min-height: 200px;
  min-width: 200px;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px),
      linear-gradient(180deg, rgba(0,0,0,0.03) 1px, transparent 1px);
    background-size: calc(var(--scale-factor, 1) * 20px) calc(var(--scale-factor, 1) * 20px);
    pointer-events: none;
    z-index: 1;
  }

  &.drag-over {
    border-color: #3498db;
    box-shadow:
      0 12px 40px rgba(52, 152, 219, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 0 0 4px rgba(52, 152, 219, 0.15);
  }

  &.invalid-drop {
    border-color: #e74c3c;
    box-shadow:
      0 12px 40px rgba(231, 76, 60, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 0 0 4px rgba(231, 76, 60, 0.15);
  }
}

.preview-block {
  position: absolute;
  border: 2px dashed #3498db;
  background-color: rgba(52, 152, 219, 0.15);
  border-radius: 6px;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.1s ease;

  &.invalid {
    border-color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.15);
  }
}

.wall-info {
  font-size: 14px;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .wall-container {
    gap: 1rem;
  }
}
</style>
