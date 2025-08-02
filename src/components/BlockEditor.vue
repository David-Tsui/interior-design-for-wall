<template>
  <div class="editor">
    <h3>Block Editor</h3>
    <div class="editor-sections">
      <!-- Template Customization -->
      <div class="editor-section">
        <h4>Block Templates</h4>
        <div class="template-controls">
          <div class="template-item" v-for="(template, index) in templates" :key="index">
            <div class="template-preview" :style="{ backgroundColor: template.color, width: `${template.width * 0.5}px`, height: `${template.height * 0.5}px` }"></div>
            <div class="template-inputs">
              <div class="input-group">
                <label>Width (cm)</label>
                <input v-model.number="template.width" type="number" min="20" max="100" />
              </div>
              <div class="input-group">
                <label>Height (cm)</label>
                <input v-model.number="template.height" type="number" min="15" max="50" />
              </div>
              <div class="input-group">
                <label>Color</label>
                <input v-model="template.color" type="color" />
              </div>
            </div>
          </div>
        </div>

        <div class="template-actions">
          <button @click="addTemplate" class="button">Add Template</button>
          <button @click="resetTemplates" class="button secondary">Reset to Defaults</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Block } from '../types'
import { getRandomColor } from '../utils/helpers'

interface Props {
  blockTemplates: Block[]
}

interface Emits {
  (e: 'templates-updated', templates: Block[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const templates = ref<Block[]>([...props.blockTemplates])

watch(templates, (newTemplates) => {
  emit('templates-updated', [...newTemplates])
}, { deep: true })

const addTemplate = () => {
  const newTemplate: Block = {
    id: `template-${Date.now()}`,
    x: 0,
    y: 0,
    width: 60,
    height: 30,
    color: getRandomColor()
  }
  templates.value.push(newTemplate)
}

const resetTemplates = () => {
  templates.value = [
    { id: 'template-1', x: 0, y: 0, width: 60, height: 30, color: '#fff' },
    { id: 'template-2', x: 0, y: 0, width: 60, height: 30, color: '#eee' },
    { id: 'template-3', x: 0, y: 0, width: 60, height: 30, color: '#222' },
  ]
}
</script>

<style lang="scss" scoped>
.editor {
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
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.editor-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.editor-section {
  h4 {
    margin-bottom: 1rem;
    color: #34495e;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
  }
}

.template-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.template-preview {
  min-width: 30px;
  min-height: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.template-inputs {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #5a6c7d;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }

    &[type="color"] {
      width: 60px;
      height: 40px;
      padding: 0;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  }
}

.template-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(145deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 4px 15px rgba(52, 152, 219, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 20px rgba(52, 152, 219, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow:
      0 2px 10px rgba(52, 152, 219, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  &.secondary {
    background: linear-gradient(145deg, #95a5a6, #7f8c8d);
    box-shadow:
      0 4px 15px rgba(149, 165, 166, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &:hover {
      box-shadow:
        0 6px 20px rgba(149, 165, 166, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    &:active {
      box-shadow:
        0 2px 10px rgba(149, 165, 166, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
  }
}

@media (max-width: 768px) {
  .template-item {
    flex-direction: column;
    align-items: stretch;
  }

  .template-inputs {
    flex-direction: column;
  }

  .wall-controls {
    grid-template-columns: 1fr;

    .input-group:nth-child(3) {
      grid-column: span 1;
    }
  }
}
</style>
