import { PRODUCTS } from '../data/products'
import { state } from '../state/store'
import type { ActionResult, ShelfState } from '../types'

export function findShelf(id: string): ShelfState | undefined {
  return state().shelves.find((shelf) => shelf.id === id)
}

export function totalStock(): number {
  return state().shelves.reduce((sum, shelf) => sum + shelf.stock, 0)
}

export function tryStock(id: string, limit = Number.POSITIVE_INFINITY): ActionResult {
  const shelf = findShelf(id)
  if (!shelf) return { ok: false, message: 'No shelf here', sound: 'no' }
  const product = PRODUCTS[shelf.product]
  const have = state().inventory[shelf.product]
  const space = shelf.capacity - shelf.stock
  if (have <= 0) return { ok: false, message: `Pick up some ${product.name.toLowerCase()} first`, sound: 'no' }
  if (space <= 0) return { ok: false, message: `${product.name} shelf is full`, sound: 'no' }
  const moved = Math.min(have, space, limit)
  state().inventory[shelf.product] -= moved
  shelf.stock += moved
  state().stats.stocked += moved
  const label = moved === 1 ? product.name.toLowerCase() : `${moved} ${product.name.toLowerCase()}`
  return { ok: true, message: `${product.emoji} Laid ${label} on the shelf`, sound: 'stack' }
}

export function takeFromShelf(id: string): boolean {
  const shelf = findShelf(id)
  if (!shelf || shelf.stock <= 0) return false
  shelf.stock -= 1
  return true
}
