<template>
  <div class="export-panel">
    <h3>Export All</h3>

    <div class="export-options">
      <div class="option-group">
        <h4>📁 Select Designs to Export</h4>
        
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="exportSavedDesigns"
              :disabled="savedDesigns.length === 0"
            />
            <span class="checkbox-text">
              Saved designs ({{ savedDesigns.length }})
            </span>
          </label>

          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="exportCurrentDesign"
            />
            <span class="checkbox-text">
              Current design
            </span>
          </label>
        </div>

        <div v-if="!exportSavedDesigns && !exportCurrentDesign" class="warning">
          ⚠️ Please select at least one option to export
        </div>
      </div>

      <div class="input-group">
        <label for="export-filename">Archive filename:</label>
        <input
          id="export-filename"
          v-model="exportAllFilename"
          type="text"
          placeholder="Enter archive filename..."
          @keyup.enter="handleExportAll"
        />
      </div>
    </div>

    <div class="export-summary" v-if="exportSummary">
      <div class="summary-item">
        <span class="icon">📦</span>
        <span>{{ exportSummary }}</span>
      </div>
    </div>

    <div class="action-buttons">
      <button
        class="btn btn-primary"
        @click="handleExportAll"
        :disabled="!canExport"
      >
        📤 Export All
      </button>
      <button class="btn btn-secondary" @click="$emit('close')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDesignExport } from '../../composables/useDesignExport'
import type { Design } from '../../types'

interface Props {
  savedDesigns: Design[]
  currentDesignData: {
    blocks: any[]
    blockTemplates: any[]
    wall: any
  }
  isActive: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  exportSavedDesigns,
  exportCurrentDesign,
  exportAllFilename,
  exportAll,
  setDefaultFilename
} = useDesignExport()

const canExport = computed(() => {
  return (exportSavedDesigns.value || exportCurrentDesign.value) &&
         exportAllFilename.value.trim() !== ''
})

const exportSummary = computed(() => {
  const parts: string[] = []
  let totalCount = 0
  
  if (exportSavedDesigns.value && props.savedDesigns.length > 0) {
    parts.push(`${props.savedDesigns.length} saved design${props.savedDesigns.length === 1 ? '' : 's'}`)
    totalCount += props.savedDesigns.length
  }
  
  if (exportCurrentDesign.value) {
    parts.push('current design')
    totalCount += 1
  }
  
  if (parts.length === 0) return null
  
  return `Will export ${totalCount} design${totalCount === 1 ? '' : 's'}: ${parts.join(' and ')}`
})

const handleExportAll = () => {
  if (!canExport.value) return
  
  exportAll(props.savedDesigns, props.currentDesignData)
  emit('close')
}

// Set default filename when tab becomes active
watch(() => props.isActive, (isActive) => {
  if (isActive) {
    setDefaultFilename(props.savedDesigns.length)
  }
})
</script>

<style lang="scss" scoped>
.export-panel {
  h3 {
    margin: 0 0 1.5rem 0;
    color: #e2e8f0;
    font-size: 1.3rem;
    font-weight: 600;
  }
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.option-group {
  h4 {
    margin: 0 0 1rem 0;
    color: #cbd5e0;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 1rem;

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      color: #cbd5e0;
      font-size: 0.95rem;
      
      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #4a90e2;
        cursor: pointer;
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      
      .checkbox-text {
        user-select: none;
      }
      
      &:has(input:disabled) {
        opacity: 0.6;
        cursor: not-allowed;
        
        .checkbox-text {
          cursor: not-allowed;
        }
      }
    }
  }

  .warning {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(245, 101, 101, 0.1);
    border: 1px solid rgba(245, 101, 101, 0.3);
    border-radius: 8px;
    color: #fed7d7;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.input-group {
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

.export-summary {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #68d391;
    font-size: 0.95rem;
    font-weight: 500;

    .icon {
      font-size: 1.1rem;
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

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.btn-primary {
      background: linear-gradient(145deg, #10b981, #059669);
      color: white;

      &:hover:not(:disabled) {
        background: linear-gradient(145deg, #059669, #047857);
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
  }
}
</style>