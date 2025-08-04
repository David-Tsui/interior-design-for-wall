<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>Design Manager</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="tabs-container">
          <div class="vertical-tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'save' }"
              @click="activeTab = 'save'"
            >
              💾 Save Design
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'load' }"
              @click="activeTab = 'load'"
            >
              📂 Load Design
            </button>
          </div>

          <div class="tab-content">
            <!-- Save Tab -->
            <div v-if="activeTab === 'save'" class="save-panel">
              <h3>Save Current Design</h3>

              <div class="current-design-preview">
                <div class="preview-info">
                  <div class="info-row">
                    <span class="icon">📐</span>
                    <span>{{ currentPreview.wallDimensions }}</span>
                  </div>
                  <div class="info-row">
                    <span class="icon">🧱</span>
                    <span>{{ currentPreview.blockCount }} blocks</span>
                  </div>
                  <div class="info-row">
                    <span class="icon">🎨</span>
                    <span>{{ currentPreview.templateCount }} templates</span>
                  </div>
                </div>
              </div>

              <div class="input-group">
                <label for="design-name">Design Name:</label>
                <input
                  id="design-name"
                  v-model="saveName"
                  type="text"
                  placeholder="Enter design name..."
                  @keyup.enter="handleSave"
                />
              </div>

              <div class="action-buttons">
                <button class="btn btn-primary" @click="handleSave" :disabled="!saveName.trim()">
                  💾 Save Design
                </button>
                <button class="btn btn-secondary" @click="closeModal">
                  Cancel
                </button>
              </div>
            </div>

            <!-- Load Tab -->
            <div v-if="activeTab === 'load'" class="load-panel">
              <h3>Load Saved Design</h3>

              <div v-if="savedDesigns.length === 0" class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No saved designs found</p>
                <p class="empty-subtitle">Create and save a design first!</p>
              </div>

              <div v-else class="designs-accordion">
                <div
                  v-for="(design, index) in savedDesigns"
                  :key="design.id"
                  class="accordion-item"
                  :class="{ expanded: selectedDesignIndex === index }"
                >
                  <!-- Delete Button (Outside Corner) -->
                  <button
                    class="delete-btn"
                    @click.stop="deleteDesign(index)"
                    title="Delete design"
                  >
                    ×
                  </button>

                  <!-- Accordion Header -->
                  <div
                    class="accordion-header"
                    @click="toggleAccordion(index)"
                  >
                    <div class="design-info">
                      <div class="design-main">
                        <h4 class="design-name">{{ design.name }}</h4>
                        <span class="design-date">{{ formatDate(design.createdAt) }}</span>
                      </div>

                      <div class="design-summary" v-if="design.preview">
                        <div class="summary-item">
                          <span class="icon">📐</span>
                          <span>{{ design.preview.wallDimensions }}</span>
                        </div>
                        <div class="summary-item">
                          <span class="icon">🧱</span>
                          <span>{{ design.preview.blockCount }}</span>
                        </div>
                        <div class="summary-item">
                          <span class="icon">🎨</span>
                          <span>{{ design.preview.templateCount }}</span>
                        </div>
                      </div>

                    </div>

                    <div class="accordion-controls">
                      <div class="expand-icon" :class="{ rotated: selectedDesignIndex === index }">
                        ▼
                      </div>
                    </div>
                  </div>

                  <!-- Accordion Content -->
                  <div
                    class="accordion-content"
                    :class="{ expanded: selectedDesignIndex === index }"
                  >
                    <div class="preview-content">
                      <!-- Wall Snapshot -->
                      <div class="wall-snapshot">
                        <h5>🖼️ Wall Preview</h5>
                        <div class="wall-container" :style="getWallPreviewStyle(design)">
                          <div
                            v-for="block in design.blocks"
                            :key="block.id"
                            class="block-preview"
                            :style="getBlockStyle(block, design)"
                          ></div>
                        </div>
                      </div>

                      <!-- Template Details -->
                      <div
                        v-if="design.blockTemplates && design.blockTemplates.length > 0"
                        class="template-details"
                      >
                        <h5>🎨 Available Templates</h5>
                        <div class="templates-grid">
                          <div
                            v-for="template in design.blockTemplates"
                            :key="`template-${template.width}-${template.height}-${template.color}`"
                            class="template-item"
                          >
                            <div class="template-preview" :style="getTemplatePreviewStyle(template)">
                            </div>
                            <span class="template-size">{{ template.width }}×{{ template.height }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Load Button -->
                      <div class="accordion-actions">
                        <button
                          class="btn btn-primary btn-load"
                          @click="loadDesign(design)"
                        >
                          📂 Load This Design
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="action-buttons" v-if="savedDesigns.length > 0">
                <button class="btn btn-secondary" @click="closeModal">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Design } from '../types'

interface Props {
  isOpen: boolean
  initialTab?: 'save' | 'load'
  currentDesignData: {
    blocks: any[]
    blockTemplates: any[]
    wall: any
  }
}

interface Emits {
  (e: 'close'): void
  (e: 'save', name: string): void
  (e: 'load', design: Design): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref<'save' | 'load'>('save')
const saveName = ref('')
const selectedDesignIndex = ref<number | null>(null)
const savedDesigns = ref<Design[]>([])

const currentPreview = computed(() => {
  return {
    blockCount: props.currentDesignData.blocks.length,
    wallDimensions: `${props.currentDesignData.wall.width}×${props.currentDesignData.wall.height}cm`,
    templateCount: props.currentDesignData.blockTemplates.length
  }
})

const toggleAccordion = (index: number) => {
  selectedDesignIndex.value = selectedDesignIndex.value === index ? null : index
}

const getWallPreviewStyle = (design: Design) => {
  const wall = design.wall
  const maxWidth = 400
  const maxHeight = 250

  // Calculate scale to fit within preview area
  const scaleX = maxWidth / wall.width
  const scaleY = maxHeight / wall.height
  const scale = Math.min(scaleX, scaleY, 1) // Don't scale up

  return {
    width: `${wall.width * scale}px`,
    height: `${wall.height * scale}px`,
    backgroundColor: wall.backgroundColor,
    '--preview-scale': scale
  }
}

const getTemplatePreviewStyle = (template: any) => {
  // Calculate proportional size with a base scale
  const baseSize = 60 // Base size for the largest dimension
  const aspectRatio = template.width / template.height

  let width, height
  if (aspectRatio >= 1) {
    // Width is larger or equal
    width = baseSize
    height = baseSize / aspectRatio
  } else {
    // Height is larger
    height = baseSize
    width = baseSize * aspectRatio
  }

  const style: any = {
    width: `${Math.round(width)}px`,
    height: `${Math.round(height)}px`,
    backgroundColor: template.color
  }

  if (template.textureImage) {
    style.backgroundImage = `url(${template.textureImage})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
    style.backgroundRepeat = 'no-repeat'
    style.backgroundBlendMode = 'multiply'
  }

  return style
}

const getBlockStyle = (block: any, design: Design) => {
  const wall = design.wall
  const maxWidth = 400
  const maxHeight = 250

  const scaleX = maxWidth / wall.width
  const scaleY = maxHeight / wall.height
  const scale = Math.min(scaleX, scaleY, 1)

  return {
    position: 'absolute' as const,
    left: `${block.x * scale}px`,
    top: `${block.y * scale}px`,
    width: `${block.width * scale}px`,
    height: `${block.height * scale}px`,
    backgroundColor: block.color,
    backgroundImage: block.textureImage ? `url(${block.textureImage})` : 'none',
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    opacity: block.isOverflow ? 0.7 : 1
  }
}

const loadDesign = (design: Design) => {
  emit('load', design)
  closeModal()
}

const loadSavedDesigns = () => {
  savedDesigns.value = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
}

const closeModal = () => {
  emit('close')
  saveName.value = ''
  selectedDesignIndex.value = null
}

const handleSave = () => {
  if (!saveName.value.trim()) return
  emit('save', saveName.value.trim())
  closeModal()
}


const deleteDesign = (index: number) => {
  if (confirm('Are you sure you want to delete this design?')) {
    savedDesigns.value.splice(index, 1)
    localStorage.setItem('wallDesigns', JSON.stringify(savedDesigns.value))
    if (selectedDesignIndex.value === index) {
      selectedDesignIndex.value = null
    } else if (selectedDesignIndex.value !== null && selectedDesignIndex.value > index) {
      selectedDesignIndex.value--
    }
  }
}

const formatDate = (dateStr: string | Date) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Generate default name when opening save tab
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadSavedDesigns()

    // Set initial tab if specified
    if (props.initialTab) {
      activeTab.value = props.initialTab
    }

    if (activeTab.value === 'save') {
      const now = new Date()
      const timeStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0')
      saveName.value = `Design ${timeStr}`
    }
  }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999 !important;
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

.modal-container {
  background: linear-gradient(145deg, #4a4a52, #3a3a42);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90vw;
  max-width: 900px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10000;
  pointer-events: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    margin: 0;
    color: #e2e8f0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: #a0aec0;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
    }
  }
}

.modal-body {
  flex: 1;
  overflow: hidden;
}

.tabs-container {
  display: flex;
  height: 100%;
}

.vertical-tabs {
  width: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 0;

  .tab-btn {
    width: 100%;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    color: #a0aec0;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    font-weight: 500;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e0;
    }

    &.active {
      background: rgba(74, 144, 226, 0.2);
      color: #4a90e2;
      border-right: 3px solid #4a90e2;
    }
  }
}

.tab-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.save-panel, .load-panel {
  h3 {
    margin: 0 0 1.5rem 0;
    color: #e2e8f0;
    font-size: 1.3rem;
    font-weight: 600;
  }
}

.current-design-preview {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  .preview-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #cbd5e0;
      font-size: 0.9rem;

      .icon {
        font-size: 1rem;
      }
    }
  }
}

.input-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #cbd5e0;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #4a90e2;
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
    }

    &::placeholder {
      color: #718096;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #a0aec0;

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  p {
    margin: 0.5rem 0;
  }

  .empty-subtitle {
    font-size: 0.9rem;
    opacity: 0.7;
  }
}

.designs-accordion {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
}

.accordion-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);

    .delete-btn {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  &.expanded {
    border-color: #4a90e2;
    background: rgba(74, 144, 226, 0.05);
  }
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(145deg, #e53e3e, #c53030);
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transform: translate(4px, -4px);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(229, 62, 62, 0.4);

  &:hover {
    background: linear-gradient(145deg, #c53030, #9c2626);
    transform: scale(1.1) translate(0, 0);
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.6);
  }

  &:active {
    transform: scale(0.95) translate(0, 0);
  }
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .design-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .design-main {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .design-name {
      margin: 0;
      color: #e2e8f0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .design-date {
      color: #a0aec0;
      font-size: 0.85rem;
    }
  }

  .design-summary {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #cbd5e0;
      font-size: 0.85rem;

      .icon {
        font-size: 0.9rem;
      }
    }
  }

}

.accordion-controls {
  display: flex;
  align-items: center;
  padding-left: 1rem;

  .expand-icon {
    color: #a0aec0;
    font-size: 1rem;
    transition: transform 0.3s ease, color 0.2s ease;
    user-select: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e0;
    }

    &.rotated {
      transform: rotate(180deg);
      color: #4a90e2;

      &:hover {
        color: #3182ce;
      }
    }
  }
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;

  &.expanded {
    max-height: 1000px;
  }

  .preview-content {
    padding: 0 1.5rem 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.btn-primary {
      background: linear-gradient(145deg, #4a90e2, #3182ce);
      color: white;

      &:hover:not(:disabled) {
        background: linear-gradient(145deg, #3182ce, #2c5aa0);
        transform: translateY(-1px);
      }
    }

    &.btn-secondary {
      background: linear-gradient(145deg, #4a5568, #2d3748);
      color: #e2e8f0;

      &:hover {
        background: linear-gradient(145deg, #2d3748, #1a202c);
        transform: translateY(-1px);
      }
    }

    &.btn-danger {
      background: linear-gradient(145deg, #e53e3e, #c53030);
      color: white;

      &:hover {
        background: linear-gradient(145deg, #c53030, #9c2626);
        transform: translateY(-1px);
      }
    }
  }
}

.accordion-actions {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .btn-load {
    padding: 0.75rem 2rem;
    background: linear-gradient(145deg, #4a90e2, #3182ce);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);

    &:hover {
      background: linear-gradient(145deg, #3182ce, #2c5aa0);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
    }
  }
}

.design-details {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  overflow-y: auto;

  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h4 {
      margin: 0;
      color: #e2e8f0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .design-name {
      color: #a0aec0;
      font-size: 0.9rem;
      font-style: italic;
    }
  }

  h5 {
    margin: 1.5rem 0 1rem 0;
    color: #cbd5e0;
    font-size: 1rem;
    font-weight: 600;

    &:first-of-type {
      margin-top: 0;
    }
  }
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.wall-snapshot {
  h5 {
    margin: 0 0 1rem 0;
    color: #cbd5e0;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .wall-container {
    position: relative;
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    margin: 0 auto;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
    background: #2d3748;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: calc(var(--preview-scale, 1) * 20px) calc(var(--preview-scale, 1) * 20px);
      pointer-events: none;
      z-index: 1;
    }

    .block-preview {
      z-index: 2;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.02);
        z-index: 3;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        filter: brightness(1.1);
      }
    }
  }
}


.template-details {
  h5 {
    margin: 0 0 1rem 0;
    color: #cbd5e0;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 1rem;

    .template-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(0, 0, 0, 0.3);
        transform: translateY(-2px);
      }

      .template-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        min-width: 30px;
        min-height: 20px;

        .template-texture {
          font-size: 1.2rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
      }

      .template-size {
        font-size: 0.75rem;
        color: #a0aec0;
        font-weight: 500;
      }
    }
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 95vw;
    max-height: 90vh;
  }

  .tabs-container {
    flex-direction: column;
  }

  .vertical-tabs {
    width: 100%;
    display: flex;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0;

    .tab-btn {
      flex: 1;
      padding: 1rem;
      text-align: center;

      &.active {
        border-right: none;
        border-bottom: 3px solid #4a90e2;
      }
    }
  }

  .tab-content {
    padding: 1.5rem;
  }

  .current-design-preview .preview-info {
    grid-template-columns: 1fr;
  }

  .design-preview .preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }

  .designs-accordion {
    max-height: 400px;
  }

  .delete-btn {
    width: 20px;
    height: 20px;
    font-size: 12px;
    top: -6px;
    right: -6px;
    opacity: 1;
    transform: translate(0, 0);
  }

  .accordion-header {
    padding: 1rem;

    .design-info {
      gap: 0.75rem;
    }

    .design-summary {
      gap: 1rem;

      .summary-item {
        font-size: 0.8rem;
      }
    }
  }

  .accordion-controls {
    padding-left: 0.5rem;

    .expand-icon {
      padding: 0.25rem;
      font-size: 0.9rem;
    }
  }

  .accordion-content .preview-content {
    padding: 0 1rem 1rem 1rem;
    gap: 1rem;

    h5 {
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }

    .wall-container {
      max-width: 100%;
      margin: 0.5rem 0;
    }

    .templates-grid {
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    }
  }

  .accordion-actions .btn-load {
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>
