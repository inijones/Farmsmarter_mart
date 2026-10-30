import { CROPS } from '../data/crops'
import { naira } from '../data/money'
import { PRODUCTS } from '../data/products'
import { UNLOCK_COST } from '../data/upgrades'
import { trySpend } from './EconomySystem'
import { addProduct } from './InventorySystem'
import { state } from '../state/store'
import type { ActionResult, PlotState } from '../types'

function result(ok: boolean, message: string, sound: ActionResult['sound']): ActionResult {
  return { ok, message, sound }
}

export function findPlot(id: string): PlotState | undefined {
  return state().plots.find((plot) => plot.id === id)
}

export function tryUnlock(id: string): ActionResult {
  const plot = findPlot(id)
  if (!plot || plot.unlocked) return result(false, 'This bed is already yours', 'no')
  if (!trySpend(UNLOCK_COST)) return result(false, `You need ${naira(UNLOCK_COST)} to open this bed`, 'no')
  plot.unlocked = true
  return result(true, 'New bed unlocked', 'coin')
}

export function tryPlant(id: string): ActionResult {
  const plot = findPlot(id)
  if (!plot || !plot.unlocked) return result(false, 'Unlock this bed first', 'no')
  if (plot.stage !== 0) return result(false, 'Something is already growing here', 'no')
  const crop = CROPS[plot.crop]
  const name = PRODUCTS[plot.crop].name
  if (!trySpend(crop.seedCost)) return result(false, `${name} seeds cost ${naira(crop.seedCost)}`, 'no')
  plot.stage = 1
  plot.growth = 0
  return result(true, `${name} planted`, 'ok')
}

export function tryHarvest(id: string): ActionResult {
  const plot = findPlot(id)
  if (!plot || plot.stage !== 3) return result(false, 'Not ready yet', 'no')
  const added = addProduct(plot.crop, CROPS[plot.crop].yield)
  if (added <= 0) return result(false, 'Your hands are full. Stock the shop.', 'no')
  plot.stage = 0
  plot.growth = 0
  state().stats.harvested += 1
  const name = PRODUCTS[plot.crop].name
  const extra = added > 1 ? ` ×${added}` : ''
  return result(true, `${PRODUCTS[plot.crop].emoji} ${name} picked${extra}`, 'stack')
}
