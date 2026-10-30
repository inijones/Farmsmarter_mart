import { Scene } from 'three'
import { CUSTOMER_LIMIT_Z, CUSTOMER_TILL, DOOR, DOOR_LANE, DOOR_OUT, REAR_AISLE_Z, SIDE_LANE, STAFF_ZONE, WAIT_SPOTS } from '../data/layout'
import { naira } from '../data/money'
import { PRODUCTS } from '../data/products'
import { CUSTOMER_SPEED } from '../data/upgrades'
import { Customer } from '../entities/Customer'
import { CollisionWorld } from '../game/CollisionWorld'
import { addCoins } from './EconomySystem'
import { takeFromShelf, totalStock } from './ShopSystem'
import { state } from '../state/store'
import type { ProductId } from '../types'
import type { Shelf } from '../entities/Shelf'

const POOL = 6

export class CustomerSystem {
  private readonly customers: Customer[] = []
  private spawnTimer = 1.4

  constructor(
    scene: Scene,
    private readonly collision: CollisionWorld,
    private readonly shelves: Shelf[],
    private readonly playerNearCounter: () => boolean,
    private readonly onSale: (message: string) => void,
  ) {
    for (let i = 0; i < POOL; i += 1) {
      const customer = new Customer(i)
      scene.add(customer.mesh)
      this.customers.push(customer)
    }
  }

  snapshot(): Array<{ x: number; z: number; state: string; visible: boolean }> {
    return this.customers.map((customer) => ({
      x: Math.round(customer.mesh.position.x * 100) / 100,
      z: Math.round(customer.mesh.position.z * 100) / 100,
      state: customer.state,
      visible: customer.mesh.visible,
    }))
  }

  update(dt: number): void {
    const active = this.customers.filter((customer) => customer.state !== 'idle').length
    const stock = totalStock()
    const cap = stock <= 0 ? 0 : Math.min(POOL, Math.ceil(stock / 2))
    if (active < cap) {
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) {
        this.spawnTimer = Math.max(1.25, 4.6 - stock * 0.24)
        this.spawn()
      }
    } else if (stock === 0) {
      this.spawnTimer = 1.2
    }

    this.promoteQueue()

    for (const customer of this.customers) {
      if (customer.state === 'idle') continue
      if (customer.state === 'walk' || customer.state === 'leave' || customer.state === 'queue' || customer.state === 'pay') {
        this.follow(customer, dt)
      } else if (customer.state === 'browse') this.browse(customer, dt)
      if (customer.state === 'pay' && customer.waypoint >= customer.waypoints.length) this.checkout(customer, dt)
    }
  }

  private spawn(): void {
    const customer = this.customers.find((entry) => entry.state === 'idle')
    const shelf = this.pickShelf()
    if (!customer || !shelf) return
    customer.mesh.position.set(DOOR_OUT.x, 0, DOOR_OUT.z)
    customer.mesh.visible = true
    customer.setCarrying(null)
    customer.shelfId = shelf.id
    customer.product = null
    customer.slot = -1
    customer.timer = 0
    customer.state = 'walk'
    customer.face(0, 1)
    customer.resetPath([
      [DOOR.x, DOOR.z],
      [DOOR.x, REAR_AISLE_Z],
      ...pathToShelf(shelf.focus.x, shelf.focus.z),
    ])
  }

  private pickShelf(): Shelf | undefined {
    const open = this.shelves.filter((shelf) => {
      const data = state().shelves.find((item) => item.id === shelf.id)
      return (data?.stock ?? 0) > 0
    })
    if (open.length === 0) return undefined
    return open[Math.floor(Math.random() * open.length)]
  }

  private counterBusy(): boolean {
    return this.customers.some((customer) => customer.state === 'pay')
  }

  private promoteQueue(): void {
    if (this.counterBusy()) return
    const next = this.customers.find((customer) => customer.state === 'queue' && customer.waypoint >= customer.waypoints.length)
    if (!next) return
    next.state = 'pay'
    next.timer = 0
    next.resetPath([[CUSTOMER_TILL.x, CUSTOMER_TILL.z]])
  }

  private follow(customer: Customer, dt: number): void {
    const target = customer.waypoints[customer.waypoint]
    if (!target) {
      if (customer.state === 'walk') customer.state = 'browse'
      else if (customer.state === 'leave') this.release(customer)
      return
    }
    const dx = target.x - customer.mesh.position.x
    const dz = target.z - customer.mesh.position.z
    const dist = Math.hypot(dx, dz)
    if (dist < 0.22) {
      customer.waypoint += 1
      customer.timer = 0
      customer.stuck = 0
      if (customer.waypoint >= customer.waypoints.length) {
        if (customer.state === 'walk') customer.state = 'browse'
        else if (customer.state === 'leave') this.release(customer)
      }
      customer.bobble(dt, false)
      return
    }
    const step = Math.min(dist, CUSTOMER_SPEED * dt)
    this.step(customer, (dx / dist) * step, (dz / dist) * step)
    customer.face(dx, dz)
    customer.bobble(dt, true)
    this.keepBehindCounter(customer)
    customer.timer += dt
    if (customer.timer > 2.6) this.unstick(customer)
  }

  private unstick(customer: Customer): void {
    customer.timer = 0
    customer.stuck += 1
    const pos = customer.mesh.position
    if (customer.state === 'leave') {
      customer.resetPath([
        [DOOR.x, Math.min(pos.z, REAR_AISLE_Z)],
        [DOOR.x, DOOR.z],
        [DOOR_OUT.x, DOOR_OUT.z],
      ])
      if (customer.stuck > 3) this.release(customer)
      return
    }
    if (customer.state === 'pay') {
      const dist = Math.hypot(pos.x - CUSTOMER_TILL.x, pos.z - CUSTOMER_TILL.z)
      if (dist < 0.55) {
        customer.mesh.position.set(CUSTOMER_TILL.x, 0, CUSTOMER_TILL.z)
        customer.waypoint = customer.waypoints.length
        return
      }
      customer.resetPath(pathToCheckout(pos.x, pos.z))
      return
    }
    customer.waypoint += 1
    if (customer.waypoint >= customer.waypoints.length && customer.state === 'walk') customer.state = 'browse'
  }

  private step(customer: Customer, mx: number, mz: number): void {
    const pos = customer.mesh.position
    if (!this.customerBlocked(pos.x + mx, pos.z)) pos.x += mx
    if (!this.customerBlocked(pos.x, pos.z + mz)) pos.z += mz
    if (pos.z > CUSTOMER_LIMIT_Z) pos.z = CUSTOMER_LIMIT_Z
    if (pos.z < DOOR_LANE.innerZ) {
      if (pos.x < DOOR_LANE.minX) pos.x = DOOR_LANE.minX
      if (pos.x > DOOR_LANE.maxX) pos.x = DOOR_LANE.maxX
      if (pos.z < DOOR_LANE.minZ) pos.z = DOOR_LANE.minZ
    }
  }

  private customerBlocked(x: number, z: number): boolean {
    if (outsideMart(x, z)) return true
    if (x > STAFF_ZONE.minX && x < STAFF_ZONE.maxX && z > STAFF_ZONE.minZ && z < STAFF_ZONE.maxZ) return true
    return this.collision.blocked(x, z, 0.32)
  }

  private browse(customer: Customer, dt: number): void {
    customer.timer += dt
    customer.bobble(dt, false)
    if (customer.timer < 1.05) return
    if (!takeFromShelf(customer.shelfId)) {
      const next = this.pickShelf()
      if (!next || next.id === customer.shelfId) {
        this.sendHome(customer)
        return
      }
      customer.shelfId = next.id
      customer.state = 'walk'
      customer.timer = 0
      customer.resetPath(pathToShelf(next.focus.x, next.focus.z))
      return
    }
    const shelf = state().shelves.find((item) => item.id === customer.shelfId)
    customer.product = shelf?.product ?? null
    customer.setCarrying(customer.product)
    customer.timer = 0
    if (this.counterBusy()) {
      const spot = this.waitSpot()
      customer.slot = spot.index
      customer.state = 'queue'
      customer.resetPath(pathToCheckout(customer.mesh.position.x, customer.mesh.position.z).slice(0, -1).concat([[spot.x, spot.z]]))
      if (customer.waypoints.length === 0) customer.resetPath([[spot.x, spot.z]])
      return
    }
    customer.state = 'pay'
    customer.resetPath(pathToCheckout(customer.mesh.position.x, customer.mesh.position.z))
  }

  private waitSpot(): { index: number; x: number; z: number } {
    const used = new Set(this.customers.filter((customer) => customer.state === 'queue').map((customer) => customer.slot))
    const index = WAIT_SPOTS.findIndex((_, spot) => !used.has(spot))
    const spot = WAIT_SPOTS[index < 0 ? 0 : index]
    return { index: index < 0 ? 0 : index, x: spot.x, z: spot.z }
  }

  private keepBehindCounter(customer: Customer): void {
    if (customer.state !== 'pay' && customer.state !== 'queue') return
    const pos = customer.mesh.position
    if (pos.z > CUSTOMER_TILL.z) pos.z = CUSTOMER_TILL.z
  }

  private checkout(customer: Customer, dt: number): void {
    const pos = customer.mesh.position
    this.keepBehindCounter(customer)
    if (Math.hypot(pos.x - CUSTOMER_TILL.x, pos.z - CUSTOMER_TILL.z) > 0.55) return
    customer.face(0, 1)
    customer.bobble(dt, false)
    const served = this.playerNearCounter()
    if (!served) return
    customer.timer += dt
    if (customer.timer < 0.55) return
    if (customer.product) {
      const product = PRODUCTS[customer.product as ProductId]
      addCoins(product.sell)
      state().stats.sold += 1
      this.onSale(`${product.emoji} ${product.name} sold · ${naira(product.sell)}`)
    }
    this.sendHome(customer)
  }

  private sendHome(customer: Customer): void {
    customer.state = 'leave'
    customer.timer = 0
    customer.slot = -1
    const pos = customer.mesh.position
    const side = pos.x >= 0 ? SIDE_LANE : -SIDE_LANE
    const path: Array<[number, number]> = []
    if (pos.z > REAR_AISLE_Z + 0.4) path.push([side, Math.min(pos.z, CUSTOMER_TILL.z)])
    path.push([side, REAR_AISLE_Z], [DOOR.x, REAR_AISLE_Z], [DOOR.x, DOOR.z], [DOOR_OUT.x, DOOR_OUT.z])
    customer.resetPath(path)
  }

  private release(customer: Customer): void {
    customer.slot = -1
    customer.product = null
    customer.setCarrying(null)
    customer.state = 'idle'
    customer.mesh.visible = false
    customer.timer = 0
    customer.stuck = 0
    customer.mesh.position.set(DOOR_OUT.x, 0, DOOR_OUT.z + 1)
  }
}

function outsideMart(x: number, z: number): boolean {
  if (z > CUSTOMER_LIMIT_Z) return true
  if (z < DOOR_LANE.innerZ) {
    return x < DOOR_LANE.minX || x > DOOR_LANE.maxX || z < DOOR_LANE.minZ
  }
  return false
}

function pathToShelf(x: number, z: number): Array<[number, number]> {
  const side = x >= 0 ? SIDE_LANE : -SIDE_LANE
  return [
    [side, REAR_AISLE_Z],
    [side, z],
    [x, z],
  ]
}

function pathToCheckout(fromX: number, fromZ: number): Array<[number, number]> {
  const side = fromX >= 0 ? SIDE_LANE : -SIDE_LANE
  const z = Math.min(fromZ, CUSTOMER_TILL.z)
  if (Math.abs(fromX) < 2.3) {
    return [
      [side, z],
      [side, CUSTOMER_TILL.z],
      [CUSTOMER_TILL.x, CUSTOMER_TILL.z],
    ]
  }
  return [
    [fromX, CUSTOMER_TILL.z],
    [CUSTOMER_TILL.x, CUSTOMER_TILL.z],
  ]
}
