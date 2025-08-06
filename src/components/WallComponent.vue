<template>
  <div class="wall-container">
    <div
      class="wall"
      :class="{ 'drag-over': isDragOver, 'invalid-drop': isInvalidDrop, 'debug-mode': debugMode }"
      :style="wallStyle"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @click="onWallClick"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
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

      <!-- Debug overlay -->
      <div 
        v-if="debugMode" 
        class="debug-overlay"
        :style="{ '--scale-factor': wallStyle['--scale-factor'] }"
      >
        <!-- Grid lines every 15px -->
        <div class="debug-grid"></div>
        
        <!-- Position indicator at mouse -->
        <div 
          v-if="debugMousePosition" 
          class="debug-position"
          :style="{
            left: `${debugMousePosition.x}px`,
            top: `${debugMousePosition.y}px`
          }"
        >
          <span class="debug-coords">
            ({{ Math.round(debugMousePosition.logicalX) }}, {{ Math.round(debugMousePosition.logicalY) }})
          </span>
        </div>

        <!-- Simplified debug mode - no complex position hints needed -->
      </div>
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
import { hasSmallIntersection, findBestPositionAroundBlock } from '../utils/helpers'

interface Props {
  wall: Wall
  blocks: Block[]
  showOverflowWarnings?: boolean
  hideOverflowBlocks?: boolean
  debugMode?: boolean
  intersectionThreshold?: number
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
const debugMousePosition = ref<{ x: number, y: number, logicalX: number, logicalY: number } | null>(null)

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
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as Node | null
  if (!currentTarget?.contains(relatedTarget)) {
    isDragOver.value = false
    previewBlock.value = null
    isInvalidDrop.value = false
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  // Basic dragover handling - no complex positioning needed
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
    const rawX = scaledX / scaleFactor
    const rawY = scaledY / scaleFactor

    if (props.debugMode) {
      console.group(`🐛 DEBUG: Wall Drop Event`)
      console.log(`Drop Type: ${dragData.type}`)
      console.log(`Raw Mouse Position: (${event.clientX}, ${event.clientY})`)
      console.log(`Wall Rect: ${rect.left}, ${rect.top}, ${rect.width}x${rect.height}`)
      console.log(`Scale Factor: ${scaleFactor}`)
      console.log(`Scaled Position: (${scaledX}, ${scaledY})`)
      console.log(`Logical Position: (${rawX}, ${rawY})`)
      console.log(`Block Size: ${dragData.block.width}x${dragData.block.height}`)
    }

    // Smart intersection logic - check if intersection is too small
    const testBlock = {
      x: rawX,
      y: rawY,
      width: dragData.block.width,
      height: dragData.block.height
    }

    const excludeBlockId = dragData.type === 'existing' ? dragData.block.id : undefined
    const threshold = props.intersectionThreshold || 25
    
    const intersectionCheck = hasSmallIntersection(
      testBlock,
      props.blocks,
      threshold,
      excludeBlockId
    )

    let finalPosition = { x: rawX, y: rawY }

    if (intersectionCheck.hasSmallIntersection) {
      if (props.debugMode) {
        console.log(`⚠️ Small intersection detected (${intersectionCheck.collidingBlocks.map(c => c.intersectionPercent.toFixed(1)).join(', ')}%) - attempting auto-positioning`)
      }

      // Try to find a better position around the first colliding block
      const firstCollidingBlock = intersectionCheck.collidingBlocks[0].block
      const betterPosition = findBestPositionAroundBlock(
        { width: dragData.block.width, height: dragData.block.height },
        firstCollidingBlock,
        { x: rawX, y: rawY },
        props.blocks,
        props.wall,
        excludeBlockId
      )

      if (betterPosition) {
        finalPosition = betterPosition
        if (props.debugMode) {
          console.log(`✅ AUTO-POSITIONED: Found better position (${betterPosition.x}, ${betterPosition.y})`)
        }
      } else {
        if (props.debugMode) {
          console.log(`⚠️ Could not find better position - keeping original (${rawX}, ${rawY})`)
        }
      }
    } else if (props.debugMode) {
      if (intersectionCheck.collidingBlocks.length > 0) {
        console.log(`✅ Large intersection allowed (${intersectionCheck.collidingBlocks.map(c => c.intersectionPercent.toFixed(1)).join(', ')}%) - placing at exact position`)
      } else {
        console.log(`✅ No intersections - placing at exact position (${rawX}, ${rawY})`)
      }
    }

    // Place the block at the drop position
    if (dragData.type === 'template') {
      emit('template-dropped', dragData.block, finalPosition)
    } else if (dragData.type === 'existing') {
      emit('block-moved', dragData.block.id, finalPosition.x, finalPosition.y)
    }

    if (props.debugMode) {
      console.groupEnd()
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

const onMouseMove = (event: MouseEvent) => {
  if (!props.debugMode) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const scaleFactor = wallStyle.value['--scale-factor'] as number
  
  const scaledX = event.clientX - rect.left
  const scaledY = event.clientY - rect.top
  const logicalX = scaledX / scaleFactor
  const logicalY = scaledY / scaleFactor

  debugMousePosition.value = {
    x: scaledX,
    y: scaledY,
    logicalX,
    logicalY
  }

  // Don't show position hints during regular mouse hover
  // Position hints are only shown during active drag operations
}

const onMouseLeave = () => {
  if (props.debugMode) {
    debugMousePosition.value = null
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

  &.debug-mode {
    border-color: #e67e22;
    box-shadow:
      0 12px 40px rgba(230, 126, 34, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 0 0 2px rgba(230, 126, 34, 0.3);
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

.debug-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1001;
}

.debug-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(to right, rgba(230, 126, 34, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(230, 126, 34, 0.3) 1px, transparent 1px);
  background-size: calc(var(--scale-factor, 1) * 15px) calc(var(--scale-factor, 1) * 15px);
}

.debug-position {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 1002;
  
  .debug-coords {
    display: inline-block;
    background: rgba(230, 126, 34, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    font-family: monospace;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    margin-bottom: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: rgba(230, 126, 34, 0.9);
    }
  }
}

/* Simplified styles - no complex positioning hints needed */

.wall-info {
  font-size: 14px;
  color: #a0aec0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 16px;
  background: rgba(45, 45, 55, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .wall-container {
    gap: 1rem;
  }
}
</style>
