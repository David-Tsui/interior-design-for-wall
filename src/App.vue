<template>
  <div class="app">
    <div class="controls-section flex">
      <WallEditor
        :wall="wallSettings"
        @wall-updated="onWallUpdated"
        :style="{ flex: 2 }"
      />

      <BlockEditor
        :wall="wallSettings"
        :block-templates="blockTemplates"
        @wall-updated="onWallUpdated"
        @templates-updated="onTemplatesUpdated"
        :style="{ flex: 3 }"
      />
    </div>

    <div class="controls-section">
      <h3>Controls</h3>
      <div class="control-groups">
        <div class="control-group">
          <h4>Generate</h4>
          <div class="controls-grid">
            <button
              @click="generateRandomDesign"
              class="button"
            >
              Random Design
            </button>

            <button
              @click="generateStaggeredDesign"
              class="button staggered-btn"
            >
              Staggered Design
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>Save/Load</h4>
          <div class="controls-grid">
            <button
              @click="saveCurrentDesign"
              class="button"
            >
              Save Design
            </button>

            <button
              @click="loadSavedDesign"
              class="button"
            >
              Load Saved Design
            </button>
          </div>
        </div>

        <div class="control-group">
          <h4>Display</h4>
          <div class="controls-grid">
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="showWarnings"
              />
              <span class="slider"></span>
              <span class="label-text">Show Overflow Warnings</span>
            </label>
          </div>
        </div>
      </div>
    </div>


    <div class="designer-area">
      <div class="editor-panel">
        <div class="block-palette">
          <h3>Block Palette</h3>
          <div class="palette-blocks">
            <BlockComponent
              v-for="template in blockTemplates"
              :key="`template-${template.width}-${template.height}-${template.color}`"
              :block="template"
              :is-template="true"
              :show-warnings="showWarnings"
              @template-used="addBlockFromTemplate"
            />
          </div>
        </div>
      </div>

      <WallComponent
        :wall="wallSettings"
        :blocks="blocks"
        :show-warnings="showWarnings"
        :selected-block-id="selectedBlockId"
        @block-moved="onBlockMoved"
        @block-removed="onBlockRemoved"
        @block-selected="onBlockSelected"
        @template-dropped="onTemplateDropped"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import WallComponent from './components/WallComponent.vue'
import BlockComponent from './components/BlockComponent.vue'
import WallEditor from './components/WallEditor.vue'
import BlockEditor from './components/BlockEditor.vue'
import type { Block, Wall, Design } from './types'
import {
  generateId,
  canPlaceBlock,
  findValidPosition,
  findValidPositionWithinWall,
  findPositionAdjacentToTarget,
  isHorizontalOverflow,
  isValidHorizontalPosition,
  isVerticalOverflow,
  isValidVerticalPosition,
  checkCollision
} from './utils/helpers'

const wallSettings = reactive<Wall>({
  width: 315,
  height: 300,
  backgroundColor: '#f8f9fa'
})

const blocks = ref<Block[]>([])
const showWarnings = ref<boolean>(true)
const selectedBlockId = ref<string | null>(null)

const blockTemplates = ref<Block[]>([
  { id: 'template-1', x: 0, y: 0, width: 60, height: 30, color: '#ffffff' },
  { id: 'template-2', x: 0, y: 0, width: 60, height: 30, color: '#eeeeee' },
  { id: 'template-3', x: 0, y: 0, width: 60, height: 30, color: '#222222' },
])

const onWallUpdated = (newWall: Wall) => {
  Object.assign(wallSettings, newWall)
}

const onTemplatesUpdated = (newTemplates: Block[]) => {
  blockTemplates.value = newTemplates
}

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

    if (!canPlaceBlock(testBlock, blocks.value, wallSettings) ||
      !isValidHorizontalPosition(testBlock, wallSettings) ||
      !isValidVerticalPosition(testBlock, wallSettings)) {
      // Find which block we're colliding with and try adjacent placement
      const collidingBlock = blocks.value.find(existingBlock =>
        checkCollision(testBlock, existingBlock)
      )

      let validPos = null

      if (collidingBlock) {
        // Try to place adjacent to the specific block we're colliding with
        validPos = findPositionAdjacentToTarget(
          { width: template.width, height: template.height },
          collidingBlock,
          blocks.value,
          wallSettings,
          finalPosition, // Original drop position to find closest adjacent spot
        )
      }

      // If no adjacent position found, fall back to general position finding
      if (!validPos) {
        validPos = findValidPosition(
          { width: template.width, height: template.height },
          blocks.value,
          wallSettings
        )
      }

      if (!validPos) {
        alert('Cannot place block here - no valid adjacent position found!')
        return
      }

      finalPosition = validPos
    }
  }

  const newBlock: Block = {
    id: generateId(),
    x: finalPosition.x,
    y: finalPosition.y,
    width: template.width,
    height: template.height,
    color: template.color,
    isOverflow: isHorizontalOverflow({ x: finalPosition.x, width: template.width }, wallSettings) ||
      isVerticalOverflow({ y: finalPosition.y, height: template.height }, wallSettings)
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

  // Check if the new position is valid (collision + horizontal/vertical limits)
  if (canPlaceBlock(testBlock, blocks.value, wallSettings, blockId) &&
    isValidHorizontalPosition(testBlock, wallSettings) &&
    isValidVerticalPosition(testBlock, wallSettings)) {
    block.x = x
    block.y = y
    // Update overflow status based on new position
    block.isOverflow = isHorizontalOverflow({ x, width: block.width }, wallSettings) ||
      isVerticalOverflow({ y, height: block.height }, wallSettings)
  } else {
    // Find which block(s) we're colliding with
    const collidingBlock = blocks.value.find(existingBlock =>
      existingBlock.id !== blockId && checkCollision(testBlock, existingBlock)
    )

    let validPos = null

    if (collidingBlock) {
      // Try to place adjacent to the specific block we're colliding with
      validPos = findPositionAdjacentToTarget(
        { width: block.width, height: block.height },
        collidingBlock,
        blocks.value,
        wallSettings,
        { x, y }, // Original drag position to find closest adjacent spot
        blockId
      )
    }

    // If no adjacent position found, fall back to general position finding
    if (!validPos) {
      validPos = findValidPosition(
        { width: block.width, height: block.height },
        blocks.value,
        wallSettings,
        blockId
      )
    }

    if (validPos) {
      block.x = validPos.x
      block.y = validPos.y
      // Update overflow status based on new position
      block.isOverflow = isHorizontalOverflow({ x: validPos.x, width: block.width }, wallSettings) ||
        isVerticalOverflow({ y: validPos.y, height: block.height }, wallSettings)
    }
    // If no valid position found, block stays in original position
  }
}

const onBlockRemoved = (blockId: string) => {
  const index = blocks.value.findIndex(b => b.id === blockId)
  if (index !== -1) {
    blocks.value.splice(index, 1)
  }
  // Clear selection if the removed block was selected
  if (selectedBlockId.value === blockId) {
    selectedBlockId.value = null
  }
}

const onBlockSelected = (blockId: string) => {
  selectedBlockId.value = blockId || null
}

const onKeyboardMove = (direction: 'up' | 'down' | 'left' | 'right') => {
  if (!selectedBlockId.value) return

  const block = blocks.value.find(b => b.id === selectedBlockId.value)
  if (!block) return

  const moveStep = 1 // Move 1px at a time for precision

  // Use the same overflow limits as defined in helpers.ts
  const maxBlockWidth = 60 // Maximum block width from templates
  const maxBlockHeight = 30 // Maximum block height from templates

  switch (direction) {
    case 'up':
      block.y = Math.max(-maxBlockHeight, block.y - moveStep) // Allow top overflow up to one block height
      break
    case 'down':
      block.y = Math.min(wallSettings.height, block.y + moveStep)
      break
    case 'left':
      block.x = Math.max(-maxBlockWidth, block.x - moveStep) // Allow left overflow up to one block width
      break
    case 'right':
      block.x = Math.min(wallSettings.width + maxBlockWidth, block.x + moveStep) // Allow right overflow up to one block width
      break
  }

  // Update overflow status based on new position
  block.isOverflow = isHorizontalOverflow({ x: block.x, width: block.width }, wallSettings) ||
    isVerticalOverflow({ y: block.y, height: block.height }, wallSettings)
}

const onTemplateDropped = (template: Block, position: { x: number, y: number }) => {
  addBlockFromTemplate(template, position)
}

const generateRandomDesign = () => {
  blocks.value = []

  // Extract block sizes and colors from the palette templates
  const paletteBlocks = blockTemplates.value.map(template => ({
    width: template.width,
    height: template.height,
    color: template.color,
    area: template.width * template.height
  }))

  // Safety check for empty templates
  if (paletteBlocks.length === 0) {
    console.warn('No block templates available for random generation')
    return
  }

  // Sort blocks by area (largest first for better packing)
  const sortedBlocks = [...paletteBlocks].sort((a, b) => b.area - a.area)

  // Calculate wall area and target fill rate
  const wallArea = wallSettings.width * wallSettings.height
  const targetFillRate = 0.85 // Target 85% fill rate
  let totalPlacedArea = 0

  const generatedBlocks: Block[] = []
  let globalAttempts = 0
  const maxGlobalAttempts = 500 // Prevent infinite loops

  // Simplified algorithm: try random blocks until we can't place anymore
  while (totalPlacedArea < wallArea * targetFillRate && globalAttempts < maxGlobalAttempts) {
    globalAttempts++
    let blockPlaced = false

    // Shuffle the block templates for variety
    const shuffledBlocks = [...sortedBlocks].sort(() => Math.random() - 0.5)

    // Try to place blocks in random order
    for (const blockTemplate of shuffledBlocks) {
      // Skip if this block type would exceed our target area
      if (totalPlacedArea + blockTemplate.area > wallArea * targetFillRate) {
        continue
      }

      // Try to find a valid position for this block type
      const position = findValidPositionWithinWall(
        { width: blockTemplate.width, height: blockTemplate.height },
        generatedBlocks,
        wallSettings
      )

      if (position) {
        generatedBlocks.push({
          id: generateId(),
          x: position.x,
          y: position.y,
          width: blockTemplate.width,
          height: blockTemplate.height,
          color: blockTemplate.color,
          isOverflow: false // Random generation never creates overflow
        })

        totalPlacedArea += blockTemplate.area
        blockPlaced = true
        break // Try to place another block
      }
    }

    // If no block could be placed in this iteration, stop
    if (!blockPlaced) {
      break
    }
  }

  blocks.value = generatedBlocks
  const fillPercentage = Math.round((totalPlacedArea / wallArea) * 100)
  console.log(`Generated ${blocks.value.length} blocks filling ${fillPercentage}% of wall (${totalPlacedArea}/${wallArea})`)
}

const generateStaggeredDesign = () => {
  blocks.value = []

  // Extract block sizes and colors from the palette templates
  const paletteBlocks = blockTemplates.value.map(template => ({
    width: template.width,
    height: template.height,
    color: template.color
  }))

  const generatedBlocks: Block[] = []
  let currentY = 0
  let rowHeight = 0
  let currentX = 0
  let blockIndex = 0

  // Generate staggered brick pattern with limited horizontal overflow
  const maxBlockWidth = 60 // Maximum block width from templates - enforce one block size limit
  let rowIndex = 0

  while (currentY < wallSettings.height) { // No vertical overflow allowed
    // Check if we need to move to next row
    const randomPaletteBlock = paletteBlocks[Math.floor(Math.random() * paletteBlocks.length)]

    if (currentX >= wallSettings.width + maxBlockWidth ||
      (currentX > 0 && currentX + randomPaletteBlock.width > wallSettings.width + maxBlockWidth)) {
      // Move to next row
      currentY += rowHeight
      rowIndex++
      rowHeight = 0

      // Calculate staggered offset for this row (alternate between normal and offset)
      const staggerOffset = rowIndex % 2 === 0 ? 0 : -randomPaletteBlock.width / 2

      // Ensure stagger offset doesn't exceed left overflow limit
      currentX = Math.max(-maxBlockWidth, staggerOffset)

      // If staggered position would cause right overflow beyond limit, reduce it
      if (currentX + randomPaletteBlock.width > wallSettings.width + maxBlockWidth) {
        currentX = wallSettings.width + maxBlockWidth - randomPaletteBlock.width
      }
    }

    // Check if block would exceed vertical boundary (allow limited top overflow)
    if (currentY + randomPaletteBlock.height > wallSettings.height ||
      currentY < -30) { // 30 is max block height, limit top overflow
      break // Stop if block would overflow vertically beyond limits
    }

    // Create block at current position (with staggered pattern and overflow constraints)
    const newBlock: Block = {
      id: generateId(),
      x: currentX,
      y: currentY,
      width: randomPaletteBlock.width,
      height: randomPaletteBlock.height,
      color: randomPaletteBlock.color,
      isOverflow: isHorizontalOverflow({ x: currentX, width: randomPaletteBlock.width }, wallSettings) ||
        isVerticalOverflow({ y: currentY, height: randomPaletteBlock.height }, wallSettings)
    }

    generatedBlocks.push(newBlock)

    // Update position for next block
    currentX += randomPaletteBlock.width
    rowHeight = Math.max(rowHeight, randomPaletteBlock.height)
    blockIndex++

    // Prevent infinite loop
    if (generatedBlocks.length > 200) break
  }

  blocks.value = generatedBlocks
  console.log(`Generated ${blocks.value.length} staggered blocks (with potential overflow)`)
}

const saveCurrentDesign = () => {
  const now = new Date()
  const timeStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0')

  const design: Design = {
    id: generateId(),
    name: `Design ${timeStr}`,
    wall: { ...wallSettings },
    blocks: [...blocks.value],
    blockTemplates: [...blockTemplates.value],
    createdAt: now
  }

  const savedDesigns = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
  savedDesigns.push(design)

  // Keep only the last 10 designs
  if (savedDesigns.length > 10) {
    savedDesigns.splice(0, savedDesigns.length - 10)
  }

  localStorage.setItem('wallDesigns', JSON.stringify(savedDesigns))

  alert(`Design saved successfully! (${savedDesigns.length}/10 slots used)`)
}

const loadSavedDesign = () => {
  const savedDesigns = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
  if (savedDesigns.length === 0) {
    alert('No saved designs found!')
    return
  }

  // Create a selection list with formatted dates
  const designList = savedDesigns
    .map((design: Design, index: number) => {
      const date = new Date(design.createdAt)
      const timeStr = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0')
      return `${index + 1}. ${timeStr} (${design.blocks.length} blocks)`
    })
    .join('\n')

  const selection = prompt(
    `Select a design to load (1-${savedDesigns.length}):\n\n${designList}\n\nEnter number (1-${savedDesigns.length}) or 0 to cancel:`
  )

  if (!selection || selection === '0') {
    return
  }

  const selectedIndex = parseInt(selection) - 1
  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= savedDesigns.length) {
    alert('Invalid selection!')
    return
  }

  const selectedDesign = savedDesigns[selectedIndex]
  wallSettings.width = selectedDesign.wall.width
  wallSettings.height = selectedDesign.wall.height
  wallSettings.backgroundColor = selectedDesign.wall.backgroundColor
  blocks.value = [...selectedDesign.blocks]

  // Load block templates if they exist (for backward compatibility)
  if (selectedDesign.blockTemplates) {
    blockTemplates.value = [...selectedDesign.blockTemplates]
  }

  // Clear any selected block when loading a new design
  selectedBlockId.value = null

  alert(`Loaded design: ${selectedDesign.name}`)
}

// Keyboard event handling
const handleKeyDown = (event: KeyboardEvent) => {
  if (!selectedBlockId.value) return

  // Prevent default scroll behavior for arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault()
  }

  switch (event.key) {
    case 'ArrowUp':
      onKeyboardMove('up')
      break
    case 'ArrowDown':
      onKeyboardMove('down')
      break
    case 'ArrowLeft':
      onKeyboardMove('left')
      break
    case 'ArrowRight':
      onKeyboardMove('right')
      break
    case 'Escape':
      selectedBlockId.value = null // Deselect block
      break
  }
}

// Setup keyboard event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss" scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.flex {
  display: flex;
  gap: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2.5rem;
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;
}

.main-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.controls-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);

  h3 {
    margin-bottom: 1.5rem;
    color: #2c3e50;
    font-size: 1.4rem;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .control-groups {
    display: flex;
    gap: 3rem;
  }

  .control-group {
    flex: 1;

    h4 {
      margin-bottom: 1rem;
      color: #34495e;
      font-size: 1.1rem;
      font-weight: 600;
      border-bottom: 2px solid #3498db;
      padding-bottom: 0.5rem;
    }
  }

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }

  .toggle-switch {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;

      &:checked + .slider {
        background-color: #3498db;

        &:before {
          transform: translateX(22px);
        }
      }
    }

    .slider {
      position: relative;
      width: 44px;
      height: 22px;
      background-color: #ccc;
      border-radius: 22px;
      transition: background-color 0.3s ease;

      &:before {
        content: '';
        position: absolute;
        width: 18px;
        height: 18px;
        left: 2px;
        top: 2px;
        background-color: white;
        border-radius: 50%;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    .label-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #5a6c7d;
    }

    &:hover .slider {
      background-color: #bbb;

      &:before {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
    }

    input:checked + .slider:hover {
      background-color: #2980b9;
    }
  }
}

.designer-area {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.95);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.block-palette {
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  padding: 2rem;
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);

  h3 {
    margin-bottom: 1.5rem;
    color: #2c3e50;
    font-size: 1.4rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .palette-blocks {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .app {
    padding: 1rem;
  }

  .designer-area {
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
  }

  .editor-panel {
    min-width: auto;
    width: 100%;
  }

  .block-palette {
    .palette-blocks {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }

  .designer-area {
    padding: 1.5rem;
  }

  .control-groups {
    flex-direction: column;
    gap: 2rem;
  }
}

.staggered-btn {
  background: linear-gradient(145deg, #f39c12, #e67e22) !important;
  box-shadow:
    0 4px 15px rgba(243, 156, 18, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;

  &:hover {
    box-shadow:
      0 6px 20px rgba(243, 156, 18, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }

  &:active {
    box-shadow:
      0 2px 10px rgba(243, 156, 18, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }
}
</style>
