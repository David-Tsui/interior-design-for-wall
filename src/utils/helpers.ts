export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const isHorizontalOverflow = (block: { x: number, width: number }, wall: { width: number }): boolean => {
  return (block.x + block.width > wall.width) || (block.x < 0)
}

export const isValidHorizontalPosition = (block: { x: number, width: number }, wall: { width: number }): boolean => {
  const maxBlockWidth = 60 // Maximum block width from templates
  return (block.x >= -maxBlockWidth) && (block.x + block.width <= wall.width + maxBlockWidth)
}

export const isVerticalOverflow = (block: { y: number, height: number }, wall: { height: number }): boolean => {
  return (block.y < 0) || (block.y + block.height > wall.height)
}

export const isValidVerticalPosition = (block: { y: number, height: number }, wall: { height: number }): boolean => {
  const maxBlockHeight = 30 // Maximum block height from templates
  return (block.y >= -maxBlockHeight) && (block.y + block.height <= wall.height)
}

export const getRandomColor = (): string => {
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6',
    '#e67e22', '#e91e63', '#8d6e63', '#95a5a6', '#1abc9c'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export const checkCollision = (block1: { x: number, y: number, width: number, height: number },
  block2: { x: number, y: number, width: number, height: number }): boolean => {
  return !(block1.x + block1.width <= block2.x ||
    block2.x + block2.width <= block1.x ||
    block1.y + block1.height <= block2.y ||
    block2.y + block2.height <= block1.y)
}

export const isWithinBounds = (block: { x: number, y: number, width: number, height: number },
  wall: { width: number, height: number }): boolean => {
  return isValidVerticalPosition(block, wall)
  // Note: Horizontal bounds are not enforced to allow overflow
  // Note: Vertical bounds now allow top overflow up to one block height
}

export const canPlaceBlock = (
  newBlock: { x: number, y: number, width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): boolean => {
  // Check if within wall bounds
  if (!isWithinBounds(newBlock, wall)) {
    return false
  }

  // Check for collisions with existing blocks
  for (const block of existingBlocks) {
    if (excludeBlockId && block.id === excludeBlockId) {
      continue
    }
    if (checkCollision(newBlock, block)) {
      return false
    }
  }

  return true
}

export const findPositionAdjacentToTarget = (
  blockSize: { width: number, height: number },
  targetBlock: { x: number, y: number, width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  dragPosition: { x: number, y: number },
  excludeBlockId?: string
): { x: number, y: number } | null => {
  // Generate positions adjacent to the target block
  const adjacentPositions = [
    { x: targetBlock.x + targetBlock.width, y: targetBlock.y, priority: 1 }, // Right
    { x: targetBlock.x - blockSize.width, y: targetBlock.y, priority: 2 }, // Left
    { x: targetBlock.x, y: targetBlock.y + targetBlock.height, priority: 3 }, // Below
    { x: targetBlock.x, y: targetBlock.y - blockSize.height, priority: 4 }, // Above
    { x: targetBlock.x + targetBlock.width, y: targetBlock.y + targetBlock.height, priority: 5 }, // Bottom-right corner
    { x: targetBlock.x - blockSize.width, y: targetBlock.y + targetBlock.height, priority: 5 }, // Bottom-left corner
    { x: targetBlock.x + targetBlock.width, y: targetBlock.y - blockSize.height, priority: 6 }, // Top-right corner
    { x: targetBlock.x - blockSize.width, y: targetBlock.y - blockSize.height, priority: 6 }, // Top-left corner
  ]

  // Calculate distances from drag position and sort by closest
  const positionsWithDistance = adjacentPositions.map(pos => {
    const distance = Math.sqrt(Math.pow(pos.x - dragPosition.x, 2) + Math.pow(pos.y - dragPosition.y, 2))
    return { ...pos, distance }
  }).sort((a, b) => a.distance - b.distance)

  // Test positions starting with the closest to drag position
  for (const pos of positionsWithDistance) {
    const testBlock = { x: pos.x, y: pos.y, width: blockSize.width, height: blockSize.height }

    if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId) &&
        isValidHorizontalPosition(testBlock, wall) &&
        isValidVerticalPosition(testBlock, wall)) {
      return { x: pos.x, y: pos.y }
    }
  }

  return null
}

export const findValidPosition = (
  blockSize: { width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): { x: number, y: number } | null => {
  const step = 5 // Grid step for placement attempts
  const maxBlockWidth = 60 // Maximum block width from templates

  // If no existing blocks, place at origin
  if (existingBlocks.length === 0 || (excludeBlockId && existingBlocks.length === 1)) {
    return { x: 0, y: 0 }
  }

  // Generate candidate positions adjacent to existing blocks
  const candidatePositions: { x: number, y: number, priority: number }[] = []

  for (const block of existingBlocks) {
    if (excludeBlockId && block.id === excludeBlockId) continue

    // Try positions adjacent to this block (right, left, below, above)
    const adjacentPositions = [
      { x: block.x + block.width, y: block.y, priority: 1 }, // Right
      { x: block.x - blockSize.width, y: block.y, priority: 2 }, // Left
      { x: block.x, y: block.y + block.height, priority: 3 }, // Below
      { x: block.x, y: block.y - blockSize.height, priority: 4 }, // Above
      { x: block.x + block.width, y: block.y + block.height, priority: 5 }, // Bottom-right corner
      { x: block.x - blockSize.width, y: block.y + block.height, priority: 5 }, // Bottom-left corner
      { x: block.x + block.width, y: block.y - blockSize.height, priority: 6 }, // Top-right corner
      { x: block.x - blockSize.width, y: block.y - blockSize.height, priority: 6 }, // Top-left corner
    ]

    candidatePositions.push(...adjacentPositions)
  }

  // Sort by priority (prefer right, then left, then below, etc.)
  candidatePositions.sort((a, b) => a.priority - b.priority)

  // Test candidate positions
  for (const pos of candidatePositions) {
    const testBlock = { x: pos.x, y: pos.y, width: blockSize.width, height: blockSize.height }

    // Check if position is valid (within bounds + overflow limits, no collisions)
    if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId) &&
        isValidHorizontalPosition(testBlock, wall)) {
      return { x: pos.x, y: pos.y }
    }
  }

  // Fallback: try systematic search within wall boundaries if adjacent placement fails
  const maxBlockHeight = 60 // Maximum block height from templates
  for (let y = -maxBlockHeight; y <= wall.height; y += step) {
    for (let x = 0; x <= wall.width - blockSize.width; x += step) {
      const testBlock = { x, y, width: blockSize.width, height: blockSize.height }
      if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId) &&
          isValidHorizontalPosition(testBlock, wall) &&
          isValidVerticalPosition(testBlock, wall)) {
        return { x, y }
      }
    }
  }

  // Last resort: try positions with limited horizontal and vertical overflow
  for (let y = -maxBlockHeight; y <= wall.height; y += step) {
    for (let x = wall.width - blockSize.width + step; x <= wall.width + maxBlockWidth; x += step) {
      const testBlock = { x, y, width: blockSize.width, height: blockSize.height }
      if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId) &&
          isValidHorizontalPosition(testBlock, wall) &&
          isValidVerticalPosition(testBlock, wall)) {
        return { x, y }
      }
    }
  }

  return null
}

// EXPORT/IMPORT UTILITIES
// =======================

export const exportDesign = (designData: any, filename: string): void => {
  const dataStr = JSON.stringify(designData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

  const exportFileDefaultName = `${filename}.json`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

export const importDesignFromFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const designData = JSON.parse(content)

        // Validate the design data structure
        if (validateImportedDesign(designData)) {
          resolve(designData)
        } else {
          reject(new Error('Invalid design file format. Please select a valid exported design file.'))
        }
      } catch (error) {
        reject(new Error('Error reading file. Please make sure it\'s a valid JSON file.'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

export const validateImportedDesign = (data: any): boolean => {
  return data &&
         typeof data === 'object' &&
         Array.isArray(data.blocks) &&
         Array.isArray(data.blockTemplates) &&
         data.wall &&
         typeof data.wall.width === 'number' &&
         typeof data.wall.height === 'number' &&
         typeof data.name === 'string'
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return Math.round(bytes / (1024 * 1024)) + ' MB'
}

// SMART INTERSECTION SYSTEM
// =========================

export const calculateIntersectionPercentage = (
  block1: { x: number, y: number, width: number, height: number },
  block2: { x: number, y: number, width: number, height: number }
): number => {
  if (!checkCollision(block1, block2)) {
    return 0
  }

  // Calculate overlap area
  const overlapLeft = Math.max(block1.x, block2.x)
  const overlapRight = Math.min(block1.x + block1.width, block2.x + block2.width)
  const overlapTop = Math.max(block1.y, block2.y)
  const overlapBottom = Math.min(block1.y + block1.height, block2.y + block2.height)

  const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop)
  const block1Area = block1.width * block1.height

  // Return percentage of block1 that's overlapping
  return (overlapArea / block1Area) * 100
}

export const hasSmallIntersection = (
  newBlock: { x: number, y: number, width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  thresholdPercentage: number = 25,
  excludeBlockId?: string
): { hasSmallIntersection: boolean, collidingBlocks: any[] } => {
  const collidingBlocks = []

  for (const block of existingBlocks) {
    if (excludeBlockId && block.id === excludeBlockId) {
      continue
    }

    const intersectionPercent = calculateIntersectionPercentage(newBlock, block)

    if (intersectionPercent > 0 && intersectionPercent < thresholdPercentage) {
      collidingBlocks.push({
        block,
        intersectionPercent
      })
    }
  }

  return {
    hasSmallIntersection: collidingBlocks.length > 0,
    collidingBlocks
  }
}

export const findBestPositionAroundBlock = (
  draggingBlockSize: { width: number, height: number },
  targetBlock: { x: number, y: number, width: number, height: number, id: string },
  originalPosition: { x: number, y: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): { x: number, y: number } | null => {
  const padding = 0 // No padding between blocks for tight fitting

  // Try positions around the target block, prioritized by distance to original position
  const potentialPositions = [
    // Right side
    {
      x: targetBlock.x + targetBlock.width + padding,
      y: targetBlock.y,
      side: 'right'
    },
    {
      x: targetBlock.x + targetBlock.width + padding,
      y: targetBlock.y + targetBlock.height - draggingBlockSize.height,
      side: 'right'
    },
    {
      x: targetBlock.x + targetBlock.width + padding,
      y: targetBlock.y + (targetBlock.height - draggingBlockSize.height) / 2,
      side: 'right'
    },

    // Left side
    {
      x: targetBlock.x - draggingBlockSize.width - padding,
      y: targetBlock.y,
      side: 'left'
    },
    {
      x: targetBlock.x - draggingBlockSize.width - padding,
      y: targetBlock.y + targetBlock.height - draggingBlockSize.height,
      side: 'left'
    },
    {
      x: targetBlock.x - draggingBlockSize.width - padding,
      y: targetBlock.y + (targetBlock.height - draggingBlockSize.height) / 2,
      side: 'left'
    },

    // Top side
    {
      x: targetBlock.x,
      y: targetBlock.y - draggingBlockSize.height - padding,
      side: 'top'
    },
    {
      x: targetBlock.x + targetBlock.width - draggingBlockSize.width,
      y: targetBlock.y - draggingBlockSize.height - padding,
      side: 'top'
    },
    {
      x: targetBlock.x + (targetBlock.width - draggingBlockSize.width) / 2,
      y: targetBlock.y - draggingBlockSize.height - padding,
      side: 'top'
    },

    // Bottom side
    {
      x: targetBlock.x,
      y: targetBlock.y + targetBlock.height + padding,
      side: 'bottom'
    },
    {
      x: targetBlock.x + targetBlock.width - draggingBlockSize.width,
      y: targetBlock.y + targetBlock.height + padding,
      side: 'bottom'
    },
    {
      x: targetBlock.x + (targetBlock.width - draggingBlockSize.width) / 2,
      y: targetBlock.y + targetBlock.height + padding,
      side: 'bottom'
    }
  ]

  // Calculate distance from original position and sort
  const positionsWithDistance = potentialPositions.map(pos => {
    const distance = Math.sqrt(
      Math.pow(pos.x - originalPosition.x, 2) +
      Math.pow(pos.y - originalPosition.y, 2)
    )
    return { ...pos, distance }
  }).sort((a, b) => a.distance - b.distance)

  // Test positions starting with closest to original
  for (const pos of positionsWithDistance) {
    const testBlock = {
      x: pos.x,
      y: pos.y,
      width: draggingBlockSize.width,
      height: draggingBlockSize.height
    }

    // Check if position is valid (no collisions, within reasonable bounds)
    const canPlace = canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId)
    const isValidHorizontal = isValidHorizontalPosition(testBlock, wall)
    const isValidVertical = isValidVerticalPosition(testBlock, wall)

    if (canPlace && isValidHorizontal && isValidVertical) {
      return { x: pos.x, y: pos.y }
    }
  }

  return null
}
