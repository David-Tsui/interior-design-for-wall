<template>
  <div class="app">
    <h1>Wall Decorator</h1>

    <div class="container flex">
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

    <div class="container">
      <ControlButtons
        :show-overflow-warnings="showOverflowWarnings"
        @update:show-overflow-warnings="showOverflowWarnings = $event"
        :hide-overflow-blocks="hideOverflowBlocks"
        @update:hide-overflow-blocks="hideOverflowBlocks = $event"
        :debug-mode="debugMode"
        @update:debug-mode="debugMode = $event"
        :intersection-threshold="intersectionThreshold"
        @update:intersection-threshold="intersectionThreshold = $event"
        @generate-random="generateRandomDesign"
        @generate-staggered="generateStaggeredDesign"
        @clear-design="clearDesign"
        @save-design="saveCurrentDesign"
        @load-design="loadSavedDesign"
      />
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
              :show-overflow-warnings="showOverflowWarnings"
              @template-used="addBlockFromTemplate"
            />
          </div>
        </div>
      </div>

      <WallComponent
        :wall="wallSettings"
        :blocks="blocks"
        :show-overflow-warnings="showOverflowWarnings"
        :hide-overflow-blocks="hideOverflowBlocks"
        :debug-mode="debugMode"
        :intersection-threshold="intersectionThreshold"
        :selected-block-id="selectedBlockId"
        @block-moved="onBlockMoved"
        @block-removed="onBlockRemoved"
        @block-selected="onBlockSelected"
        @template-dropped="onTemplateDropped"
      />
    </div>

    <SaveLoadModal
      :is-open="showSaveLoadModal"
      :initial-tab="modalInitialTab"
      :current-design-data="{
        blocks,
        blockTemplates,
        wall: wallSettings
      }"
      @close="showSaveLoadModal = false"
      @save="onModalSave"
      @load="onModalLoad"
      @import="onModalImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import WallComponent from './components/WallComponent.vue'
import BlockComponent from './components/BlockComponent.vue'
import WallEditor from './components/WallEditor.vue'
import BlockEditor from './components/BlockEditor.vue'
import ControlButtons from './components/ControlButtons.vue'
import SaveLoadModal from './components/SaveLoadModal.vue'
import type { Block, Wall, Design } from './types'
import { defaultBlockTemplates } from './config/blockTemplates'
import {
  generateId,
  canPlaceBlock,
  findValidPosition,
  findPositionAdjacentToTarget,
  isHorizontalOverflow,
  isValidHorizontalPosition,
  isVerticalOverflow,
  isValidVerticalPosition,
  checkCollision,
  hasSmallIntersection,
  findBestPositionAroundBlock
} from './utils/helpers'

const wallSettings = reactive<Wall>({
  width: 315,
  height: 300,
  backgroundColor: '#f8f9fa'
})

const blocks = ref<Block[]>([])
const showOverflowWarnings = ref<boolean>(true)
const hideOverflowBlocks = ref<boolean>(false)
const debugMode = ref<boolean>(false)
const intersectionThreshold = ref<number>(25) // Percentage threshold for small intersections (default 25%)
const showSaveLoadModal = ref<boolean>(false)
const modalInitialTab = ref<'save' | 'load' | 'export' | 'import'>('save')
const selectedBlockId = ref<string | null>(null)

const blockTemplates = ref<Block[]>([...defaultBlockTemplates])

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
    textureImage: template.textureImage,
    isOverflow: isHorizontalOverflow({ x: finalPosition.x, width: template.width }, wallSettings) ||
      isVerticalOverflow({ y: finalPosition.y, height: template.height }, wallSettings)
  }
  blocks.value.push(newBlock)
}

const onBlockMoved = (blockId: string, x: number, y: number) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  if (debugMode.value) {
    console.group(`🐛 DEBUG: Block Move Attempt`)
    console.log(`Block ID: ${blockId}`)
    console.log(`Current Position: (${block.x}, ${block.y})`)
    console.log(`Desired Position: (${x}, ${y})`)
    console.log(`Block Size: ${block.width}x${block.height}`)
  }

  // Smart intersection logic - check if intersection is too small
  const testBlock = {
    x,
    y,
    width: block.width,
    height: block.height
  }

  const intersectionCheck = hasSmallIntersection(
    testBlock,
    blocks.value,
    intersectionThreshold.value,
    blockId
  )

  let finalPosition = { x, y }

  if (intersectionCheck.hasSmallIntersection) {
    if (debugMode.value) {
      console.log(`⚠️ Small intersection detected (${intersectionCheck.collidingBlocks.map(c => c.intersectionPercent.toFixed(1)).join(', ')}%) - attempting auto-positioning`)
    }

    // Try to find a better position around the first colliding block
    const firstCollidingBlock = intersectionCheck.collidingBlocks[0].block
    const betterPosition = findBestPositionAroundBlock(
      { width: block.width, height: block.height },
      firstCollidingBlock,
      { x, y },
      blocks.value,
      wallSettings,
      blockId
    )

    if (betterPosition) {
      finalPosition = betterPosition
      if (debugMode.value) {
        console.log(`✅ AUTO-POSITIONED: Found better position (${betterPosition.x}, ${betterPosition.y})`)
      }
    } else {
      if (debugMode.value) {
        console.log(`⚠️ Could not find better position - keeping original (${x}, ${y})`)
      }
    }
  } else if (debugMode.value) {
    if (intersectionCheck.collidingBlocks.length > 0) {
      console.log(`✅ Large intersection allowed (${intersectionCheck.collidingBlocks.map(c => c.intersectionPercent.toFixed(1)).join(', ')}%) - moving to exact position`)
    } else {
      console.log(`✅ No intersections - moving to exact position (${x}, ${y})`)
    }
  }

  // Update block position to final position
  block.x = finalPosition.x
  block.y = finalPosition.y

  // Update overflow status based on new position
  block.isOverflow = isHorizontalOverflow({ x: block.x, width: block.width }, wallSettings) ||
    isVerticalOverflow({ y: block.y, height: block.height }, wallSettings)

  if (debugMode.value) {
    console.log(`Final Position: (${block.x}, ${block.y})`)
    console.log(`Is Overflow: ${block.isOverflow}`)
    console.groupEnd()
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
  if (debugMode.value) {
    console.group(`🐛 DEBUG: Template Drop Attempt`)
    console.log(`Template: ${template.width}x${template.height}, Color: ${template.color}`)
    console.log(`Drop Position: (${position.x}, ${position.y})`)
    console.log(`Wall Size: ${wallSettings.width}x${wallSettings.height}`)
  }

  addBlockFromTemplate(template, position)

  if (debugMode.value) {
    console.groupEnd()
  }
}

const generateRandomDesign = () => {
  blocks.value = []

  // Extract block sizes from the palette templates
  const paletteBlocks = blockTemplates.value.map(template => ({
    width: template.width,
    height: template.height
  }))

  // Safety check for empty templates
  if (paletteBlocks.length === 0) {
    console.warn('No block templates available for random generation')
    return
  }

  // Use the first template size for uniform grid
  const blockSize = paletteBlocks[0]

  // Calculate how many blocks fit in each dimension
  const blocksPerRow = Math.floor(wallSettings.width / blockSize.width)
  const blocksPerColumn = Math.floor(wallSettings.height / blockSize.height)

  const generatedBlocks: Block[] = []

  // Extract colors and textures from block templates
  const templateStyles = blockTemplates.value.map(template => ({
    color: template.color,
    textureImage: template.textureImage
  }))

  // Fill the wall with a tidy grid of colored blocks
  for (let row = 0; row < blocksPerColumn; row++) {
    for (let col = 0; col < blocksPerRow; col++) {
      const x = col * blockSize.width
      const y = row * blockSize.height

      // Pick a random color and texture from the block templates
      const randomStyle = templateStyles[Math.floor(Math.random() * templateStyles.length)]

      generatedBlocks.push({
        id: generateId(),
        x: x,
        y: y,
        width: blockSize.width,
        height: blockSize.height,
        color: randomStyle.color,
        textureImage: randomStyle.textureImage,
        isOverflow: false
      })
    }
  }

  blocks.value = generatedBlocks
  console.log(`Generated ${blocks.value.length} blocks in a ${blocksPerRow}x${blocksPerColumn} grid`)
}

const generateStaggeredDesign = () => {
  blocks.value = []

  // Extract block sizes, colors and textures from the palette templates
  const paletteBlocks = blockTemplates.value.map(template => ({
    width: template.width,
    height: template.height,
    color: template.color,
    textureImage: template.textureImage
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
      textureImage: randomPaletteBlock.textureImage,
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
  modalInitialTab.value = 'save'
  showSaveLoadModal.value = true
}

const onModalSave = (designName: string) => {
  const now = new Date()

  const design: Design = {
    id: generateId(),
    name: designName,
    wall: { ...wallSettings },
    blocks: [...blocks.value],
    blockTemplates: [...blockTemplates.value],
    createdAt: now,
    preview: {
      blockCount: blocks.value.length,
      wallDimensions: `${wallSettings.width}×${wallSettings.height}cm`,
      templateCount: blockTemplates.value.length
    }
  }

  const savedDesigns = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
  savedDesigns.push(design)

  // Keep only the last 10 designs
  if (savedDesigns.length > 10) {
    savedDesigns.splice(0, savedDesigns.length - 10)
  }

  localStorage.setItem('wallDesigns', JSON.stringify(savedDesigns))

  alert(`✅ Design "${designName}" saved successfully! (${savedDesigns.length}/10 slots used)`)
}

const loadSavedDesign = () => {
  modalInitialTab.value = 'load'
  showSaveLoadModal.value = true
}

const clearDesign = () => {
  if (blocks.value.length > 0) {
    if (confirm('Are you sure you want to clear the current design? This action cannot be undone.')) {
      blocks.value = []
      selectedBlockId.value = null
    }
  }
}

const onModalLoad = (selectedDesign: Design) => {
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

  // Show success message with preview info
  const previewInfo = selectedDesign.preview
    ? `\n📐 ${selectedDesign.preview.wallDimensions} • 🧱 ${selectedDesign.preview.blockCount} blocks • 🎨 ${selectedDesign.preview.templateCount} templates`
    : ''
  alert(`✅ Loaded design: ${selectedDesign.name}${previewInfo}`)
}

const onModalImport = (importedDesign: Design) => {
  // Check if overwrite is needed
  const existingDesigns = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
  const existingIndex = existingDesigns.findIndex((d: Design) => d.name === importedDesign.name)

  if (existingIndex >= 0) {
    // Overwrite existing design
    existingDesigns[existingIndex] = importedDesign
  } else {
    // Add as new design
    existingDesigns.push(importedDesign)
  }

  // Save to localStorage
  localStorage.setItem('wallDesigns', JSON.stringify(existingDesigns))

  // Load the imported design into the current workspace
  wallSettings.width = importedDesign.wall.width
  wallSettings.height = importedDesign.wall.height
  wallSettings.backgroundColor = importedDesign.wall.backgroundColor
  blocks.value = [...importedDesign.blocks]

  if (importedDesign.blockTemplates) {
    blockTemplates.value = [...importedDesign.blockTemplates]
  }

  // Clear any selected block when importing a new design
  selectedBlockId.value = null

  const previewInfo = importedDesign.preview
    ? `\n📐 ${importedDesign.preview.wallDimensions} • 🧱 ${importedDesign.preview.blockCount} blocks • 🎨 ${importedDesign.preview.templateCount} templates`
    : ''
  alert(`✅ Design "${importedDesign.name}" imported and loaded successfully!${previewInfo}`)
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
  background:
    radial-gradient(circle at 20% 50%, rgba(80, 80, 90, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(120, 120, 130, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(100, 100, 110, 0.4) 0%, transparent 50%),
    linear-gradient(135deg, #2c2c34 0%, #3a3a42 50%, #4a4a52 100%);
  background-attachment: fixed;
  background-size: 100% 100%;
  padding: 2rem;
  position: relative;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 100px,
        rgba(255, 255, 255, 0.03) 100px,
        rgba(255, 255, 255, 0.03) 101px
      ),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 100px,
        rgba(255, 255, 255, 0.03) 100px,
        rgba(255, 255, 255, 0.03) 101px
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

/* Modal should appear above everything */
:deep(.modal-overlay) {
  z-index: 9999 !important;
}

.flex {
  display: flex;
  gap: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2.5rem;
  color: #e2e8f0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.02em;
}

.main-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.container {
  background: rgba(74, 74, 82, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.designer-area {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
  background: rgba(45, 45, 55, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.block-palette {
  background: linear-gradient(145deg, #4a4a52, #3a3a42);
  padding: 2rem;
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.15);

  h3 {
    margin-bottom: 1.5rem;
    color: #e2e8f0;
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

}

</style>
