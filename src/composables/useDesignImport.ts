import { ref } from 'vue'
import { formatFileSize } from '../utils/helpers'
import type { Design } from '../types'

interface ImportPreview {
  type: 'single' | 'multiple'
  name: string
  blockCount?: number
  wallDimensions?: string
  templateCount?: number
  createdAt?: string
  designCount?: number
  exportDate?: string
  data: any
}

export function useDesignImport() {
  const selectedFile = ref<File | null>(null)
  const importPreview = ref<ImportPreview | null>(null)
  const overwriteExisting = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  const validateDesignData = (data: any): boolean => {
    return data &&
      typeof data === 'object' &&
      Array.isArray(data.blocks) &&
      Array.isArray(data.blockTemplates) &&
      data.wall &&
      typeof data.wall.width === 'number' &&
      typeof data.wall.height === 'number'
  }

  const validateMultipleDesignsData = (data: any): boolean => {
    return data &&
      typeof data === 'object' &&
      Array.isArray(data.designs) &&
      data.designs.length > 0 &&
      data.designs.every((design: any) => validateDesignData(design))
  }

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
      selectedFile.value = file
      readFileContent(file)
    }
  }

  const readFileContent = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const fileData = JSON.parse(content)

        // Check if it's a single design or multiple designs
        if (validateDesignData(fileData)) {
          // Single design
          importPreview.value = {
            type: 'single',
            name: fileData.name || 'Imported Design',
            blockCount: fileData.blocks?.length || 0,
            wallDimensions: `${fileData.wall?.width || 0}×${fileData.wall?.height || 0}cm`,
            templateCount: fileData.blockTemplates?.length || 0,
            createdAt: fileData.createdAt ? formatDate(fileData.createdAt) : 'Unknown',
            data: fileData
          }
        } else if (validateMultipleDesignsData(fileData)) {
          // Multiple designs archive
          const designs = fileData.designs || []
          importPreview.value = {
            type: 'multiple',
            name: `Design Archive (${designs.length} designs)`,
            designCount: designs.length,
            exportDate: fileData.exportDate ? formatDate(fileData.exportDate) : 'Unknown',
            data: fileData
          }
        } else {
          alert('Invalid design file format. Please select a valid exported design file or archive.')
          resetImportState()
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid JSON file.')
        resetImportState()
      }
    }
    reader.readAsText(file)
  }

  const resetImportState = () => {
    selectedFile.value = null
    importPreview.value = null
    overwriteExisting.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }

  const processImport = (): { type: 'single' | 'multiple', designs: Design[], message?: string } => {
    if (!importPreview.value) throw new Error('No import preview available')

    const importData = importPreview.value.data

    if (importPreview.value.type === 'single') {
      // Single design import
      const designData = importData
      const designToImport: Design = {
        id: crypto.randomUUID(),
        name: designData.name,
        createdAt: designData.createdAt || new Date().toISOString(),
        blocks: designData.blocks,
        blockTemplates: designData.blockTemplates,
        wall: designData.wall,
        preview: designData.preview || {
          blockCount: designData.blocks.length,
          wallDimensions: `${designData.wall.width}×${designData.wall.height}cm`,
          templateCount: designData.blockTemplates.length
        }
      }

      return { type: 'single', designs: [designToImport] }
    } else {
      // Multiple designs import
      const designs = importData.designs || []
      const processedDesigns: Design[] = designs.map((designData: any) => ({
        ...designData,
        id: crypto.randomUUID(),
        preview: designData.preview || {
          blockCount: designData.blocks.length,
          wallDimensions: `${designData.wall.width}×${designData.wall.height}cm`,
          templateCount: designData.blockTemplates.length
        }
      }))

      return { type: 'multiple', designs: processedDesigns }
    }
  }

  return {
    selectedFile,
    importPreview,
    overwriteExisting,
    fileInput,
    handleFileSelect,
    resetImportState,
    processImport,
    formatFileSize
  }
}