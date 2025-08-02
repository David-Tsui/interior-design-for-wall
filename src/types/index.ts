export interface Block {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
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
  createdAt: Date
}