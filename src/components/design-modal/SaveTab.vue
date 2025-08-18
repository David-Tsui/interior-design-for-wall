<template>
  <div class="save-panel">
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
      <button class="btn btn-secondary" @click="$emit('close')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  currentDesignData: {
    blocks: any[]
    blockTemplates: any[]
    wall: any
  }
  isActive: boolean
}

interface Emits {
  (e: 'save', name: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const saveName = ref('')

const currentPreview = computed(() => {
  return {
    blockCount: props.currentDesignData.blocks.length,
    wallDimensions: `${props.currentDesignData.wall.width}×${props.currentDesignData.wall.height}cm`,
    templateCount: props.currentDesignData.blockTemplates.length
  }
})

const handleSave = () => {
  if (!saveName.value.trim()) return
  emit('save', saveName.value.trim())
  saveName.value = ''
}

// Generate default name when tab becomes active
watch(() => props.isActive, (isActive) => {
  if (isActive && !saveName.value.trim()) {
    const now = new Date()
    const timeStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0')
    saveName.value = `Design ${timeStr}`
  }
})
</script>

<style lang="scss" scoped>
.save-panel {
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
  }
}
</style>