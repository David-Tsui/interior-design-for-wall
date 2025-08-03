<template>
  <div
    class="block"
    :class="{
      'is-template': isTemplate,
      'is-dragging': isDragging,
      'is-overflow': !isTemplate && block.isOverflow && (showWarnings !== false),
      'is-selected': !isTemplate && isSelected
    }"
    :style="blockStyle"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dblclick="onDoubleClick"
    @click="onBlockClick"
  >
    <div class="block-info" v-if="isTemplate">
      {{ block.width }}×{{ block.height }}
    </div>
    <div class="remove-btn" v-if="!isTemplate" @click="onRemove">×</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Block } from '../types'
import { generateId } from '../utils/helpers'

interface Props {
  block: Block
  isTemplate: boolean
  showWarnings?: boolean
  isSelected?: boolean
}

interface Emits {
  (e: 'template-used', block: Block): void
  (e: 'block-moved', position: { x: number, y: number }): void
  (e: 'block-removed'): void
  (e: 'block-selected'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isDragging = ref(false)

const blockStyle = computed(() => {
  // Get scale factor from CSS custom property or calculate it
  const baseWidth = 315
  const containerWidth = Math.min(800, (typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.6)
  const scaleFactor = containerWidth / baseWidth

  const style: any = {
    width: props.isTemplate ? `${props.block.width * 1.3}px` : `${props.block.width * scaleFactor}px`,
    height: props.isTemplate ? `${props.block.height * 1.3}px` : `${props.block.height * scaleFactor}px`,
    backgroundColor: props.block.color
  }

  if (!props.isTemplate) {
    style.position = 'absolute'
    style.left = `${props.block.x * scaleFactor}px`
    style.top = `${props.block.y * scaleFactor}px`
  }

  return style
})

const onDragStart = (event: DragEvent) => {
  isDragging.value = true

  if (props.isTemplate) {
    const newBlock: Block = {
      id: generateId(),
      x: 0,
      y: 0,
      width: props.block.width,
      height: props.block.height,
      color: props.block.color
    }

    const dragData = {
      type: 'template',
      block: newBlock
    }

    event.dataTransfer?.setData('text/plain', JSON.stringify(dragData))
  } else {
    const dragData = {
      type: 'existing',
      block: props.block
    }
    event.dataTransfer?.setData('text/plain', JSON.stringify(dragData))
  }
}

const onDragEnd = (event: DragEvent) => {
  isDragging.value = false

  if (!props.isTemplate) {
    const wall = (event.target as HTMLElement)?.closest('.wall')
    if (wall) {
      const rect = wall.getBoundingClientRect()
      const baseWidth = 315
      const containerWidth = Math.min(800, window.innerWidth * 0.6)
      const scaleFactor = containerWidth / baseWidth

      // Convert from scaled coordinates back to logical coordinates
      const scaledX = event.clientX - rect.left - (props.block.width * scaleFactor) / 2
      const scaledY = event.clientY - rect.top - (props.block.height * scaleFactor) / 2
      const x = Math.max(0, Math.min(scaledX / scaleFactor, (wall.clientWidth / scaleFactor) - props.block.width))
      const y = Math.max(0, Math.min(scaledY / scaleFactor, (wall.clientHeight / scaleFactor) - props.block.height))

      emit('block-moved', { x, y })
    }
  }
}

const onDoubleClick = () => {
  if (!props.isTemplate) {
    onRemove()
  }
}

const onRemove = () => {
  if (!props.isTemplate) {
    emit('block-removed')
  }
}

const onBlockClick = (event: MouseEvent) => {
  if (!props.isTemplate) {
    event.stopPropagation()
    emit('block-selected')
  }
}
</script>

<style lang="scss" scoped>
.block {
  border: 1px solid #ddd;
  cursor: move;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
  z-index: 1;

  &:hover {
    z-index: 2;
  }

  &.is-template {
    cursor: grab;
    border: 2px solid rgba(0, 0, 0, 0.1);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);

    &:hover {
      transform: scale(1.08);
      box-shadow:
        0 8px 30px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
      border-color: rgba(0, 0, 0, 0.15);
    }
  }

  &.is-dragging {
    opacity: 0.85;
    transform: rotate(3deg) scale(1.1);
    z-index: 1000;
  }

  &.is-selected {
    border: 2px solid #3498db !important;
    z-index: 200;

    &::before {
      content: '⌨️';
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 10px;
      background: #3498db;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
      border: 2px solid white;
    }
  }

  &.is-overflow {
    border: 3px solid #e74c3c !important;
    box-shadow:
      0 0 0 2px rgba(231, 76, 60, 0.3),
      0 4px 15px rgba(231, 76, 60, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
    animation: overflow-warning 2s ease-in-out infinite alternate;
    z-index: 100;

    &::after {
      content: '⚠️';
      position: absolute;
      top: -5px;
      left: -5px;
      font-size: 12px;
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    // Selected overflow blocks get a combined style
    &.is-selected {
      border: 3px solid #9b59b6 !important;
      box-shadow:
        0 0 0 2px rgba(155, 89, 182, 0.4),
        0 4px 20px rgba(155, 89, 182, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;

      &::before {
        background: #9b59b6;
        box-shadow: 0 2px 6px rgba(155, 89, 182, 0.3);
      }
    }
  }

  .block-info {
    font-size: 11px;
    color: #ccc;
    font-weight: 700;
    padding: 2px 6px;
  }

  .remove-btn {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 24px;
    height: 24px;
    background: linear-gradient(145deg, #e74c3c, #c0392b);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
    border: 2px solid white;

    &:hover {
      background: linear-gradient(145deg, #c0392b, #a93226);
      transform: scale(1.1);
      box-shadow: 0 6px 18px rgba(231, 76, 60, 0.5);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &:hover .remove-btn {
    opacity: 1;
  }
}

@keyframes overflow-warning {
  0% {
    box-shadow:
      0 0 0 2px rgba(231, 76, 60, 0.3),
      0 4px 15px rgba(231, 76, 60, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  100% {
    box-shadow:
      0 0 0 4px rgba(231, 76, 60, 0.6),
      0 6px 20px rgba(231, 76, 60, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}
</style>
