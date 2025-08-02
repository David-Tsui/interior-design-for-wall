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

export const findValidPositionWithinWall = (
  blockSize: { width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): { x: number, y: number } | null => {
  const step = 2 // Finer grid for better space utilization
  
  // Generate potential positions prioritizing corners and edges
  const positions: { x: number, y: number, priority: number }[] = []
  
  // Only search within wall boundaries - no overflow allowed for random generation
  for (let y = 0; y <= wall.height - blockSize.height; y += step) {
    for (let x = 0; x <= wall.width - blockSize.width; x += step) {
      // Calculate priority: prefer positions near existing blocks or edges
      let priority = 0
      
      // Edge preference (higher priority for edges)
      if (x === 0 || y === 0 || x + blockSize.width === wall.width || y + blockSize.height === wall.height) {
        priority += 10
      }
      
      // Adjacency preference (check if near existing blocks)
      const testBlock = { x, y, width: blockSize.width, height: blockSize.height }
      for (const existing of existingBlocks) {
        if (excludeBlockId && existing.id === excludeBlockId) continue
        
        // Check if adjacent (touching edges)
        const isAdjacent = (
          (Math.abs(testBlock.x + testBlock.width - existing.x) <= step || 
           Math.abs(existing.x + existing.width - testBlock.x) <= step) &&
          !(testBlock.y + testBlock.height < existing.y || existing.y + existing.height < testBlock.y)
        ) || (
          (Math.abs(testBlock.y + testBlock.height - existing.y) <= step || 
           Math.abs(existing.y + existing.height - testBlock.y) <= step) &&
          !(testBlock.x + testBlock.width < existing.x || existing.x + existing.width < testBlock.x)
        )
        
        if (isAdjacent) {
          priority += 5
          break
        }
      }
      
      positions.push({ x, y, priority })
    }
  }
  
  // Sort by priority (highest first) and test positions
  positions.sort((a, b) => b.priority - a.priority)
  
  for (const pos of positions) {
    const testBlock = { x: pos.x, y: pos.y, width: blockSize.width, height: blockSize.height }
    
    // Check collision with existing blocks and ensure within strict wall bounds
    if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId) &&
        pos.x >= 0 && pos.y >= 0 && 
        pos.x + blockSize.width <= wall.width && 
        pos.y + blockSize.height <= wall.height) {
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
  const maxBlockHeight = 30 // Maximum block height from templates
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

export const generateOptimizedLayout = (
  wall: { width: number, height: number },
  blockSizes: { width: number, height: number }[],
  maxBlocks: number = 50
): { x: number, y: number, width: number, height: number, color: string }[] => {
  const blocks: { x: number, y: number, width: number, height: number, color: string, id: string }[] = []
  let attempts = 0
  const maxAttempts = maxBlocks * 3

  while (blocks.length < maxBlocks && attempts < maxAttempts) {
    attempts++

    // Choose a random block size
    const blockSize = blockSizes[Math.floor(Math.random() * blockSizes.length)]

    // Try to find a valid position
    const position = findValidPosition(blockSize, blocks, wall)

    if (position) {
      blocks.push({
        id: generateId(),
        x: position.x,
        y: position.y,
        width: blockSize.width,
        height: blockSize.height,
        color: getRandomColor()
      })
    }
  }

  return blocks.map(({ id, ...block }) => block)
}
