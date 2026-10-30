import { CanvasTexture, Sprite, SpriteMaterial, SRGBColorSpace } from 'three'
import { inkFor } from '../data/money'

export class Badge {
  readonly sprite: Sprite
  private readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D
  private readonly texture: CanvasTexture
  private key = ''

  constructor() {
    this.canvas.width = 256
    this.canvas.height = 128
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas unavailable')
    this.ctx = ctx
    this.texture = new CanvasTexture(this.canvas)
    this.texture.colorSpace = SRGBColorSpace
    const material = new SpriteMaterial({ map: this.texture, transparent: true, depthWrite: false })
    this.sprite = new Sprite(material)
    this.sprite.scale.set(1.45, 0.72, 1)
    this.sprite.center.set(0.5, 0.5)
  }

  setText(text: string, background = '#fffdf8'): void {
    const key = `${text}|${background}`
    if (key === this.key) return
    this.key = key
    const ctx = this.ctx
    const ink = inkFor(background)
    ctx.clearRect(0, 0, 256, 128)
    roundRect(ctx, 8, 18, 240, 92, 40)
    ctx.fillStyle = background
    ctx.fill()
    ctx.lineWidth = 8
    ctx.strokeStyle = 'rgba(28, 32, 28, 0.28)'
    ctx.stroke()
    ctx.fillStyle = ink
    ctx.font = '800 58px Trebuchet MS, Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 66)
    this.texture.needsUpdate = true
  }

  setVisible(visible: boolean): void {
    this.sprite.visible = visible
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
