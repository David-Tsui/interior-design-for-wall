export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
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
  return block.x >= 0 &&
    block.y >= 0 &&
    block.x + block.width <= wall.width &&
    block.y + block.height <= wall.height
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

export const findValidPosition = (
  blockSize: { width: number, height: number },
  existingBlocks: { x: number, y: number, width: number, height: number, id: string }[],
  wall: { width: number, height: number },
  excludeBlockId?: string
): { x: number, y: number } | null => {
  const step = 5 // Grid step for placement attempts

  // Try to place starting from top-left, moving right then down
  for (let y = 0; y <= wall.height - blockSize.height; y += step) {
    for (let x = 0; x <= wall.width - blockSize.width; x += step) {
      const testBlock = { x, y, width: blockSize.width, height: blockSize.height }
      if (canPlaceBlock(testBlock, existingBlocks, wall, excludeBlockId)) {
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
