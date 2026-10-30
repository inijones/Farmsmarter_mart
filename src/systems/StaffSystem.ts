import { naira } from '../data/money'
import { SELLER_COST } from '../data/upgrades'
import { trySpend } from './EconomySystem'
import { state } from '../state/store'
import type { ActionResult } from '../types'

export function tryHireSeller(): ActionResult {
  if (state().sellerHired) return { ok: false, message: 'A seller is already at the counter', sound: 'no' }
  if (!trySpend(SELLER_COST)) return { ok: false, message: `Hiring costs ${naira(SELLER_COST)}`, sound: 'no' }
  state().sellerHired = true
  return { ok: true, message: 'Seller hired. Checkout runs on its own now.', sound: 'coin' }
}
