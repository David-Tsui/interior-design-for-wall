<template>
  <div class="editor">
    <h3>Block Editor</h3>
    <div class="editor-sections">
      <!-- Template Customization -->
      <div class="editor-section">
        <h4>Block Templates</h4>
        <div class="template-controls">
          <div
            class="template-item"
            v-for="(template, index) in templates"
            :key="template.id"
          >
            <div class="template-preview-section">
              <div class="input-group color-input">
                <label>Color</label>
                <div class="overlap-input">
                  <div
                    class="template-preview"
                    :style="getTemplatePreviewStyle(template)"
                  ></div>
                  <input
                    v-model="template.color"
                    type="color"
                  />
                </div>
              </div>
            </div>
            <div class="template-inputs">
              <div class="input-group">
                <label>Width (cm)</label>
                <input v-model.number="template.width" type="number" min="30" max="100" />
              </div>
              <div class="input-group">
                <label>Height (cm)</label>
                <input v-model.number="template.height" type="number" min="30" max="100" />
              </div>
              <div class="input-group">
                <label>Texture</label>
                <div class="texture-controls">
                  <button @click="uploadTexture(index)" class="button texture-btn">
                    {{ template.textureImage ? 'Change' : 'Add' }}
                  </button>
                  <button
                    v-if="template.textureImage"
                    @click="removeTexture(index)"
                    class="button secondary texture-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <button
                @click="removeTemplate(index)"
                class="remove-template-btn"
                v-if="templates.length > 1"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="template-actions">
          <button @click="addTemplate" class="button">Add Template</button>
          <button @click="resetTemplates" class="button secondary">Reset to Defaults</button>
        </div>
      </div>
    </div>

    <!-- Image Cropper Modal -->
    <ImageCropper
      :visible="showCropper"
      :image-url="cropperImageUrl"
      @cropped="onImageCropped"
      @cancel="onCropperCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { Block } from '../types'
import { getRandomColor } from '../utils/helpers'
import { defaultBlockTemplates } from '../config/blockTemplates'
import { uploadImage, blendImageWithColor } from '../utils/textureUpload'
import ImageCropper from './ImageCropper.vue'

interface Props {
  blockTemplates: Block[]
}

interface Emits {
  (e: 'templates-updated', templates: Block[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const templates = ref<Block[]>([...props.blockTemplates])
let isUpdatingFromProps = false

// Watch for prop changes to sync with parent
watch(() => props.blockTemplates, (newBlockTemplates) => {
  isUpdatingFromProps = true
  templates.value = [...newBlockTemplates]
  nextTick(() => {
    isUpdatingFromProps = false
  })
}, { deep: true })

// Only emit changes if they weren't caused by prop updates
watch(templates, (newTemplates) => {
  if (!isUpdatingFromProps) {
    emit('templates-updated', [...newTemplates])
  }
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

const removeTemplate = (index: number) => {
  if (templates.value.length > 1) {
    templates.value.splice(index, 1)
  }
}

const resetTemplates = () => {
  templates.value = structuredClone(defaultBlockTemplates)
}

// Image cropper state
const showCropper = ref(false)
const cropperImageUrl = ref('')
const currentTemplateIndex = ref(-1)

const getTemplatePreviewStyle = (template: Block) => {
  const style: any = {
    width: '40px',
    height: '100%',
    borderRadius: '6px'
  }

  if (template.textureImage) {
    // Show texture image blended with color
    style.backgroundImage = `url(${template.textureImage})`
    style.backgroundRepeat = 'repeat'
    style.backgroundSize = 'auto'
    style.backgroundColor = template.color
    style.backgroundBlendMode = 'multiply'
  } else {
    // Show solid color
    style.backgroundColor = template.color
  }

  return style
}

const uploadTexture = async (templateIndex: number) => {
  try {
    const imageDataUrl = await uploadImage()
    currentTemplateIndex.value = templateIndex
    cropperImageUrl.value = imageDataUrl
    showCropper.value = true
  } catch (error) {
    console.warn('Failed to upload image:', error)
  }
}

const onImageCropped = async (croppedImage: string) => {
  if (currentTemplateIndex.value >= 0) {
    try {
      // Blend the cropped image with the template color
      const template = templates.value[currentTemplateIndex.value]
      const blendedImage = await blendImageWithColor(croppedImage, template.color, 0.6)

      // Update the template
      templates.value[currentTemplateIndex.value].textureImage = blendedImage
    } catch (error) {
      console.error('Failed to process texture:', error)
      // Fallback: use the cropped image directly
      templates.value[currentTemplateIndex.value].textureImage = croppedImage
    }
  }

  showCropper.value = false
  currentTemplateIndex.value = -1
  cropperImageUrl.value = ''
}

const onCropperCancel = () => {
  showCropper.value = false
  currentTemplateIndex.value = -1
  cropperImageUrl.value = ''
}

const removeTexture = (templateIndex: number) => {
  if (templateIndex >= 0 && templateIndex < templates.value.length) {
    delete templates.value[templateIndex].textureImage
  }
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
  align-items: start;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.template-preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-width: 80px;
}

.template-preview {
  border: 2px solid #ddd;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.template-inputs {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  align-items: flex-end;
}

.color-input {
  min-width: 60px;

  input[type="color"] {
    width: 50px;
    height: 35px;
    border-radius: 8px;
    border: 2px solid #ddd;
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;

    // Remove the default color picker styling to show our custom background
    &::-webkit-color-swatch-wrapper {
      padding: 0;
      border: none;
      border-radius: 6px;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: 6px;
    }

    &::-moz-color-swatch {
      border: none;
      border-radius: 6px;
    }

    &:hover {
      border-color: #3498db;
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    }

    &:focus {
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
  }
}

.remove-template-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background: linear-gradient(145deg, #95a5a6, #7f8c8d);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #7f8c8d, #6c7b7d);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
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
  }

  input[type="color"] {
    width: 60px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
}

.texture-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  .texture-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    min-width: auto;
  }
}

.overlap-input {
  position: relative;
  height: 34px;

  input[type="color"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
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
}
</style>
