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
  // Early exit if block is too large for wall
  if (blockSize.width > wall.width || blockSize.height > wall.height) {
    return null
  }

  const step = existingBlocks.length > 30 ? 4 : 2 // Adaptive step size
  const maxPositionsToTest = 200 // Limit for performance

  // For early placement (few blocks), prioritize corners and edges
  if (existingBlocks.length <= 5) {
    const cornerPositions = [
      { x: 0, y: 0, priority: 100 },
      { x: wall.width - blockSize.width, y: 0, priority: 95 },
      { x: 0, y: wall.height - blockSize.height, priority: 90 },
      { x: wall.width - blockSize.width, y: wall.height - blockSize.height, priority: 85 }
    ].filter(pos => pos.x >= 0 && pos.y >= 0)

    for (const pos of cornerPositions) {
      const testBlock = { x: pos.x, y: pos.y, width: blockSize.width, height: blockSize.height }
      if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId)) {
        return { x: pos.x, y: pos.y }
      }
    }
  }

  // Generate positions with smart priority system
  const positions: { x: number, y: number, priority: number }[] = []

  for (let y = 0; y <= wall.height - blockSize.height; y += step) {
    for (let x = 0; x <= wall.width - blockSize.width; x += step) {
      let priority = 0

      // Edge preference (moderate boost for edges)
      if (x === 0 || y === 0 || x + blockSize.width >= wall.width - step || y + blockSize.height >= wall.height - step) {
        priority += 8
      }

      // Adjacency preference (strong boost for positions near existing blocks)
      const testBlock = { x, y, width: blockSize.width, height: blockSize.height }
      let hasAdjacentBlock = false

      for (const existing of existingBlocks) {
        if (excludeBlockId && existing.id === excludeBlockId) continue

        // Simplified adjacency check for performance
        const isAdjacent = (
          Math.abs(testBlock.x - (existing.x + existing.width)) <= step ||
          Math.abs(testBlock.x + testBlock.width - existing.x) <= step ||
          Math.abs(testBlock.y - (existing.y + existing.height)) <= step ||
          Math.abs(testBlock.y + testBlock.height - existing.y) <= step
        )

        if (isAdjacent) {
          priority += 12
          hasAdjacentBlock = true
          break
        }
      }

      // Boost positions that would create compact layouts
      if (hasAdjacentBlock) {
        priority += 5
      }

      positions.push({ x, y, priority })
    }
  }

  // Sort by priority and limit search
  positions.sort((a, b) => b.priority - a.priority)
  const positionsToTest = positions.slice(0, maxPositionsToTest)

  for (const pos of positionsToTest) {
    const testBlock = { x: pos.x, y: pos.y, width: blockSize.width, height: blockSize.height }

    if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId)) {
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

export const generateOptimizedLayout = (
  wall: { width: number, height: number },
  blockSizes: { width: number, height: number }[],
  maxBlocks: number = 100
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

export const findNearbyPosition = (
  blockSize: { width: number, height: number },
  targetPosition: { x: number, y: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): { x: number, y: number } | null => {
  const searchRadius = 20 // Search within 20px radius of target position
  const step = 2 // Fine-grained search step

  const candidatePositions: { x: number, y: number, distance: number }[] = []

  // Generate positions within search radius
  for (let y = targetPosition.y - searchRadius; y <= targetPosition.y + searchRadius; y += step) {
    for (let x = targetPosition.x - searchRadius; x <= targetPosition.x + searchRadius; x += step) {
      const distance = Math.sqrt(Math.pow(x - targetPosition.x, 2) + Math.pow(y - targetPosition.y, 2))

      // Only consider positions within the search radius
      if (distance <= searchRadius) {
        candidatePositions.push({ x, y, distance })
      }
    }
  }

  // Sort by distance from target position (closest first)
  candidatePositions.sort((a, b) => a.distance - b.distance)

  // Test positions starting with the closest
  for (const pos of candidatePositions) {
    const testBlock = { x: pos.x, y: pos.y, width: blockSize.width, height: blockSize.height }

    if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId) &&
        isValidHorizontalPosition(testBlock, wall) &&
        isValidVerticalPosition(testBlock, wall)) {
      return { x: pos.x, y: pos.y }
    }
  }

  return null
}

export const hasSignificantOverlap = (
  block1: { x: number, y: number, width: number, height: number },
  block2: { x: number, y: number, width: number, height: number }
): boolean => {
  if (!checkCollision(block1, block2)) {
    return false
  }

  // Calculate overlap area
  const overlapLeft = Math.max(block1.x, block2.x)
  const overlapRight = Math.min(block1.x + block1.width, block2.x + block2.width)
  const overlapTop = Math.max(block1.y, block2.y)
  const overlapBottom = Math.min(block1.y + block1.height, block2.y + block2.height)

  const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop)
  const block1Area = block1.width * block1.height

  // Consider significant if overlap is more than 25% of the dragged block's area
  const overlapPercentage = overlapArea / block1Area
  return overlapPercentage > 0.25
}

export const snapToGrid = (
  position: { x: number, y: number },
  gridSize: number = 15
): { x: number, y: number } => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  }
}

export const snapToAdjacentBlocks = (
  targetPosition: { x: number, y: number },
  blockSize: { width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  snapDistance: number = 10,
  excludeBlockId?: string,
  wall?: { width: number, height: number }
): { x: number, y: number } => {
  let bestX = targetPosition.x
  let bestY = targetPosition.y
  let bestScore = Infinity
  let bestWithinBounds = false

  // Try snapping to edges of existing blocks
  for (const block of existingBlocks) {
    if (excludeBlockId && block.id === excludeBlockId) continue

    // Potential snap positions around this block
    const snapPositions = [
      // Align to left edge of existing block
      { x: block.x, y: targetPosition.y },
      // Align to right edge of existing block
      { x: block.x + block.width - blockSize.width, y: targetPosition.y },
      // Place to the right of existing block
      { x: block.x + block.width, y: targetPosition.y },
      // Place to the left of existing block
      { x: block.x - blockSize.width, y: targetPosition.y },

      // Align to top edge of existing block
      { x: targetPosition.x, y: block.y },
      // Align to bottom edge of existing block
      { x: targetPosition.x, y: block.y + block.height - blockSize.height },
      // Place below existing block
      { x: targetPosition.x, y: block.y + block.height },
      // Place above existing block
      { x: targetPosition.x, y: block.y - blockSize.height },

      // Corner alignments
      { x: block.x, y: block.y },
      { x: block.x + block.width - blockSize.width, y: block.y },
      { x: block.x, y: block.y + block.height - blockSize.height },
      { x: block.x + block.width - blockSize.width, y: block.y + block.height - blockSize.height }
    ]

    for (const pos of snapPositions) {
      const distance = Math.sqrt(
        Math.pow(pos.x - targetPosition.x, 2) +
        Math.pow(pos.y - targetPosition.y, 2)
      )

      if (distance <= snapDistance) {
        const withinBounds = wall ? isWithinWallBounds({
          x: pos.x,
          y: pos.y,
          width: blockSize.width,
          height: blockSize.height
        }, wall) : true

        // Prioritize positions within bounds, then by distance
        const shouldUpdate = !bestWithinBounds && withinBounds ||
                            (bestWithinBounds === withinBounds && distance < bestScore)

        if (shouldUpdate) {
          bestX = pos.x
          bestY = pos.y
          bestScore = distance
          bestWithinBounds = withinBounds
        }
      }
    }
  }

  return { x: bestX, y: bestY }
}

export const isWithinWallBounds = (
  block: { x: number, y: number, width: number, height: number },
  wall: { width: number, height: number }
): boolean => {
  return block.x >= 0 &&
         block.y >= 0 &&
         block.x + block.width <= wall.width &&
         block.y + block.height <= wall.height
}

export const findBestDropPosition = (
  targetPosition: { x: number, y: number },
  blockSize: { width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): { x: number, y: number } => {
  // First try grid snapping at the target position (prioritize staying close to drop location)
  const gridSnap = snapToGrid(targetPosition, 15)
  const gridTestBlock = {
    x: gridSnap.x,
    y: gridSnap.y,
    width: blockSize.width,
    height: blockSize.height
  }

  if (canPlaceBlock(gridTestBlock, existingBlocks, wall, excludeBlockId) &&
      isValidHorizontalPosition(gridTestBlock, wall) &&
      isValidVerticalPosition(gridTestBlock, wall)) {
    return gridSnap
  }

  // Try snapping to adjacent blocks, but prioritize positions within wall bounds
  const adjacentSnap = snapToAdjacentBlocks(
    targetPosition,
    blockSize,
    existingBlocks,
    15, // snap distance
    excludeBlockId,
    wall
  )

  const adjacentTestBlock = {
    x: adjacentSnap.x,
    y: adjacentSnap.y,
    width: blockSize.width,
    height: blockSize.height
  }

  // Check if adjacent position is valid and prefer it if it stays within wall bounds
  const adjacentWithinBounds = isWithinWallBounds(adjacentTestBlock, wall)
  const adjacentIsValid = canPlaceBlock(adjacentTestBlock, existingBlocks, wall, excludeBlockId) &&
                          isValidHorizontalPosition(adjacentTestBlock, wall) &&
                          isValidVerticalPosition(adjacentTestBlock, wall)

  if (adjacentIsValid && adjacentWithinBounds) {
    return adjacentSnap
  }

  // Try to find a position within wall bounds before allowing overflow
  const inBoundsPosition = findValidPositionWithinWall(
    blockSize,
    existingBlocks,
    wall,
    excludeBlockId
  )

  if (inBoundsPosition) {
    return inBoundsPosition
  }

  // If we have a valid adjacent position (even with overflow), use it as backup
  if (adjacentIsValid) {
    return adjacentSnap
  }

  // Try nearby position search
  const nearbyPosition = findNearbyPosition(
    blockSize,
    targetPosition,
    existingBlocks,
    wall,
    excludeBlockId
  )

  if (nearbyPosition) {
    return nearbyPosition
  }

  // Last resort: use existing logic
  return findValidPosition(blockSize, existingBlocks, wall, excludeBlockId) || targetPosition
}


export const findRandomPositionInWall = (
  blockSize: { width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): { x: number, y: number } | null => {
  // Early exit if block is too large for wall
  if (blockSize.width > wall.width || blockSize.height > wall.height) {
    return null
  }

  // Pre-calculate valid ranges
  const maxX = wall.width - blockSize.width
  const maxY = wall.height - blockSize.height

  // For dense layouts, use grid-based approach to reduce collision checks
  if (existingBlocks.length > 50) {
    const step = Math.min(blockSize.width, blockSize.height) / 2
    const gridPositions: { x: number, y: number }[] = []

    // Generate grid positions
    for (let y = 0; y <= maxY; y += step) {
      for (let x = 0; x <= maxX; x += step) {
        gridPositions.push({ x: Math.floor(x), y: Math.floor(y) })
      }
    }

    // Shuffle and test grid positions
    for (let i = gridPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]]
    }

    for (const pos of gridPositions.slice(0, 100)) { // Test up to 100 positions
      const testBlock = { x: pos.x, y: pos.y, width: blockSize.width, height: blockSize.height }
      if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId)) {
        return pos
      }
    }
  } else {
    // For sparse layouts, use pure random sampling
    const maxAttempts = Math.min(150, (maxX + 1) * (maxY + 1))

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * (maxX + 1))
      const y = Math.floor(Math.random() * (maxY + 1))

      const testBlock = { x, y, width: blockSize.width, height: blockSize.height }

      if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId)) {
        return { x, y }
      }
    }
  }

  return null
}
