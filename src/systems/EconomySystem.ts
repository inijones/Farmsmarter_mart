import { state } from '../state/store'

export function addCoins(amount: number): void {
  state().coins += amount
}

export function trySpend(amount: number): boolean {
  const data = state()
  if (data.coins < amount) return false
  data.coins -= amount
  return true
}
