import { Group, Vector3 } from 'three'
import { SHELF_FOCUS_Z, SHELF_HALF } from '../data/layout'
import { naira } from '../data/money'
import { PRODUCTS } from '../data/products'
import { Badge } from '../game/badge'
import { box, shadow } from '../game/materials'
import { makeProduct } from '../game/productMesh'
import { findShelf, tryStock } from '../systems/ShopSystem'
import { state } from '../state/store'
import type { ActionResult, ProductId, Prompt } from '../types'

export class Shelf {
  readonly mesh = new Group()
  readonly focus = new Vector3()
  private readonly items: Group[] = []
  private readonly badge = new Badge()
  private shown = -1

  constructor(
    readonly id: string,
    readonly product: ProductId,
    x: number,
    z: number,
  ) {
    this.mesh.position.set(x, 0, z)
    this.focus.set(x, 0, z + SHELF_FOCUS_Z)
    const wood = '#c48a52'
    const deck = '#e7c08a'
    const trim = '#8d5a32'
    const color = PRODUCTS[product].color
    const width = SHELF_HALF.x * 2
    shadow(this.mesh, 1.15, 0.02)
    box(this.mesh, width, 0.1, 0.9, trim, 0, 0.05, 0)
    for (const lx of [-0.92, 0.92]) {
      box(this.mesh, 0.1, 1.22, 0.1, trim, lx, 0.61, -0.28)
      box(this.mesh, 0.1, 0.5, 0.1, trim, lx, 0.25, 0.28)
    }
    box(this.mesh, width, 0.08, 0.86, deck, 0, 0.48, 0.04)
    box(this.mesh, width, 0.06, 0.08, color, 0, 0.52, 0.46)
    box(this.mesh, width - 0.12, 0.07, 0.58, deck, 0, 1.0, -0.12)
    box(this.mesh, width, 1.15, 0.08, wood, 0, 0.72, -0.4)
    box(this.mesh, width - 0.28, 0.18, 0.04, color, 0, 1.22, -0.34)

    const decks = [
      { y: 0.52, z: 0.16 },
      { y: 1.04, z: -0.08 },
    ]
    for (let i = 0; i < 8; i += 1) {
      const level = decks[i < 4 ? 0 : 1]
      const col = i % 4
      const item = makeProduct(this.mesh, product, 1.15)
      item.position.set(-0.78 + col * 0.52, level.y, level.z)
      item.visible = false
      this.items.push(item)
    }

    this.badge.sprite.position.set(0, 1.72, 0.05)
    this.badge.setText('0/8', PRODUCTS[product].color)
    this.mesh.add(this.badge.sprite)
  }

  sync(): void {
    const shelf = findShelf(this.id)
    if (!shelf || shelf.stock === this.shown) return
    this.shown = shelf.stock
    for (let i = 0; i < this.items.length; i += 1) this.items[i].visible = i < shelf.stock
    this.badge.setText(`${shelf.stock}/${shelf.capacity}`, PRODUCTS[this.product].color)
  }

  prompt(): Prompt {
    const shelf = findShelf(this.id)
    const name = PRODUCTS[this.product].name
    if (!shelf) return { button: 'LAY', hint: 'Shelf missing', enabled: false }
    const have = state().inventory[this.product]
    const space = shelf.capacity - shelf.stock
    if (have <= 0) return { button: 'LAY', hint: `Bring ${name.toLowerCase()} here, then lay it down`, enabled: false }
    if (space <= 0) return { button: 'FULL', hint: `${name} shelf is full`, enabled: false }
    const count = Math.min(have, space)
    return {
      button: 'LAY',
      hint: `Lay ${count} ${name.toLowerCase()} · ${naira(PRODUCTS[this.product].sell)} each`,
      enabled: true,
    }
  }

  act(): ActionResult {
    return tryStock(this.id)
  }
}
