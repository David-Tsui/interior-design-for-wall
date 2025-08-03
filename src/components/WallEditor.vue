<template>
  <div class="editor">
    <h3>Wall Editor</h3>
    <div class="editor-sections">
      <!-- Wall Settings -->
      <div class="editor-section">
        <h4>Wall Settings</h4>
        <div class="wall-controls">
          <div class="input-group">
            <label>Wall Width (cm)</label>
            <input v-model.number="wallSettings.width" type="number" min="100" max="1000" />
          </div>
          <div class="input-group">
            <label>Wall Height (cm)</label>
            <input v-model.number="wallSettings.height" type="number" min="100" max="500" />
          </div>
          <div class="input-group">
            <label>Wall Color</label>
            <input v-model="wallSettings.backgroundColor" type="color" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Wall } from '../types'

interface Props {
  wall: Wall
}

interface Emits {
  (e: 'wall-updated', wall: Wall): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local reactive copies
const wallSettings = ref<Wall>({ ...props.wall })

// Watch for prop changes to sync with parent
watch(() => props.wall, (newWall) => {
  wallSettings.value = { ...newWall }
}, { deep: true })

// Watch for changes and emit updates
watch(wallSettings, (newWall) => {
  emit('wall-updated', { ...newWall })
}, { deep: true })
</script>

<style lang="scss" scoped>
.editor {
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
    color: #cbd5e0;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
  }
}

.wall-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  .input-group:nth-child(3) {
    grid-column: span 2;
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #a0aec0;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #4a90e2;
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

.button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(145deg, #4a90e2, #3182ce);
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
    background: linear-gradient(145deg, #4a5568, #2d3748);
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
  .wall-controls {
    grid-template-columns: 1fr;

    .input-group:nth-child(3) {
      grid-column: span 1;
    }
  }
}
</style>
