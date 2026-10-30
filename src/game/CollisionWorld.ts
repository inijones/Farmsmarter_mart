import { BOUNDS } from '../data/layout'

type Box = { minX: number; maxX: number; minZ: number; maxZ: number }

export class CollisionWorld {
  private readonly boxes: Box[] = []

  add(x: number, z: number, halfX: number, halfZ: number): void {
    this.boxes.push({ minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ })
  }

  addAABB(minX: number, maxX: number, minZ: number, maxZ: number): void {
    this.boxes.push({ minX, maxX, minZ, maxZ })
  }

  blocked(x: number, z: number, radius: number): boolean {
    if (x < BOUNDS.minX + radius || x > BOUNDS.maxX - radius || z < BOUNDS.minZ + radius || z > BOUNDS.maxZ - radius) {
      return true
    }
    for (let i = 0; i < this.boxes.length; i += 1) {
      const box = this.boxes[i]
      if (x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius) return true
    }
    return false
  }
}
