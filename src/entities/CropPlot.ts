import { Group, Vector3 } from 'three'
import { CROPS } from '../data/crops'
import { secondsUntilReady } from '../data/layout'
import { naira } from '../data/money'
import { PRODUCTS } from '../data/products'
import { UNLOCK_COST } from '../data/upgrades'
import { Badge } from '../game/badge'
import { box, cone, cyl, sphere } from '../game/materials'
import { clearGroup } from '../game/productMesh'
import { findPlot, tryHarvest, tryPlant, tryUnlock } from '../systems/CropSystem'
import { state } from '../state/store'
import type { ActionResult, CropId, Prompt } from '../types'

export class CropPlot {
  readonly mesh = new Group()
  private readonly plants = new Group()
  private readonly lockBadge: Badge
  private shown = ''

  constructor(
    readonly id: string,
    private readonly crop: CropId,
    x: number,
    z: number,
  ) {
    this.mesh.position.set(x, 0, z)
    const wood = '#b9844e'
    const soil = '#6a4630'
    box(this.mesh, 2.05, 0.22, 1.55, wood, 0, 0.12, 0)
    box(this.mesh, 1.82, 0.1, 1.32, soil, 0, 0.24, 0)
    for (const [cx, cz] of [
      [-0.9, -0.65],
      [0.9, -0.65],
      [-0.9, 0.65],
      [0.9, 0.65],
    ] as const) {
      cyl(this.mesh, 0.045, 0.045, 0.28, '#8d5a32', cx, 0.16, cz, 5)
    }
    const accent = PRODUCTS[crop].color
    cyl(this.mesh, 0.03, 0.03, 0.46, wood, 0.86, 0.42, 0.62, 5)
    box(this.mesh, 0.26, 0.16, 0.03, accent, 1.0, 0.58, 0.62)
    this.mesh.add(this.plants)
    this.lockBadge = new Badge()
    this.lockBadge.sprite.position.set(0, 1.15, 0)
    this.lockBadge.setText(String(UNLOCK_COST), '#d0892d')
    this.mesh.add(this.lockBadge.sprite)
  }

  sync(): void {
    const plot = findPlot(this.id)
    if (!plot) return
    const key = `${plot.unlocked}:${plot.stage}`
    if (key === this.shown) return
    this.shown = key
    clearGroup(this.plants)
    this.lockBadge.setVisible(!plot.unlocked)
    if (!plot.unlocked) {
      box(this.plants, 0.7, 0.5, 0.08, '#d7b07a', 0, 0.7, 0)
      return
    }
    this.build(plot.stage)
  }

  focus(out: Vector3): Vector3 {
    return out.set(this.mesh.position.x, 0, this.mesh.position.z)
  }

  prompt(): Prompt | null {
    const plot = findPlot(this.id)
    if (!plot) return null
    const name = PRODUCTS[this.crop].name
    if (!plot.unlocked) {
      const coins = state().coins
      return {
        button: 'UNLOCK',
        hint: coins >= UNLOCK_COST ? `Open a ${name.toLowerCase()} bed for ${naira(UNLOCK_COST)}` : `Need ${naira(UNLOCK_COST)} for a new bed`,
        enabled: coins >= UNLOCK_COST,
      }
    }
    if (plot.stage === 0) {
      const cost = CROPS[this.crop].seedCost
      return {
        button: 'PLANT',
        hint: state().coins >= cost ? `Plant ${name.toLowerCase()} · ${naira(cost)}` : `${name} seeds cost ${naira(cost)}`,
        enabled: state().coins >= cost,
      }
    }
    if (plot.stage === 3) {
      return { button: 'PICK', hint: `Step close to stack the ${name.toLowerCase()}`, enabled: true }
    }
    const seconds = Math.ceil(secondsUntilReady(plot))
    return { button: 'WAIT', hint: `${name} · ${seconds}s`, enabled: false }
  }

  act(): ActionResult {
    const plot = findPlot(this.id)
    if (!plot) return { ok: false, message: 'Missing bed', sound: 'no' }
    if (!plot.unlocked) return tryUnlock(this.id)
    if (plot.stage === 0) return tryPlant(this.id)
    if (plot.stage === 3) return tryHarvest(this.id)
    return { ok: false, message: this.prompt()?.hint ?? 'Still growing', sound: 'no' }
  }

  private build(stage: number): void {
    if (stage <= 0) return
    if (this.crop === 'tomato') this.tomato(stage)
    else if (this.crop === 'carrot') this.carrot(stage)
    else this.corn(stage)
  }

  private tomato(stage: number): void {
    const spots = [
      [-0.45, 0.15],
      [0, -0.1],
      [0.48, 0.18],
    ]
    for (const [x, z] of spots) {
      const h = stage === 1 ? 0.28 : stage === 2 ? 0.48 : 0.58
      cyl(this.plants, 0.04, 0.05, h, '#3f8d3c', x, 0.28 + h / 2, z, 5)
      sphere(this.plants, stage === 1 ? 0.1 : 0.16, '#3f9a40', x, 0.3 + h, z, 7)
      if (stage === 3) {
        sphere(this.plants, 0.11, '#e23b32', x + 0.08, 0.34 + h, z + 0.06, 7)
        sphere(this.plants, 0.09, '#c9322c', x - 0.08, 0.28 + h, z - 0.02, 7)
      }
    }
  }

  private carrot(stage: number): void {
    const spots = [-0.4, 0, 0.4]
    for (const x of spots) {
      sphere(this.plants, stage === 1 ? 0.1 : 0.16, '#4c9e45', x, stage === 1 ? 0.36 : 0.48, 0, 6)
      if (stage === 3) {
        const root = cone(this.plants, 0.08, 0.24, '#f08a24', x, 0.32, 0.08)
        root.rotation.x = Math.PI
      }
    }
  }

  private corn(stage: number): void {
    const spots = [-0.42, 0, 0.42]
    for (const x of spots) {
      const h = stage === 1 ? 0.35 : stage === 2 ? 0.7 : 0.95
      cyl(this.plants, 0.05, 0.07, h, '#67a83d', x, 0.28 + h / 2, 0, 5)
      sphere(this.plants, 0.12, '#7cbc45', x, 0.3 + h, 0, 6)
      if (stage === 3) {
        const cob = sphere(this.plants, 0.1, '#f2c63a', x + 0.08, 0.55, 0.06, 7)
        cob.scale.set(0.7, 1.2, 0.7)
      }
    }
  }
}
