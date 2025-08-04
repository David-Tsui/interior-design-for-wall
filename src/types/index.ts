export interface Block {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  textureImage?: string // Base64 data URL of user-uploaded texture
  isOverflow?: boolean
}

export interface Wall {
  width: number
  height: number
  backgroundColor: string
}

export interface Design {
  id: string
  name: string
  wall: Wall
  blocks: Block[]
  blockTemplates: Block[]
  createdAt: Date
  preview?: {
    blockCount: number
    wallDimensions: string
    templateCount: number
  }
}

export interface DragData {
  type: 'template' | 'existing'
  block: Block
}
