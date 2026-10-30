import { Group, Vector3 } from 'three'
import { CHICKEN, COW } from '../data/layout'
import { LIVESTOCK_CAP } from '../data/upgrades'
import { box, cyl, shadow, sphere } from '../game/materials'
import { tryCollectEggs, tryCollectMilk } from '../systems/LivestockSystem'
import { state } from '../state/store'
import type { ActionResult, Prompt } from '../types'

export class Livestock {
  readonly chickens = new Group()
  readonly cow = new Group()
  readonly eggFocus = new Vector3(CHICKEN.focusX, 0, CHICKEN.focusZ)
  readonly milkFocus = new Vector3(COW.focusX, 0, COW.focusZ)
  private readonly eggs: Group[] = []
  private readonly bottles: Group[] = []
  private eggShown = -1
  private milkShown = -1

  constructor() {
    this.buildChickens()
    this.buildCow()
  }

  sync(): void {
    const data = state()
    if (data.eggsReady !== this.eggShown) {
      this.eggShown = data.eggsReady
      for (let i = 0; i < this.eggs.length; i += 1) this.eggs[i].visible = i < data.eggsReady
    }
    if (data.milkReady !== this.milkShown) {
      this.milkShown = data.milkReady
      for (let i = 0; i < this.bottles.length; i += 1) this.bottles[i].visible = i < data.milkReady
    }
  }

  eggPrompt(): Prompt {
    const ready = state().eggsReady
    if (ready <= 0) return { button: 'COLLECT', hint: 'Step close when the hens have laid', enabled: false }
    return { button: 'PICK', hint: `Step close to stack ${ready} egg${ready > 1 ? 's' : ''}`, enabled: true }
  }

  milkPrompt(): Prompt {
    const ready = state().milkReady
    if (ready <= 0) return { button: 'COLLECT', hint: 'Step close when there is milk', enabled: false }
    return { button: 'PICK', hint: `Step close to stack ${ready} milk`, enabled: true }
  }

  collectEggs(): ActionResult {
    return tryCollectEggs()
  }

  collectMilk(): ActionResult {
    return tryCollectMilk()
  }

  private buildChickens(): void {
    const nest = this.chickens
    nest.position.set(CHICKEN.x, 0, CHICKEN.z)
    shadow(nest, 0.7)
    sphere(nest, 0.55, '#f0c14d', 0, 0.18, 0, 10).scale.set(1.15, 0.28, 0.9)
    sphere(nest, 0.48, '#e2a83a', 0, 0.2, 0, 10).scale.set(0.85, 0.22, 0.62)
    this.addHen(-0.18, 0.34)
    this.addHen(0.28, 0.3)
    for (let i = 0; i < LIVESTOCK_CAP; i += 1) {
      const egg = new Group()
      const mesh = sphere(egg, 0.11, '#fff6e4', 0, 0, 0, 7)
      mesh.scale.set(0.82, 1.05, 0.82)
      egg.position.set(0.48, 0.16 + i * 0.2, 0.02)
      egg.rotation.y = i * 0.4
      egg.visible = false
      nest.add(egg)
      this.eggs.push(egg)
    }
  }

  private addHen(x: number, z: number): void {
    sphere(this.chickens, 0.2, '#fffaf2', x, 0.42, z, 8)
    sphere(this.chickens, 0.12, '#fffaf2', x + 0.12, 0.58, z, 7)
    sphere(this.chickens, 0.05, '#ef7a32', x + 0.22, 0.56, z, 5)
    sphere(this.chickens, 0.045, '#e24b3a', x + 0.08, 0.72, z, 5)
  }

  private buildCow(): void {
    const cow = this.cow
    cow.position.set(COW.x, 0, COW.z)
    cow.rotation.y = -0.6
    shadow(cow, 0.62)
    sphere(cow, 0.42, '#f7f4ee', 0, 0.62, 0, 10).scale.set(1.25, 0.85, 0.78)
    sphere(cow, 0.22, '#2c2a28', -0.12, 0.72, 0.18, 7)
    sphere(cow, 0.16, '#2c2a28', 0.2, 0.55, -0.22, 7)
    sphere(cow, 0.24, '#f7f4ee', 0.42, 0.78, 0.05, 8)
    sphere(cow, 0.07, '#f2a3b5', 0.62, 0.74, 0.05, 6)
    sphere(cow, 0.04, '#222', 0.66, 0.82, 0.12, 5)
    sphere(cow, 0.04, '#222', 0.66, 0.82, -0.04, 5)
    for (const [lx, lz] of [
      [-0.28, -0.18],
      [0.22, -0.18],
      [-0.28, 0.18],
      [0.22, 0.18],
    ] as const) {
      cyl(cow, 0.06, 0.07, 0.36, '#f3eee6', lx, 0.2, lz, 5)
    }

    const crate = new Group()
    crate.position.set(-0.85, 0, 0.15)
    box(crate, 0.42, 0.1, 0.42, '#c4a574', 0, 0.08, 0)
    for (let i = 0; i < LIVESTOCK_CAP; i += 1) {
      const bottle = new Group()
      cyl(bottle, 0.07, 0.08, 0.24, '#f7fbff', 0, 0.16, 0, 6)
      cyl(bottle, 0.05, 0.05, 0.07, '#7eb6e8', 0, 0.3, 0, 6)
      bottle.position.set(0, 0.16 + i * 0.28, 0)
      bottle.visible = false
      crate.add(bottle)
      this.bottles.push(bottle)
    }
    cow.add(crate)
  }
}
