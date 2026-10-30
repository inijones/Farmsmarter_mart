import { Group } from 'three'
import { PRODUCT_IDS } from '../data/products'
import { box, cyl, shadow, sphere } from '../game/materials'
import { clearGroup, makeProduct } from '../game/productMesh'
import { state } from '../state/store'
import type { ProductId } from '../types'

const CARRY_SCALE = 1.15
const STACK_STEP: Record<ProductId, number> = {
  tomato: 0.26,
  carrot: 0.32,
  corn: 0.28,
  egg: 0.2,
  milk: 0.3,
}

export class Farmer {
  readonly mesh = new Group()
  private readonly bob = new Group()
  private readonly leftLeg = new Group()
  private readonly rightLeg = new Group()
  private readonly leftArm = new Group()
  private readonly rightArm = new Group()
  private readonly carry = new Group()
  private readonly carryItems = new Group()
  private phase = 0
  private carryKey = ''
  private holding = false

  constructor() {
    this.mesh.add(shadow(this.mesh, 0.42))
    this.mesh.add(this.bob)

    const skin = '#8d5334'
    const shirt = '#f0b12e'
    const pants = '#3d6e4e'
    const boot = '#4e382b'
    const hat = '#e6bc4d'
    const band = '#8b5328'

    this.leftLeg.position.set(-0.13, 0.58, 0)
    this.rightLeg.position.set(0.13, 0.58, 0)
    this.bob.add(this.leftLeg, this.rightLeg)
    box(this.leftLeg, 0.16, 0.34, 0.18, pants, 0, -0.14, 0)
    box(this.rightLeg, 0.16, 0.34, 0.18, pants, 0, -0.14, 0)
    box(this.leftLeg, 0.18, 0.1, 0.26, boot, 0, -0.32, 0.04)
    box(this.rightLeg, 0.18, 0.1, 0.26, boot, 0, -0.32, 0.04)

    box(this.bob, 0.5, 0.16, 0.3, pants, 0, 0.66, 0)
    box(this.bob, 0.46, 0.4, 0.28, shirt, 0, 0.9, 0)
    box(this.bob, 0.12, 0.22, 0.08, pants, -0.1, 0.92, 0.14)
    box(this.bob, 0.12, 0.22, 0.08, pants, 0.1, 0.92, 0.14)

    this.leftArm.position.set(-0.32, 1.02, 0)
    this.rightArm.position.set(0.32, 1.02, 0)
    this.bob.add(this.leftArm, this.rightArm)
    box(this.leftArm, 0.12, 0.32, 0.12, skin, 0, -0.14, 0)
    box(this.rightArm, 0.12, 0.32, 0.12, skin, 0, -0.14, 0)

    sphere(this.bob, 0.27, skin, 0, 1.34, 0, 12)
    sphere(this.bob, 0.055, '#fff8ef', -0.09, 1.38, 0.23, 7)
    sphere(this.bob, 0.055, '#fff8ef', 0.09, 1.38, 0.23, 7)
    sphere(this.bob, 0.03, '#1b1b1b', -0.09, 1.38, 0.27, 6)
    sphere(this.bob, 0.03, '#1b1b1b', 0.09, 1.38, 0.27, 6)

    cyl(this.bob, 0.4, 0.4, 0.055, hat, 0, 1.52, -0.02, 14)
    cyl(this.bob, 0.22, 0.3, 0.22, hat, 0, 1.66, -0.04, 12)
    cyl(this.bob, 0.25, 0.25, 0.045, band, 0, 1.56, -0.03, 12)

    this.carry.position.set(-0.62, 0.52, 0.22)
    this.bob.add(this.carry)
    this.carry.add(this.carryItems)
  }

  animate(dt: number, moving: boolean, dx: number, dz: number): void {
    if (moving) {
      this.phase += dt * 11
      this.mesh.rotation.y = Math.atan2(dx, dz)
    }
    const swing = moving ? Math.sin(this.phase) * 0.55 : 0
    this.leftLeg.rotation.x = swing
    this.rightLeg.rotation.x = -swing
    const hold = this.holding ? -1.15 : 0
    this.leftArm.rotation.x = hold - swing * (this.holding ? 0.22 : 0.8)
    this.rightArm.rotation.x = hold + swing * (this.holding ? 0.22 : 0.8)
    this.leftArm.rotation.z = this.holding ? 0.42 : 0
    this.rightArm.rotation.z = this.holding ? -0.42 : 0
    this.bob.position.y = moving ? Math.abs(Math.sin(this.phase)) * 0.045 : 0
    const sway = moving && this.holding ? Math.sin(this.phase * 0.5) : 0
    this.carry.rotation.z = sway * 0.05
    this.carry.rotation.x = moving && this.holding ? Math.sin(this.phase) * 0.025 : 0
  }

  syncCarry(): void {
    const inventory = state().inventory
    const key = PRODUCT_IDS.map((id) => inventory[id]).join(',')
    if (key === this.carryKey) return
    this.carryKey = key
    clearGroup(this.carryItems)
    let y = 0
    let total = 0
    for (const id of PRODUCT_IDS) {
      const count = inventory[id]
      for (let i = 0; i < count; i += 1) {
        const item = makeProduct(this.carryItems, id, CARRY_SCALE)
        item.position.set((total % 2 === 0 ? -1 : 1) * 0.015, y, 0)
        item.rotation.y = ((total * 47) % 20) * 0.02 - 0.18
        y += STACK_STEP[id] * CARRY_SCALE
        total += 1
      }
    }
    this.holding = total > 0
  }
}
