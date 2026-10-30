import { CROPS } from '../data/crops'
import { EGG_INTERVAL, LIVESTOCK_CAP, MILK_INTERVAL } from '../data/upgrades'
import type { GameData, PlotState } from '../types'

export function advancePlot(plot: PlotState, seconds: number): void {
  if (!plot.unlocked || plot.stage === 0 || plot.stage === 3) return
  let left = seconds
  while (left > 0 && (plot.stage === 1 || plot.stage === 2)) {
    const duration = CROPS[plot.crop].stageSeconds[plot.stage]
    const need = duration - plot.growth
    if (left < need) {
      plot.growth += left
      return
    }
    left -= need
    plot.growth = 0
    plot.stage = (plot.stage + 1) as PlotState['stage']
  }
}

function fillTimer(timer: number, ready: number, every: number, seconds: number): { timer: number; ready: number } {
  let t = timer + seconds
  let count = ready
  while (t >= every && count < LIVESTOCK_CAP) {
    t -= every
    count += 1
  }
  if (count >= LIVESTOCK_CAP) t = 0
  return { timer: t, ready: count }
}

export function advanceLivestock(data: Pick<GameData, 'eggsReady' | 'milkReady' | 'eggTimer' | 'milkTimer'>, seconds: number): void {
  const eggs = fillTimer(data.eggTimer, data.eggsReady, EGG_INTERVAL, seconds)
  data.eggTimer = eggs.timer
  data.eggsReady = eggs.ready
  const milk = fillTimer(data.milkTimer, data.milkReady, MILK_INTERVAL, seconds)
  data.milkTimer = milk.timer
  data.milkReady = milk.ready
}
