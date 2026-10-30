import type { ProductId } from '../types'

export type ProductDef = {
  name: string
  sell: number
  color: string
  accent: string
  emoji: string
}

export const PRODUCTS: Record<ProductId, ProductDef> = {
  tomato: { name: 'Tomato', sell: 400, color: '#e23b32', accent: '#3d9a42', emoji: '🍅' },
  carrot: { name: 'Carrot', sell: 550, color: '#f08a24', accent: '#4c9e45', emoji: '🥕' },
  corn: { name: 'Corn', sell: 700, color: '#f2c63a', accent: '#5aaa3e', emoji: '🌽' },
  egg: { name: 'Egg', sell: 250, color: '#f3d48a', accent: '#fff6e4', emoji: '🥚' },
  milk: { name: 'Milk', sell: 600, color: '#8ec4ef', accent: '#f7fbff', emoji: '🥛' },
}

export const PRODUCT_IDS = Object.keys(PRODUCTS) as ProductId[]
