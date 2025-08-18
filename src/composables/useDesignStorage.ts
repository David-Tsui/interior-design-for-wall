import { ref, computed } from 'vue'
import type { Design } from '../types'

export function useDesignStorage() {
  const savedDesigns = ref<Design[]>([])

  const loadSavedDesigns = () => {
    savedDesigns.value = JSON.parse(localStorage.getItem('wallDesigns') || '[]')
  }

  const saveDesign = (design: Design) => {
    const existingIndex = savedDesigns.value.findIndex(d => d.id === design.id)
    if (existingIndex >= 0) {
      savedDesigns.value[existingIndex] = design
    } else {
      savedDesigns.value.push(design)
    }
    localStorage.setItem('wallDesigns', JSON.stringify(savedDesigns.value))
  }

  const deleteDesign = (index: number) => {
    savedDesigns.value.splice(index, 1)
    localStorage.setItem('wallDesigns', JSON.stringify(savedDesigns.value))
  }

  const importDesigns = (designs: Design[], overwrite: boolean = false) => {
    let importedCount = 0
    let overwrittenCount = 0
    let skippedCount = 0

    for (const design of designs) {
      const existingIndex = savedDesigns.value.findIndex(d => d.name === design.name)
      
      if (existingIndex >= 0) {
        if (overwrite) {
          savedDesigns.value[existingIndex] = design
          overwrittenCount++
        } else {
          skippedCount++
        }
      } else {
        savedDesigns.value.push(design)
        importedCount++
      }
    }

    localStorage.setItem('wallDesigns', JSON.stringify(savedDesigns.value))

    return { importedCount, overwrittenCount, skippedCount }
  }

  const designCount = computed(() => savedDesigns.value.length)

  return {
    savedDesigns,
    designCount,
    loadSavedDesigns,
    saveDesign,
    deleteDesign,
    importDesigns
  }
}