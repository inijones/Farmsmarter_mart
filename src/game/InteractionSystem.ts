import { CanvasTexture, Group, Mesh, MeshBasicMaterial, RingGeometry, Sprite, SpriteMaterial, SRGBColorSpace, Vector3 } from 'three'
import type { ActionResult, Prompt } from '../types'

export type Interactable = {
  radius: number
  focus: (out: Vector3) => Vector3
  marker?: (out: Vector3) => Vector3
  prompt: () => Prompt | null
  act: () => ActionResult
}

export class InteractionSystem {
  readonly items: Interactable[] = []
  readonly marker = new Group()
  current: { prompt: Prompt; item: Interactable } | null = null
  private readonly focus = new Vector3()
  private readonly best = new Vector3()
  private phase = 0

  constructor() {
    const ring = new Mesh(
      new RingGeometry(0.46, 0.62, 22),
      new MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.9, depthWrite: false }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.28
    const arrow = makeArrowSprite()
    arrow.position.y = 2.15
    this.marker.add(ring, arrow)
    this.marker.visible = false
  }

  update(dt: number, x: number, z: number): void {
    this.phase += dt
    let bestItem: Interactable | null = null
    let bestPrompt: Prompt | null = null
    let bestDist = Infinity
    for (const item of this.items) {
      item.focus(this.focus)
      const dist = Math.hypot(x - this.focus.x, z - this.focus.z)
      if (dist > item.radius || dist >= bestDist) continue
      const prompt = item.prompt()
      if (!prompt) continue
      bestDist = dist
      bestItem = item
      bestPrompt = prompt
      this.best.copy(this.focus)
      if (item.marker) item.marker(this.best)
    }
    this.current = bestItem && bestPrompt ? { item: bestItem, prompt: bestPrompt } : null
    this.marker.visible = this.current !== null
    if (this.current) {
      this.marker.position.set(this.best.x, 0, this.best.z)
      const arrow = this.marker.children[1]
      arrow.position.y = 2.05 + Math.sin(this.phase * 4) * 0.12
    }
  }

  activate(): ActionResult | null {
    if (!this.current) return null
    if (!this.current.prompt.enabled) {
      return { ok: false, message: this.current.prompt.hint, sound: 'no' }
    }
    return this.current.item.act()
  }
}

function makeArrowSprite(): Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.fillStyle = '#ffc42e'
  ctx.strokeStyle = '#fff8e6'
  ctx.lineWidth = 6
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(32, 88)
  ctx.lineTo(10, 46)
  ctx.lineTo(22, 46)
  ctx.lineTo(22, 10)
  ctx.lineTo(42, 10)
  ctx.lineTo(42, 46)
  ctx.lineTo(54, 46)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const sprite = new Sprite(new SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(0.72, 1.08, 1)
  return sprite
}
