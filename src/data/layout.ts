import { CROPS } from './crops'
import type { CropId, GameData, ProductId, Stage } from '../types'

export const BOUNDS = { minX: -13.6, maxX: 13.6, minZ: -16.1, maxZ: 16.3 }

export const COUNTER = { x: 0, z: -3.15, hw: 1.85, hd: 0.6 }
export const SELLER_POS = { x: 0.72, z: -4.28 }
export const HIRE_FOCUS = { x: 0, z: -1.9 }
export const DOOR = { x: -5.6, z: -14.25 }
export const DOOR_OUT = { x: -5.6, z: -15.2 }
export const DOOR_IN = { x: -5.6, z: -12.35 }
export const REAR_AISLE_Z = -10.15
export const DOOR_LANE = { minX: -6.7, maxX: -4.5, minZ: -15.65, innerZ: -11.45 }
export const CHECKOUT = { x: 0, z: -1.92 }
export const CUSTOMER_TILL = { x: 0, z: -4.45 }
export const CUSTOMER_LIMIT_Z = -0.12
export const SIDE_LANE = 6.15
export const STAFF_ZONE = { minX: -4.6, maxX: 4.6, minZ: -3.55, maxZ: 0.05 }
export const PLAYER_SPAWN = { x: -8.2, z: 6.9 }

export const WAIT_SPOTS = [
  { x: -1.55, z: -5.55 },
  { x: 1.55, z: -5.55 },
  { x: -1.55, z: -6.7 },
  { x: 1.55, z: -6.7 },
]

export type ShelfLayout = {
  id: string
  product: ProductId
  x: number
  z: number
}

export const SHELVES: ShelfLayout[] = [
  { id: 'shelf-tomato', product: 'tomato', x: -8, z: -11.15 },
  { id: 'shelf-carrot', product: 'carrot', x: 0, z: -11.15 },
  { id: 'shelf-corn', product: 'corn', x: 8, z: -11.15 },
  { id: 'shelf-egg', product: 'egg', x: -4.6, z: -7.25 },
  { id: 'shelf-milk', product: 'milk', x: 4.6, z: -7.25 },
]

export const SHELF_HALF = { x: 1.08, z: 0.48 }
export const SHELF_FOCUS_Z = 1.32

export type PlotLayout = {
  id: string
  crop: CropId
  x: number
  z: number
  stage: Stage
  growth: number
  unlocked: boolean
}

export const PLOTS: PlotLayout[] = [
  { id: 'tomato-1', crop: 'tomato', x: -8.2, z: 5.6, stage: 3, growth: 0, unlocked: true },
  { id: 'tomato-2', crop: 'tomato', x: -5.55, z: 5.6, stage: 2, growth: 4, unlocked: true },
  { id: 'tomato-3', crop: 'tomato', x: -2.9, z: 5.6, stage: 0, growth: 0, unlocked: true },
  { id: 'carrot-1', crop: 'carrot', x: -8.2, z: 8.85, stage: 1, growth: 2, unlocked: true },
  { id: 'carrot-2', crop: 'carrot', x: -5.55, z: 8.85, stage: 0, growth: 0, unlocked: true },
  { id: 'carrot-3', crop: 'carrot', x: -2.9, z: 8.85, stage: 0, growth: 0, unlocked: false },
  { id: 'corn-1', crop: 'corn', x: -8.2, z: 12.15, stage: 3, growth: 0, unlocked: true },
  { id: 'corn-2', crop: 'corn', x: -5.55, z: 12.15, stage: 0, growth: 0, unlocked: true },
  { id: 'corn-3', crop: 'corn', x: -2.9, z: 12.15, stage: 0, growth: 0, unlocked: false },
]

export const CHICKEN = { x: -11.7, z: 6.3, focusX: -10.35, focusZ: 6.3 }
export const COW = { x: 9.4, z: 10.6, focusX: 7.7, focusZ: 10.6 }

export function createDefaultState(): GameData {
  return {
    v: 2,
    coins: 2000,
    inventory: { tomato: 0, carrot: 0, corn: 0, egg: 0, milk: 0 },
    plots: PLOTS.map((plot) => ({
      id: plot.id,
      crop: plot.crop,
      stage: plot.stage,
      growth: plot.growth,
      unlocked: plot.unlocked,
    })),
    shelves: SHELVES.map((shelf) => ({
      id: shelf.id,
      product: shelf.product,
      stock: 0,
      capacity: 8,
    })),
    sellerHired: false,
    eggsReady: 1,
    milkReady: 0,
    eggTimer: 0,
    milkTimer: 0,
    stats: { harvested: 0, stocked: 0, sold: 0 },
    savedAt: 0,
  }
}

export function secondsUntilReady(plot: { crop: CropId; stage: Stage; growth: number }): number {
  if (plot.stage === 1 || plot.stage === 2) {
    let total = CROPS[plot.crop].stageSeconds[plot.stage] - plot.growth
    if (plot.stage === 1) total += CROPS[plot.crop].stageSeconds[2]
    return Math.max(0, total)
  }
  return 0
}
