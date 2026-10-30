import { PRODUCT_IDS, PRODUCTS } from '../data/products'
import { objective } from './objectives'
import { unlockAudio } from '../game/audio'
import { input } from '../game/view'
import { state } from '../state/store'

const COIN = `<span class="naira">₦</span>`

export class HUD {
  onAction: () => void = () => {}
  private readonly root: HTMLElement
  private readonly objectiveEl: HTMLElement
  private readonly coinsEl: HTMLElement
  private readonly promptEl: HTMLElement
  private readonly button: HTMLButtonElement
  private readonly buttonLabel: HTMLElement
  private readonly toastEl: HTMLElement
  private readonly slots = new Map<string, HTMLElement>()
  private readonly stick: HTMLElement
  private toastTimer = 0
  private lastCoins = -1
  private lastObjective = ''
  private lastPrompt = ''
  private lastButton = ''
  private joyId: number | null = null

  constructor(host: HTMLElement) {
    this.root = document.createElement('div')
    this.root.className = 'hud'
    this.root.innerHTML = `
      <div class="top">
        <div class="objective"></div>
        <div class="coins">${COIN}<span class="amount">0</span></div>
      </div>
      <p class="keys">WASD move · Space act</p>
      <div class="prompt"></div>
      <div class="bag"></div>
      <div class="dock">
        <div class="joy" id="joy"><div class="stick"></div></div>
        <button class="act is-off" type="button"><b>WALK</b></button>
      </div>
      <div class="toast"></div>
    `
    host.appendChild(this.root)
    this.objectiveEl = this.root.querySelector('.objective') as HTMLElement
    this.coinsEl = this.root.querySelector('.amount') as HTMLElement
    this.promptEl = this.root.querySelector('.prompt') as HTMLElement
    this.button = this.root.querySelector('.act') as HTMLButtonElement
    this.buttonLabel = this.root.querySelector('.act b') as HTMLElement
    this.toastEl = this.root.querySelector('.toast') as HTMLElement
    this.stick = this.root.querySelector('.stick') as HTMLElement
    const bag = this.root.querySelector('.bag') as HTMLElement
    for (const id of PRODUCT_IDS) {
      const slot = document.createElement('div')
      slot.className = 'slot'
      slot.innerHTML = `<span>${PRODUCTS[id].emoji}</span><small>0</small>`
      bag.appendChild(slot)
      this.slots.set(id, slot.querySelector('small') as HTMLElement)
    }
    this.bindJoystick(this.root.querySelector('.joy') as HTMLElement)
    this.button.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      this.button.blur()
      unlockAudio()
      this.onAction()
    })
  }

  sync(): void {
    const data = state()
    if (data.coins !== this.lastCoins) {
      const gained = this.lastCoins >= 0 && data.coins > this.lastCoins
      this.lastCoins = data.coins
      this.coinsEl.textContent = data.coins.toLocaleString('en-NG')
      if (gained) {
        this.coinsEl.parentElement?.classList.remove('pop')
        void this.coinsEl.parentElement?.offsetWidth
        this.coinsEl.parentElement?.classList.add('pop')
      }
    }
    const goal = objective(data)
    if (goal !== this.lastObjective) {
      this.lastObjective = goal
      this.objectiveEl.textContent = goal
    }
    for (const id of PRODUCT_IDS) {
      const label = this.slots.get(id)
      if (!label) continue
      const count = data.inventory[id]
      if (label.textContent !== String(count)) label.textContent = String(count)
      label.parentElement?.classList.toggle('full', count >= 8)
    }
  }

  setPrompt(hint: string, button: string, enabled: boolean): void {
    if (hint !== this.lastPrompt) {
      this.lastPrompt = hint
      this.promptEl.textContent = hint
      this.promptEl.classList.toggle('show', hint.length > 0)
    }
    if (button !== this.lastButton || this.button.classList.contains('is-on') !== enabled) {
      this.lastButton = button
      this.buttonLabel.textContent = button
      this.button.classList.toggle('is-on', enabled)
      this.button.classList.toggle('is-off', !enabled)
    }
  }

  toast(message: string): void {
    this.toastEl.textContent = message
    this.toastEl.classList.add('show')
    window.clearTimeout(this.toastTimer)
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 1500)
  }

  private bindJoystick(joy: HTMLElement): void {
    const move = (event: PointerEvent) => {
      const rect = joy.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      let dx = event.clientX - cx
      let dy = event.clientY - cy
      const max = rect.width * 0.34
      const length = Math.hypot(dx, dy) || 1
      if (length > max) {
        dx = (dx / length) * max
        dy = (dy / length) * max
      }
      input.x = dx / max
      input.y = dy / max
      this.stick.style.transform = `translate(${dx}px, ${dy}px)`
    }
    const end = () => {
      this.joyId = null
      input.x = 0
      input.y = 0
      this.stick.style.transform = 'translate(0px, 0px)'
    }
    joy.addEventListener('pointerdown', (event) => {
      this.joyId = event.pointerId
      joy.setPointerCapture(event.pointerId)
      unlockAudio()
      move(event)
    })
    joy.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.joyId) move(event)
    })
    joy.addEventListener('pointerup', end)
    joy.addEventListener('pointercancel', end)
  }
}
