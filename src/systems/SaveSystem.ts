import { createDefaultState } from '../data/layout'
import { advanceLivestock, advancePlot } from './simulation'
import type { GameData, ProductId, Stage } from '../types'

const KEY = 'farm-mart-save-v1'
const OFFLINE_CAP = 60

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clampStage(value: unknown): Stage {
  const stage = num(value, 0)
  if (stage <= 0) return 0
  if (stage >= 3) return 3
  if (stage >= 2) return 2
  return 1
}

export function loadState(): GameData {
  const fresh = createDefaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh
    const saved = JSON.parse(raw) as Partial<Omit<GameData, 'v'>> & { v?: number }
    if (saved.v !== 1 && saved.v !== 2) return fresh
    const legacyPrices = saved.v === 1
    fresh.coins = Math.max(0, Math.floor(num(saved.coins, fresh.coins)))
    if (legacyPrices) fresh.coins *= 50
    fresh.sellerHired = saved.sellerHired === true
    fresh.eggsReady = Math.max(0, Math.min(8, Math.floor(num(saved.eggsReady, 0))))
    fresh.milkReady = Math.max(0, Math.min(8, Math.floor(num(saved.milkReady, 0))))
    fresh.eggTimer = Math.max(0, num(saved.eggTimer, 0))
    fresh.milkTimer = Math.max(0, num(saved.milkTimer, 0))
    fresh.stats.harvested = Math.max(0, Math.floor(num(saved.stats?.harvested, 0)))
    fresh.stats.stocked = Math.max(0, Math.floor(num(saved.stats?.stocked, 0)))
    fresh.stats.sold = Math.max(0, Math.floor(num(saved.stats?.sold, 0)))
    const inventory = saved.inventory
    if (inventory) {
      for (const id of Object.keys(fresh.inventory) as ProductId[]) {
        fresh.inventory[id] = Math.max(0, Math.min(8, Math.floor(num(inventory[id], 0))))
      }
    }
    if (Array.isArray(saved.plots)) {
      for (const plot of fresh.plots) {
        const match = saved.plots.find((item) => item.id === plot.id)
        if (!match) continue
        plot.stage = clampStage(match.stage)
        plot.growth = Math.max(0, num(match.growth, 0))
        plot.unlocked = match.unlocked === true
        if (!plot.unlocked) {
          plot.stage = 0
          plot.growth = 0
        }
      }
    }
    if (Array.isArray(saved.shelves)) {
      for (const shelf of fresh.shelves) {
        const match = saved.shelves.find((item) => item.id === shelf.id)
        if (!match) continue
        shelf.stock = Math.max(0, Math.min(shelf.capacity, Math.floor(num(match.stock, 0))))
      }
    }
    const savedAt = num(saved.savedAt, 0)
    if (savedAt > 0) {
      const offline = Math.min(OFFLINE_CAP, Math.max(0, (Date.now() - savedAt) / 1000))
      for (const plot of fresh.plots) advancePlot(plot, offline)
      advanceLivestock(fresh, offline)
    }
    return fresh
  } catch {
    return fresh
  }
}

export function writeState(data: GameData): void {
  try {
    data.savedAt = Date.now()
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // Private mode and full storage should not interrupt play.
  }
}
