import { createStore } from 'zustand/vanilla'
import { loadState } from '../systems/SaveSystem'
import type { GameData } from '../types'

export const gameStore = createStore<GameData>(() => loadState())

export function state(): GameData {
  return gameStore.getState()
}
