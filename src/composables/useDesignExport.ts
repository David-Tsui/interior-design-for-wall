import { ref } from 'vue'
import { exportDesign } from '../utils/helpers'
import type { Design } from '../types'

export function useDesignExport() {
  const exportSavedDesigns = ref(true)
  const exportCurrentDesign = ref(false)
  const exportAllFilename = ref('')

  const exportSingle = (design: Design) => {
    exportDesign(design, design.name)
    alert(`✅ Design "${design.name}" exported successfully!`)
  }

  const exportAll = (
    savedDesigns: Design[], 
    currentDesignData?: any
  ) => {
    if (!exportAllFilename.value.trim()) return

    const exportData: any = {
      exportDate: new Date().toISOString(),
      designs: []
    }

    // Add saved designs if selected
    if (exportSavedDesigns.value && savedDesigns.length > 0) {
      exportData.designs.push(...savedDesigns)
    }

    // Add current design if selected
    if (exportCurrentDesign.value && currentDesignData) {
      const currentDesign = {
        id: crypto.randomUUID(),
        name: 'Current Design',
        createdAt: new Date().toISOString(),
        blocks: currentDesignData.blocks,
        blockTemplates: currentDesignData.blockTemplates,
        wall: currentDesignData.wall,
        preview: {
          blockCount: currentDesignData.blocks.length,
          wallDimensions: `${currentDesignData.wall.width}×${currentDesignData.wall.height}cm`,
          templateCount: currentDesignData.blockTemplates.length
        }
      }
      exportData.designs.push(currentDesign)
    }

    exportDesign(exportData, exportAllFilename.value.trim())
    
    const designCount = exportData.designs.length
    alert(`✅ Exported ${designCount} design${designCount === 1 ? '' : 's'} successfully!`)
  }

  const resetExportAll = () => {
    exportSavedDesigns.value = true
    exportCurrentDesign.value = false
    exportAllFilename.value = ''
  }

  const setDefaultFilename = (savedDesignsCount: number) => {
    const now = new Date()
    const timeStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + '-' +
      String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
    exportAllFilename.value = `designs-archive-${timeStr}`

    // Set defaults based on available designs
    exportSavedDesigns.value = savedDesignsCount > 0
    exportCurrentDesign.value = savedDesignsCount === 0
  }

  return {
    exportSavedDesigns,
    exportCurrentDesign,
    exportAllFilename,
    exportSingle,
    exportAll,
    resetExportAll,
    setDefaultFilename
  }
}