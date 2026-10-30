import { STORAGE_CAP } from '../data/upgrades'
import { state } from '../state/store'
import type { ProductId } from '../types'

export function spaceFor(id: ProductId): number {
  return STORAGE_CAP - state().inventory[id]
}

export function addProduct(id: ProductId, amount: number): number {
  const added = Math.max(0, Math.min(spaceFor(id), amount))
  state().inventory[id] += added
  return added
}
