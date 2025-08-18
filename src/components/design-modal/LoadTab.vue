<template>
  <div class="load-panel">
    <h3>All Saved Designs</h3>

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

            <!-- Load and Export Buttons -->
            <div class="accordion-actions">
              <button
                class="btn btn-primary btn-load"
                @click="$emit('load', design)"
              >
                📂 Load This Design
              </button>
              <button
                class="btn btn-secondary btn-export"
                @click="$emit('export-single', design)"
              >
                📤 Export this design
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons" v-if="savedDesigns.length > 0">
      <button class="btn btn-secondary" @click="$emit('close')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Design } from '../../types'

interface Props {
  savedDesigns: Design[]
  isActive: boolean
}

interface Emits {
  (e: 'load', design: Design): void
  (e: 'export-single', design: Design): void
  (e: 'delete', index: number): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedDesignIndex = ref<number | null>(null)

const toggleAccordion = (index: number) => {
  selectedDesignIndex.value = selectedDesignIndex.value === index ? null : index
}

const deleteDesign = (index: number) => {
  if (confirm('Are you sure you want to delete this design?')) {
    emit('delete', index)
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
</script>

<style lang="scss" scoped>
.load-panel {
  h3 {
    margin: 0 0 1.5rem 0;
    color: #e2e8f0;
    font-size: 1.3rem;
    font-weight: 600;
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
      }

      .template-size {
        font-size: 0.75rem;
        color: #a0aec0;
        font-weight: 500;
      }
    }
  }
}

.accordion-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .btn-load {
    padding: 0.75rem 1.5rem;
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

  .btn-export {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(145deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    &:hover {
      background: linear-gradient(145deg, #059669, #047857);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }
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

    &.btn-secondary {
      background: linear-gradient(145deg, #4a5568, #2d3748);
      color: #e2e8f0;

      &:hover {
        background: linear-gradient(145deg, #2d3748, #1a202c);
        transform: translateY(-1px);
      }
    }
  }
}
</style>