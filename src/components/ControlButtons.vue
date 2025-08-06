<template>
  <div class="controls-section">
    <h3>Controls</h3>
    <div class="control-groups">
      <div class="control-group">
        <h4>Generate</h4>
        <div class="controls-grid">
          <button
            @click="$emit('generate-random')"
            class="button"
          >
            Random Design
          </button>

          <button
            @click="$emit('generate-staggered')"
            class="button staggered-btn"
          >
            Staggered Design
          </button>

          <button
            @click="$emit('clear-design')"
            class="button clear-btn"
          >
            Clear Design
          </button>
        </div>
      </div>

      <div class="control-group">
        <h4>Save/Load</h4>
        <div class="controls-grid">
          <button
            @click="$emit('save-design')"
            class="button"
          >
            Save Design
          </button>

          <button
            @click="$emit('load-design')"
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
              :checked="showOverflowWarnings"
              @change="$emit('update:showOverflowWarnings', ($event.target as HTMLInputElement).checked)"
            />
            <span class="slider"></span>
            <span class="label-text">Show Overflow Warnings ⚠️</span>
          </label>
          
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="hideOverflowBlocks"
              @change="$emit('update:hideOverflowBlocks', ($event.target as HTMLInputElement).checked)"
            />
            <span class="slider"></span>
            <span class="label-text">Hide Overflow Blocks 🙈</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showOverflowWarnings: boolean
  hideOverflowBlocks: boolean
}

interface Emits {
  (e: 'generate-random'): void
  (e: 'generate-staggered'): void
  (e: 'clear-design'): void
  (e: 'save-design'): void
  (e: 'load-design'): void
  (e: 'update:showOverflowWarnings', value: boolean): void
  (e: 'update:hideOverflowBlocks', value: boolean): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style lang="scss" scoped>
.controls-section {
  h3 {
    margin-bottom: 1.5rem;
    color: #e2e8f0;
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
      color: #cbd5e0;
      font-size: 1.1rem;
      font-weight: 600;
      border-bottom: 2px solid #4a90e2;
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
      background-color: #4a5568;
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
      color: #a0aec0;
    }

    &:hover .slider {
      background-color: #2d3748;

      &:before {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
    }

    input:checked + .slider:hover {
      background-color: #3182ce;
    }
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

.clear-btn {
  background: linear-gradient(145deg, #e53e3e, #c53030) !important;
  box-shadow:
    0 4px 15px rgba(229, 62, 62, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;

  &:hover {
    box-shadow:
      0 6px 20px rgba(229, 62, 62, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }

  &:active {
    box-shadow:
      0 2px 10px rgba(229, 62, 62, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }
}

@media (max-width: 768px) {
  .control-groups {
    flex-direction: column;
    gap: 2rem;
  }
}
</style>
