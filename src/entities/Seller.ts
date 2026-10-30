import { Group } from 'three'

export class Seller {
  readonly mesh = new Group()

  constructor() {
    this.mesh.visible = false
  }

  update(): void {
    this.mesh.visible = false
  }
}
