import type { GameData } from '../types'

export function objective(data: GameData): string {
  if (data.stats.harvested < 1) return 'Step close to a ripe crop and it stacks in your hands'
  if (data.stats.stocked < 1) return 'Carry it to a shelf and lay it down'
  if (data.stats.sold < 1) return 'Stand at the counter and serve the shopper'
  if (data.stats.sold < 4) return 'Stay at the counter until each shopper is served'
  if (data.plots.some((plot) => !plot.unlocked)) return 'Open another bed with your naira'
  return 'Farmsmarter Mart is running. Keep the shelves full.'
}
