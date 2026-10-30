import { CHECKOUT, PLAYER_SPAWN } from '../data/layout'
import { Farmer } from '../entities/Farmer'
import { Seller } from '../entities/Seller'
import { findPlot, tryHarvest } from '../systems/CropSystem'
import { tryCollectEggs, tryCollectMilk } from '../systems/LivestockSystem'
import { advanceLivestock, advancePlot } from '../systems/simulation'
import { tryStock } from '../systems/ShopSystem'
import { CustomerSystem } from '../systems/CustomerSystem'
import { writeState } from '../systems/SaveSystem'
import { state } from '../state/store'
import { HUD } from '../ui/hud'
import { buildWorld } from '../world/buildWorld'
import { chime, unlockAudio } from './audio'
import { CameraController } from './CameraController'
import { InteractionSystem } from './InteractionSystem'
import { PlayerController } from './PlayerController'
import { createRenderer, createScene, pixelRatio } from './SceneSetup'
import { input } from './view'
import type { ActionResult } from '../types'

export class Game {
  private readonly renderer
  private readonly scene
  private readonly cameraCtrl = new CameraController()
  private readonly hud: HUD
  private readonly seller = new Seller()
  private readonly world
  private readonly interaction = new InteractionSystem()
  private readonly player: Farmer
  private readonly playerCtrl: PlayerController
  private readonly customers: CustomerSystem
  private saveTimer = 0
  private handTimer = 0
  private handsLive = false
  private last = 0
  private running = false

  constructor(host: HTMLElement) {
    this.scene = createScene()
    this.renderer = createRenderer(host)
    this.world = buildWorld(this.scene)
    this.player = new Farmer()
    this.player.mesh.position.set(PLAYER_SPAWN.x, 0, PLAYER_SPAWN.z)
    this.player.mesh.rotation.y = Math.PI
    this.scene.add(this.player.mesh)
    this.playerCtrl = new PlayerController(this.player, this.world.collision)
    this.scene.add(this.seller.mesh)
    this.scene.add(this.interaction.marker)
    this.customers = new CustomerSystem(
      this.scene,
      this.world.collision,
      this.world.shelves,
      () => Math.hypot(this.player.mesh.position.x - CHECKOUT.x, this.player.mesh.position.z - CHECKOUT.z) < 2.15,
      (message) => {
        this.hud.toast(message)
        chime('coin')
      },
    )
    this.registerInteractions()
    this.hud = new HUD(host)
    this.hud.onAction = () => this.performAction()
    this.cameraCtrl.snap(PLAYER_SPAWN.x, 0, PLAYER_SPAWN.z)
    this.bindInput()
    this.interaction.update(0, PLAYER_SPAWN.x, PLAYER_SPAWN.z)
    this.syncViews()
    window.setTimeout(() => this.hud.toast('Step close to stack the ripe tomato'), 700)
    if (import.meta.env.DEV) {
      ;(window as unknown as { __farm: Game }).__farm = this
    }
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    requestAnimationFrame((now) => this.frame(now))
  }

  private registerInteractions(): void {
    for (const plot of this.world.plots) {
      this.interaction.items.push({
        radius: 1.9,
        focus: (out) => plot.focus(out),
        prompt: () => plot.prompt(),
        act: () => plot.act(),
      })
    }
    for (const shelf of this.world.shelves) {
      this.interaction.items.push({
        radius: 2.15,
        focus: (out) => out.copy(shelf.focus),
        marker: (out) => out.set(shelf.mesh.position.x, 0, shelf.mesh.position.z),
        prompt: () => shelf.prompt(),
        act: () => shelf.act(),
      })
    }
    const animals = this.world.livestock
    this.interaction.items.push(
      {
        radius: 2.15,
        focus: (out) => out.copy(animals.eggFocus),
        prompt: () => animals.eggPrompt(),
        act: () => animals.collectEggs(),
      },
      {
        radius: 2.2,
        focus: (out) => out.copy(animals.milkFocus),
        prompt: () => animals.milkPrompt(),
        act: () => animals.collectMilk(),
      },
    )
  }

  private bindInput(): void {
    addEventListener('keydown', (event) => {
      this.handsLive = true
      input.keys[event.key.toLowerCase()] = true
      if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault()
      if (event.repeat) return
      if (event.code === 'Space' || event.key.toLowerCase() === 'e') {
        unlockAudio()
        this.performAction()
      }
    })
    addEventListener('keyup', (event) => {
      input.keys[event.key.toLowerCase()] = false
    })
    addEventListener('resize', () => this.resize())
    addEventListener('contextmenu', (event) => event.preventDefault())
    addEventListener('pointerdown', () => {
      this.handsLive = true
      unlockAudio()
    })
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        writeState(state())
        this.running = false
        return
      }
      this.last = performance.now()
      this.start()
    })
    addEventListener('pagehide', () => writeState(state()))
  }

  private resize(): void {
    this.cameraCtrl.resize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(pixelRatio())
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private frame(now: number): void {
    if (!this.running || document.hidden) return
    requestAnimationFrame((time) => this.frame(time))
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0)
    this.last = now
    this.playerCtrl.update(dt)
    const data = state()
    for (const plot of data.plots) advancePlot(plot, dt)
    advanceLivestock(data, dt)
    this.customers.update(dt)
    this.seller.update()
    const pos = this.player.mesh.position
    this.handleHands(dt)
    this.interaction.update(dt, pos.x, pos.z)
    this.syncViews()
    this.cameraCtrl.update(dt, pos.x, pos.y, pos.z)
    this.renderer.render(this.scene, this.cameraCtrl.camera)
    this.saveTimer += dt
    if (this.saveTimer > 4) {
      this.saveTimer = 0
      writeState(data)
    }
  }

  private syncViews(): void {
    for (const plot of this.world.plots) plot.sync()
    for (const shelf of this.world.shelves) shelf.sync()
    this.world.livestock.sync()
    this.player.syncCarry()
    this.world.hireBadge.setVisible(false)
    this.hud.sync()
    const prompt = this.interaction.current?.prompt
    this.hud.setPrompt(prompt?.hint ?? '', prompt?.button ?? 'WALK', prompt?.enabled ?? false)
  }

  private performAction(): void {
    const pos = this.player.mesh.position
    this.interaction.update(0, pos.x, pos.z)
    const result = this.interaction.activate()
    this.syncViews()
    if (!result) {
      this.hud.toast('Walk up to a crop, animal, or shelf')
      chime('no')
      return
    }
    this.feedback(result)
  }

  private handleHands(dt: number): void {
    if (!this.handsLive) return
    this.handTimer -= dt
    if (this.handTimer > 0) return
    const pos = this.player.mesh.position
    const data = state()

    let shelfId = ''
    let shelfDistance = 1.2
    for (const shelf of this.world.shelves) {
      if (data.inventory[shelf.product] <= 0) continue
      const stocked = data.shelves.find((item) => item.id === shelf.id)
      if (!stocked || stocked.stock >= stocked.capacity) continue
      const distance = Math.hypot(pos.x - shelf.focus.x, pos.z - shelf.focus.z)
      if (distance < shelfDistance) {
        shelfDistance = distance
        shelfId = shelf.id
      }
    }
    if (shelfId) {
      const result = tryStock(shelfId, 1)
      if (result.ok) {
        this.handTimer = 0.32
        const left = state().inventory[this.world.shelves.find((shelf) => shelf.id === shelfId)?.product ?? 'tomato']
        chime('stack', 0.72 + left * 0.05)
        navigator.vibrate?.(10)
      }
      return
    }

    let plotId = ''
    let plotDistance = 1.45
    for (const plot of this.world.plots) {
      const saved = findPlot(plot.id)
      if (!saved || saved.stage !== 3) continue
      const distance = Math.hypot(pos.x - plot.mesh.position.x, pos.z - plot.mesh.position.z)
      if (distance < plotDistance) {
        plotDistance = distance
        plotId = plot.id
      }
    }
    if (plotId) {
      this.pick(() => tryHarvest(plotId), 0.3)
      return
    }

    const animals = this.world.livestock
    const eggDistance = Math.hypot(pos.x - animals.eggFocus.x, pos.z - animals.eggFocus.z)
    if (eggDistance < 1.5 && data.eggsReady > 0) {
      this.pick(() => tryCollectEggs(1), 0.24)
      return
    }
    const milkDistance = Math.hypot(pos.x - animals.milkFocus.x, pos.z - animals.milkFocus.z)
    if (milkDistance < 1.55 && data.milkReady > 0) {
      this.pick(() => tryCollectMilk(1), 0.24)
    }
  }

  private pick(action: () => ActionResult, delay: number): void {
    const result = action()
    if (!result.ok) {
      if (result.message.toLowerCase().includes('full')) {
        this.handTimer = 1.5
        this.hud.toast(result.message)
        chime('no')
      }
      return
    }
    this.handTimer = delay
    const carried = Object.values(state().inventory).reduce((sum, count) => sum + count, 0)
    chime('stack', 0.85 + Math.min(carried, 8) * 0.07)
    navigator.vibrate?.(carried >= 8 ? [16, 24, 16] : 12)
  }

  private feedback(result: ActionResult): void {
    this.hud.toast(result.message)
    chime(result.sound, result.sound === 'stack' ? 1.15 : 1)
    if (result.sound === 'stack') navigator.vibrate?.([12, 26, 12])
    else if (result.ok) navigator.vibrate?.(12)
  }

  debugTeleport(x: number, z: number): void {
    this.player.mesh.position.set(x, 0, z)
  }

  debugAct(): ActionResult | null {
    const pos = this.player.mesh.position
    this.interaction.update(0, pos.x, pos.z)
    const result = this.interaction.activate()
    this.syncViews()
    return result
  }

  debugInfo(): { x: number; z: number; ix: number; iy: number } {
    return {
      x: this.player.mesh.position.x,
      z: this.player.mesh.position.z,
      ix: input.x,
      iy: input.y,
    }
  }

  debugState(): ReturnType<typeof state> {
    return state()
  }

  debugCustomers(): Array<{ x: number; z: number; state: string; visible: boolean }> {
    return this.customers.snapshot()
  }
}
