<template>
  <div
    class="block"
    :class="{ 'is-template': isTemplate, 'is-dragging': isDragging }"
    :style="blockStyle"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dblclick="onDoubleClick"
  >
    <!-- <div class="block-info" v-if="!isTemplate">
      {{ block.width }}×{{ block.height }}
    </div> -->
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
}

interface Emits {
  (e: 'template-used', block: Block): void
  (e: 'block-moved', position: { x: number, y: number }): void
  (e: 'block-removed'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isDragging = ref(false)

const blockStyle = computed(() => {
  const style: any = {
    width: `${props.block.width}px`,
    height: `${props.block.height}px`,
    backgroundColor: props.block.color
  }

  if (!props.isTemplate) {
    style.position = 'absolute'
    style.left = `${props.block.x}px`
    style.top = `${props.block.y}px`
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
      blockId: props.block.id
    }
    event.dataTransfer?.setData('text/plain', JSON.stringify(dragData))
  }
}

const onDragEnd = (event: DragEvent) => {
  isDragging.value = false

  if (!props.isTemplate) {
    const wall = event.target?.closest('.wall')
    if (wall) {
      const rect = wall.getBoundingClientRect()
      const x = Math.max(0, Math.min(event.clientX - rect.left - props.block.width / 2, wall.clientWidth - props.block.width))
      const y = Math.max(0, Math.min(event.clientY - rect.top - props.block.height / 2, wall.clientHeight - props.block.height))

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
</script>

<style lang="scss" scoped>
.block {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;

  &:hover {
    border-color: rgba(255, 255, 255, 0.6);
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &.is-template {
    margin-bottom: 0.5rem;
    cursor: grab;

    &:hover {
      transform: scale(1.05);
    }
  }

  &.is-dragging {
    opacity: 0.7;
    transform: rotate(5deg);
  }

  .block-info {
    font-size: 11px;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    font-weight: 600;
  }

  .remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    background: #e74c3c;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;

    &:hover {
      background: #c0392b;
    }
  }

  &:hover .remove-btn {
    opacity: 1;
  }
}
</style>
