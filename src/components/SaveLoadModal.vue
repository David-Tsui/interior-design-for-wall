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
                💾 Save current design
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'load' }"
                @click="activeTab = 'load'"
              >
                📂 View Saved Designs
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'export' }"
                @click="activeTab = 'export'"
              >
                📤 Export All
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'import' }"
                @click="activeTab = 'import'"
              >
                📥 Import Design
              </button>
            </div>

            <div class="tab-content">
              <!-- Save Tab Component -->
              <SaveTab
                v-if="activeTab === 'save'"
                :currentDesignData="props.currentDesignData"
                :isActive="activeTab === 'save'"
                @save="handleSave"
                @close="closeModal"
              />

              <!-- Load Tab Component -->
              <LoadTab
                v-if="activeTab === 'load'"
                :savedDesigns="savedDesigns"
                :isActive="activeTab === 'load'"
                @load="handleLoad"
                @export-single="handleExportSingle"
                @delete="handleDelete"
                @close="closeModal"
              />

              <!-- Export Tab Component -->
              <ExportTab
                v-if="activeTab === 'export'"
                :savedDesigns="savedDesigns"
                :currentDesignData="props.currentDesignData"
                :isActive="activeTab === 'export'"
                @close="closeModal"
              />

              <!-- Import Tab Component -->
              <ImportTab
                v-if="activeTab === 'import'"
                @import-designs="handleImport"
                @close="closeModal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDesignStorage } from '../composables/useDesignStorage'
import { useDesignExport } from '../composables/useDesignExport'
import SaveTab from './design-modal/SaveTab.vue'
import LoadTab from './design-modal/LoadTab.vue'
import ExportTab from './design-modal/ExportTab.vue'
import ImportTab from './design-modal/ImportTab.vue'
import type { Design } from '../types'

interface Props {
  isOpen: boolean
  initialTab?: 'save' | 'load' | 'export' | 'import'
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
  (e: 'import', design: Design): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { savedDesigns, loadSavedDesigns, saveDesign, deleteDesign, importDesigns } = useDesignStorage()
const { exportSingle } = useDesignExport()

// Component state
const activeTab = ref<'save' | 'load' | 'export' | 'import'>('save')

// Tab handlers
const handleSave = (name: string) => {
  const designToSave: Design = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    blocks: props.currentDesignData.blocks,
    blockTemplates: props.currentDesignData.blockTemplates,
    wall: props.currentDesignData.wall,
    preview: {
      blockCount: props.currentDesignData.blocks.length,
      wallDimensions: `${props.currentDesignData.wall.width}×${props.currentDesignData.wall.height}cm`,
      templateCount: props.currentDesignData.blockTemplates.length
    }
  }

  saveDesign(designToSave)
  emit('save', name)
  alert(`✅ Design "${name}" saved successfully!`)
  closeModal()
}

const handleLoad = (design: Design) => {
  emit('load', design)
  closeModal()
}

const handleExportSingle = (design: Design) => {
  exportSingle(design)
}

const handleDelete = (index: number) => {
  deleteDesign(index)
}

const handleImport = (result: { type: 'single' | 'multiple', designs: Design[], overwrite: boolean }) => {
  const { importedCount, overwrittenCount, skippedCount } = importDesigns(result.designs, result.overwrite)
  
  const messages = []
  if (importedCount > 0) messages.push(`${importedCount} new design${importedCount === 1 ? '' : 's'} imported`)
  if (overwrittenCount > 0) messages.push(`${overwrittenCount} design${overwrittenCount === 1 ? '' : 's'} updated`)
  if (skippedCount > 0) messages.push(`${skippedCount} design${skippedCount === 1 ? '' : 's'} skipped (duplicate names)`)

  const message = messages.length > 0 ? messages.join(', ') : 'No designs were imported'
  alert(`✅ Import completed: ${message}`)
  
  // If single design import, also trigger load
  if (result.type === 'single' && result.designs.length > 0 && importedCount > 0) {
    emit('import', result.designs[0])
  }
}

const closeModal = () => {
  emit('close')
}

// Load saved designs when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadSavedDesigns()
    
    // Set initial tab if specified
    if (props.initialTab) {
      activeTab.value = props.initialTab
    }
  }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: linear-gradient(145deg, #2d3748, #1a202c);
  border-radius: 16px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  width: 90vw;
  max-width: 1000px;
  height: 80vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(90deg, rgba(74, 144, 226, 0.1), rgba(16, 185, 129, 0.05));

  h2 {
    margin: 0;
    color: #e2e8f0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .close-btn {
    background: linear-gradient(145deg, #e53e3e, #c53030);
    border: none;
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);

    &:hover {
      background: linear-gradient(145deg, #c53030, #9c2626);
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(229, 62, 62, 0.6);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.tabs-container {
  display: flex;
  height: 100%;
}

.vertical-tabs {
  width: 220px;
  min-width: 220px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5));
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .tab-btn {
    background: none;
    border: none;
    color: #a0aec0;
    text-align: left;
    padding: 1rem 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    font-weight: 500;
    position: relative;
    border-left: 3px solid transparent;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e0;
    }

    &.active {
      background: linear-gradient(90deg, rgba(74, 144, 226, 0.2), rgba(74, 144, 226, 0.05));
      color: #4a90e2;
      border-left-color: #4a90e2;
      
      &::before {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid #4a90e2;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
      }
    }
  }
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(26, 32, 44, 0.98));

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
}
</style>