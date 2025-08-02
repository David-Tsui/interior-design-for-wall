<template>
  <div class="app">
    <h1>Wall Decorator</h1>

    <div class="controls">
      <div class="input-group">
        <label>Wall Width (cm)</label>
        <input
          v-model.number="wallSettings.width"
          type="number"
          min="100"
          max="1000"
        />
      </div>

      <div class="input-group">
        <label>Wall Height (cm)</label>
        <input
          v-model.number="wallSettings.height"
          type="number"
          min="100"
          max="500"
        />
      </div>

      <div class="input-group">
        <label>Wall Color</label>
        <input
          v-model="wallSettings.backgroundColor"
          type="color"
        />
      </div>

      <button @click="generateRandomDesign" class="button">
        Generate Random Design
      </button>

      <button @click="saveCurrentDesign" class="button">
        Save Design
      </button>

      <button @click="loadSavedDesign" class="button">
        Load Saved Design
      </button>
    </div>

    <div class="designer-area">
      <WallComponent
        :wall="wallSettings"
        :blocks="blocks"
        @block-moved="onBlockMoved"
        @block-removed="onBlockRemoved"
        @template-dropped="onTemplateDropped"
      />

      <div class="block-palette">
        <h3>Block Palette</h3>
        <div class="palette-blocks">
          <BlockComponent
            v-for="template in blockTemplates"
            :key="`template-${template.width}-${template.height}-${template.color}`"
            :block="template"
            :is-template="true"
            @template-used="addBlockFromTemplate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import WallComponent from './components/WallComponent.vue'
import BlockComponent from './components/BlockComponent.vue'
import type { Block, Wall, Design } from './types'
import { generateId, getRandomColor, canPlaceBlock, findValidPosition, generateOptimizedLayout } from './utils/helpers'

const wallSettings = reactive<Wall>({
  width: 315,
  height: 300,
  backgroundColor: '#f8f9fa'
})

const blocks = ref<Block[]>([])

const blockTemplates: Block[] = [
  { id: 'template-1', x: 0, y: 0, width: 60, height: 30, color: '#e74c3c' },
  { id: 'template-2', x: 0, y: 0, width: 30, height: 30, color: '#3498db' },
  { id: 'template-3', x: 0, y: 0, width: 60, height: 60, color: '#2ecc71' },
  { id: 'template-4', x: 0, y: 0, width: 30, height: 60, color: '#f1c40f' },
  { id: 'template-5', x: 0, y: 0, width: 60, height: 30, color: '#9b59b6' },
  { id: 'template-6', x: 0, y: 0, width: 30, height: 30, color: '#e67e22' },
  { id: 'template-7', x: 0, y: 0, width: 60, height: 60, color: '#1abc9c' },
  { id: 'template-8', x: 0, y: 0, width: 30, height: 60, color: '#e91e63' }
]

const addBlockFromTemplate = (template: Block, position?: { x: number, y: number }) => {
  let finalPosition = position

  if (!finalPosition) {
    // Try to find a valid position automatically
    const validPos = findValidPosition(
      { width: template.width, height: template.height },
      blocks.value,
      wallSettings
    )
    if (!validPos) {
      alert('No space available for this block!')
      return
    }
    finalPosition = validPos
  } else {
    // Check if the specified position is valid
    const testBlock = {
      x: finalPosition.x,
      y: finalPosition.y,
      width: template.width,
      height: template.height
    }
    if (!canPlaceBlock(testBlock, blocks.value, wallSettings)) {
      alert('Cannot place block here - it would overlap with existing blocks!')
      return
    }
  }

  const newBlock: Block = {
    id: generateId(),
    x: finalPosition.x,
    y: finalPosition.y,
    width: template.width,
    height: template.height,
    color: template.color
  }
  blocks.value.push(newBlock)
}

const onBlockMoved = (blockId: string, x: number, y: number) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  const testBlock = {
    x,
    y,
    width: block.width,
    height: block.height
  }

  // Check if the new position is valid
  if (canPlaceBlock(testBlock, blocks.value, wallSettings, blockId)) {
    block.x = x
    block.y = y
  } else {
    // If invalid position, try to find the nearest valid position
    const validPos = findValidPosition(
      { width: block.width, height: block.height },
      blocks.value,
      wallSettings,
      blockId
    )
    if (validPos) {
      block.x = validPos.x
      block.y = validPos.y
    }
    // If no valid position found, block stays in original position
  }
}

const onBlockRemoved = (blockId: string) => {
  const index = blocks.value.findIndex(b => b.id === blockId)
  if (index !== -1) {
    blocks.value.splice(index, 1)
  }
}

const onTemplateDropped = (template: Block, position: { x: number, y: number }) => {
  addBlockFromTemplate(template, position)
}

const generateRandomDesign = () => {
  blocks.value = []

  // Define available block sizes
  const blockSizes = [
    { width: 60, height: 30 },
    { width: 30, height: 30 },
    { width: 60, height: 60 },
    { width: 30, height: 60 }
  ]

  // Calculate maximum possible blocks based on wall area
  const wallArea = wallSettings.width * wallSettings.height
  const avgBlockArea = 60 * 30 // Average block size
  const maxPossibleBlocks = Math.floor(wallArea / avgBlockArea * 0.8) // 80% fill rate target

  // Generate optimized layout
  const generatedBlocks = generateOptimizedLayout(wallSettings, blockSizes, maxPossibleBlocks)

  // Convert to Block objects with IDs
  blocks.value = generatedBlocks.map(block => ({
    id: generateId(),
    ...block
  }))

  console.log(`Generated ${blocks.value.length} blocks for wall ${wallSettings.width}x${wallSettings.height}`)
}

const saveCurrentDesign = () => {
  const design: Design = {
    id: generateId(),
    name: `Design ${new Date().toLocaleString()}`,
    wall: { ...wallSettings },
    blocks: [...blocks.value],
    createdAt: new Date()
  }

  const savedDesigns = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
  savedDesigns.push(design)
  localStorage.setItem('wallDesigns', JSON.stringify(savedDesigns))

  alert('Design saved successfully!')
}

const loadSavedDesign = () => {
  const savedDesigns = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
  if (savedDesigns.length === 0) {
    alert('No saved designs found!')
    return
  }

  const latestDesign = savedDesigns[savedDesigns.length - 1]
  wallSettings.width = latestDesign.wall.width
  wallSettings.height = latestDesign.wall.height
  wallSettings.backgroundColor = latestDesign.wall.backgroundColor
  blocks.value = [...latestDesign.blocks]

  alert(`Loaded design: ${latestDesign.name}`)
}
</script>

<style lang="scss" scoped>
.app {
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.designer-area {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.block-palette {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;

  h3 {
    margin-bottom: 1rem;
    color: #2c3e50;
  }

  .palette-blocks {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .designer-area {
    flex-direction: column;
  }

  .controls {
    flex-direction: column;
  }
}
</style>
