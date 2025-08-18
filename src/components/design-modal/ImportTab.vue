<template>
  <div class="import-panel">
    <h3>Import Design</h3>

    <div class="file-upload-section">
      <div class="upload-area">
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          @change="handleFileSelect"
          class="file-input"
        />
        <div class="upload-content">
          <div class="upload-icon">📁</div>
          <p class="upload-text">
            <strong>Click to select a design file</strong>
          </p>
          <p class="upload-subtext">
            Supports single designs or design archives (.json files)
          </p>
        </div>
      </div>

      <div v-if="selectedFile" class="file-info">
        <div class="file-details">
          <span class="file-icon">📄</span>
          <div class="file-meta">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <button class="remove-file-btn" @click="resetImportState" title="Remove file">
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Import Preview -->
    <div v-if="importPreview" class="import-preview">
      <h4>📋 Import Preview</h4>
      
      <div class="preview-card">
        <div class="preview-header">
          <div class="preview-info">
            <h5>{{ importPreview.name }}</h5>
            <div class="preview-meta">
              <div v-if="importPreview.type === 'single'" class="meta-row">
                <span class="icon">📐</span>
                <span>{{ importPreview.wallDimensions }}</span>
              </div>
              <div v-if="importPreview.type === 'single'" class="meta-row">
                <span class="icon">🧱</span>
                <span>{{ importPreview.blockCount }} blocks</span>
              </div>
              <div v-if="importPreview.type === 'single'" class="meta-row">
                <span class="icon">🎨</span>
                <span>{{ importPreview.templateCount }} templates</span>
              </div>
              <div v-if="importPreview.type === 'single'" class="meta-row">
                <span class="icon">📅</span>
                <span>{{ importPreview.createdAt }}</span>
              </div>
              
              <div v-if="importPreview.type === 'multiple'" class="meta-row">
                <span class="icon">📁</span>
                <span>{{ importPreview.designCount }} designs</span>
              </div>
              <div v-if="importPreview.type === 'multiple'" class="meta-row">
                <span class="icon">📅</span>
                <span>Exported: {{ importPreview.exportDate }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="importPreview.type === 'multiple'" class="archive-note">
          <span class="icon">💡</span>
          <span>This archive contains multiple designs that will be imported together</span>
        </div>
      </div>

      <!-- Import Options -->
      <div class="import-options">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="overwriteExisting"
          />
          <span class="checkbox-text">
            Overwrite existing designs with same names
          </span>
          <span class="checkbox-hint">
            (If unchecked, designs with duplicate names will be skipped)
          </span>
        </label>
      </div>
    </div>

    <div class="action-buttons">
      <button
        class="btn btn-primary"
        @click="handleImport"
        :disabled="!importPreview"
      >
        📥 Import {{ importPreview?.type === 'multiple' ? 'Designs' : 'Design' }}
      </button>
      <button class="btn btn-secondary" @click="$emit('close')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDesignImport } from '../../composables/useDesignImport'

interface Emits {
  (e: 'import-designs', result: { type: 'single' | 'multiple', designs: any[], overwrite: boolean }): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const {
  selectedFile,
  importPreview,
  overwriteExisting,
  fileInput,
  handleFileSelect,
  resetImportState,
  processImport,
  formatFileSize
} = useDesignImport()

const handleImport = () => {
  try {
    const result = processImport()
    emit('import-designs', { ...result, overwrite: overwriteExisting.value })
    resetImportState()
    emit('close')
  } catch (error) {
    console.error('Import error:', error)
    alert('Error importing design. Please try again.')
  }
}
</script>

<style lang="scss" scoped>
.import-panel {
  h3 {
    margin: 0 0 1.5rem 0;
    color: #e2e8f0;
    font-size: 1.3rem;
    font-weight: 600;
  }
}

.file-upload-section {
  margin-bottom: 1.5rem;
}

.upload-area {
  position: relative;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: rgba(74, 144, 226, 0.6);
    background: rgba(74, 144, 226, 0.05);
  }

  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .upload-content {
    pointer-events: none;

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .upload-text {
      margin: 0 0 0.5rem 0;
      color: #e2e8f0;
      font-size: 1.1rem;
    }

    .upload-subtext {
      margin: 0;
      color: #a0aec0;
      font-size: 0.9rem;
    }
  }
}

.file-info {
  margin-top: 1rem;
  
  .file-details {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;

    .file-icon {
      font-size: 1.5rem;
    }

    .file-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .file-name {
        color: #e2e8f0;
        font-weight: 500;
        font-size: 0.95rem;
      }

      .file-size {
        color: #a0aec0;
        font-size: 0.8rem;
      }
    }

    .remove-file-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(145deg, #e53e3e, #c53030);
      color: white;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: linear-gradient(145deg, #c53030, #9c2626);
        transform: scale(1.1);
      }
    }
  }
}

.import-preview {
  background: rgba(74, 144, 226, 0.05);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  h4 {
    margin: 0 0 1rem 0;
    color: #4a90e2;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .preview-card {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;

    .preview-header {
      .preview-info {
        h5 {
          margin: 0 0 0.75rem 0;
          color: #e2e8f0;
          font-size: 1rem;
          font-weight: 600;
        }

        .preview-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;

          .meta-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #cbd5e0;
            font-size: 0.85rem;

            .icon {
              font-size: 0.9rem;
            }
          }
        }
      }
    }

    .archive-note {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #68d391;
      font-size: 0.9rem;

      .icon {
        font-size: 1rem;
      }
    }
  }
}

.import-options {
  margin-bottom: 1.5rem;

  .checkbox-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    cursor: pointer;
    color: #cbd5e0;

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #4a90e2;
      cursor: pointer;
      margin-bottom: 0.5rem;
    }

    .checkbox-text {
      font-size: 0.95rem;
      font-weight: 500;
      user-select: none;
      margin-left: 1.5rem;
      margin-top: -1.5rem;
    }

    .checkbox-hint {
      font-size: 0.8rem;
      color: #a0aec0;
      margin-left: 1.5rem;
      margin-top: -0.25rem;
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