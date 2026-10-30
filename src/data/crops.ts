import type { CropId } from '../types'

export const CROPS: Record<
  CropId,
  { seedCost: number; yield: number; stageSeconds: { 1: number; 2: number } }
> = {
  tomato: { seedCost: 100, yield: 1, stageSeconds: { 1: 8, 2: 10 } },
  carrot: { seedCost: 150, yield: 1, stageSeconds: { 1: 10, 2: 12 } },
  corn: { seedCost: 200, yield: 2, stageSeconds: { 1: 12, 2: 14 } },
}
