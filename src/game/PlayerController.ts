import { PLAYER_SPEED } from '../data/upgrades'
import { Farmer } from '../entities/Farmer'
import { CollisionWorld } from './CollisionWorld'
import { input, screenAxes } from './view'

export class PlayerController {
  private readonly radius = 0.34

  constructor(
    private readonly farmer: Farmer,
    private readonly collision: CollisionWorld,
  ) {}

  update(dt: number): void {
    const key = (name: string) => (input.keys[name] ? 1 : 0)
    const ix = input.x + key('d') + key('arrowright') - key('a') - key('arrowleft')
    const iy = -input.y + key('w') + key('arrowup') - key('s') - key('arrowdown')
    const mag = Math.hypot(ix, iy)
    const moving = mag > 0.08
    const scale = mag > 1 ? 1 / mag : 1
    const dirX = ix * scale
    const dirY = iy * scale
    const speed = PLAYER_SPEED * (mag > 1 ? 1 : mag)
    const wx = (screenAxes.rx * dirX + screenAxes.fx * dirY) * speed * dt
    const wz = (screenAxes.rz * dirX + screenAxes.fz * dirY) * speed * dt
    const pos = this.farmer.mesh.position
    if (!this.collision.blocked(pos.x + wx, pos.z, this.radius)) pos.x += wx
    if (!this.collision.blocked(pos.x, pos.z + wz, this.radius)) pos.z += wz
    this.farmer.animate(dt, moving, wx, wz)
  }
}
