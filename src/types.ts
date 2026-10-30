export type CropId = 'tomato' | 'carrot' | 'corn'
export type ProductId = CropId | 'egg' | 'milk'
export type Stage = 0 | 1 | 2 | 3

export type PlotState = {
  id: string
  crop: CropId
  stage: Stage
  growth: number
  unlocked: boolean
}

export type ShelfState = {
  id: string
  product: ProductId
  stock: number
  capacity: number
}

export type GameData = {
  v: 2
  coins: number
  inventory: Record<ProductId, number>
  plots: PlotState[]
  shelves: ShelfState[]
  sellerHired: boolean
  eggsReady: number
  milkReady: number
  eggTimer: number
  milkTimer: number
  stats: { harvested: number; stocked: number; sold: number }
  savedAt: number
}

export type Prompt = {
  button: string
  hint: string
  enabled: boolean
}

export type ActionResult = {
  ok: boolean
  message: string
  sound: 'ok' | 'coin' | 'no' | 'stack'
}
