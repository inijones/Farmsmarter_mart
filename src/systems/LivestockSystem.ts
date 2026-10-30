import { PRODUCTS } from '../data/products'
import { addProduct } from './InventorySystem'
import { state } from '../state/store'
import type { ActionResult } from '../types'

export function tryCollectEggs(limit = 8): ActionResult {
  const data = state()
  if (data.eggsReady <= 0) return { ok: false, message: 'The hens are still laying', sound: 'no' }
  const added = addProduct('egg', Math.min(limit, data.eggsReady))
  if (added <= 0) return { ok: false, message: 'Your hands are full. Stock the shelf.', sound: 'no' }
  data.eggsReady -= added
  return { ok: true, message: `${PRODUCTS.egg.emoji} Collected ${added} egg${added > 1 ? 's' : ''}`, sound: 'stack' }
}

export function tryCollectMilk(limit = 8): ActionResult {
  const data = state()
  if (data.milkReady <= 0) return { ok: false, message: 'The cow has no milk yet', sound: 'no' }
  const added = addProduct('milk', Math.min(limit, data.milkReady))
  if (added <= 0) return { ok: false, message: 'Your hands are full. Stock the shelf.', sound: 'no' }
  data.milkReady -= added
  return { ok: true, message: `${PRODUCTS.milk.emoji} Collected ${added} milk`, sound: 'stack' }
}
