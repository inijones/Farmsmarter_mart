import { Group, Vector3 } from 'three'
import { box, cyl, shadow, sphere } from '../game/materials'
import { clearGroup, makeProduct } from '../game/productMesh'
import type { ProductId } from '../types'

const LOOKS = [
  { skin: '#8a4e32', hair: '#f4d35a', top: '#d23b6a', bottom: '#f2c14d', accent: '#1c1c1c', style: 'wrap' },
  { skin: '#c48a62', hair: '#2a1810', top: '#1d2744', bottom: '#1d2744', accent: '#111111', style: 'suit' },
  { skin: '#6d3b2a', hair: '#111111', top: '#f7f4ef', bottom: '#2a5bd7', accent: '#e23b32', style: 'street' },
  { skin: '#e2b48a', hair: '#1a1a1a', top: '#7a3ee0', bottom: '#7a3ee0', accent: '#f2c14d', style: 'gown' },
  { skin: '#a56b45', hair: '#3a2416', top: '#e36a2e', bottom: '#2c333a', accent: '#f4efe8', style: 'jacket' },
  { skin: '#5a341c', hair: '#111111', top: '#14a36a', bottom: '#0e3d32', accent: '#f2c14d', style: 'set' },
] as const

export class Customer {
  readonly mesh = new Group()
  readonly waypoints: Vector3[] = []
  waypoint = 0
  state: 'idle' | 'walk' | 'browse' | 'queue' | 'pay' | 'leave' = 'idle'
  timer = 0
  stuck = 0
  shelfId = ''
  product: 'tomato' | 'carrot' | 'corn' | 'egg' | 'milk' | null = null
  slot = -1
  private readonly bob: Group
  private readonly leftLeg: Group
  private readonly rightLeg: Group
  private readonly load: Group
  private phase = 0

  constructor(index: number) {
    const look = LOOKS[index % LOOKS.length]
    this.bob = new Group()
    this.mesh.add(shadow(this.mesh, 0.42))
    this.mesh.add(this.bob)
    const legs = dress(this.bob, look)
    this.leftLeg = legs.left
    this.rightLeg = legs.right
    const carrier = index % 2 === 0 ? addBag(this.bob, look.accent) : addCart(this.bob)
    this.load = new Group()
    this.load.position.set(0, index % 2 === 0 ? 0.22 : 0.5, 0)
    this.load.visible = false
    carrier.add(this.load)
    this.mesh.visible = false
  }

  setCarrying(product: ProductId | null): void {
    clearGroup(this.load)
    this.load.visible = product !== null
    if (product) makeProduct(this.load, product, 0.75)
  }

  resetPath(points: Array<[number, number]>): void {
    this.waypoint = 0
    this.stuck = 0
    for (let i = 0; i < points.length; i += 1) {
      const point = this.waypoints[i] ?? new Vector3()
      point.set(points[i][0], 0, points[i][1])
      this.waypoints[i] = point
    }
    this.waypoints.length = points.length
  }

  face(dx: number, dz: number): void {
    if (dx * dx + dz * dz < 0.0001) return
    this.mesh.rotation.y = Math.atan2(dx, dz)
  }

  bobble(dt: number, moving: boolean): void {
    if (moving) this.phase += dt * 10
    const swing = moving ? Math.sin(this.phase) * 0.5 : 0
    this.leftLeg.rotation.x = swing
    this.rightLeg.rotation.x = -swing
    this.bob.position.y = moving ? Math.abs(Math.sin(this.phase)) * 0.04 : 0
  }
}

function dress(root: Group, look: (typeof LOOKS)[number]): { left: Group; right: Group } {
  const left = new Group()
  const right = new Group()
  left.position.set(-0.13, 0.58, 0)
  right.position.set(0.13, 0.58, 0)
  root.add(left, right)
  const shoe = look.style === 'gown' ? look.accent : '#2c241c'
  box(left, 0.16, 0.34, 0.18, look.bottom, 0, -0.14, 0)
  box(right, 0.16, 0.34, 0.18, look.bottom, 0, -0.14, 0)
  box(left, 0.18, 0.1, 0.26, shoe, 0, -0.32, 0.04)
  box(right, 0.18, 0.1, 0.26, shoe, 0, -0.32, 0.04)

  const skirt = look.style === 'gown' || look.style === 'wrap' || look.style === 'set'
  if (skirt) {
    cyl(root, 0.28, 0.36, 0.46, look.top, 0, 0.78, 0, 10)
  } else {
    box(root, 0.5, 0.16, 0.3, look.bottom, 0, 0.66, 0)
    box(root, 0.46, 0.4, 0.28, look.top, 0, 0.9, 0)
  }

  const leftArm = new Group()
  const rightArm = new Group()
  leftArm.position.set(-0.32, 1.02, 0)
  rightArm.position.set(0.32, 1.02, 0)
  root.add(leftArm, rightArm)
  const sleeve = skirt ? look.top : look.skin
  box(leftArm, 0.12, 0.32, 0.12, sleeve, 0, -0.14, 0)
  box(rightArm, 0.12, 0.32, 0.12, sleeve, 0, -0.14, 0)

  sphere(root, 0.27, look.skin, 0, 1.34, 0, 12)
  sphere(root, 0.05, '#fff8ef', -0.09, 1.38, 0.22, 6)
  sphere(root, 0.05, '#fff8ef', 0.09, 1.38, 0.22, 6)
  sphere(root, 0.028, '#1b1b1b', -0.09, 1.38, 0.26, 5)
  sphere(root, 0.028, '#1b1b1b', 0.09, 1.38, 0.26, 5)

  if (look.style === 'wrap') {
    cyl(root, 0.3, 0.32, 0.14, look.bottom, 0, 1.58, 0, 10)
    box(root, 0.1, 0.28, 0.08, look.bottom, 0, 1.2, -0.12)
    sphere(root, 0.05, look.accent, -0.2, 1.22, 0.1, 5)
  } else if (look.style === 'suit') {
    box(root, 0.08, 0.22, 0.04, '#f4f1ea', 0, 0.92, 0.14)
    box(root, 0.1, 0.05, 0.03, '#1b1b1b', -0.08, 1.4, 0.24)
    box(root, 0.1, 0.05, 0.03, '#1b1b1b', 0.08, 1.4, 0.24)
    sphere(root, 0.18, look.hair, 0, 1.5, -0.02, 8)
  } else if (look.style === 'street') {
    cyl(root, 0.24, 0.24, 0.08, look.accent, 0, 1.62, 0, 10)
    box(root, 0.34, 0.06, 0.22, look.accent, 0, 1.56, 0.08)
    sphere(root, 0.16, look.hair, 0, 1.48, -0.04, 7)
  } else if (look.style === 'gown') {
    sphere(root, 0.2, look.hair, 0, 1.5, -0.02, 8)
    sphere(root, 0.05, look.accent, 0, 1.02, 0.2, 5)
    sphere(root, 0.045, look.accent, -0.22, 1.28, 0.08, 5)
    sphere(root, 0.045, look.accent, 0.22, 1.28, 0.08, 5)
  } else if (look.style === 'jacket') {
    box(root, 0.52, 0.28, 0.16, look.top, 0, 1.02, -0.04)
    sphere(root, 0.2, look.hair, 0, 1.5, -0.02, 8)
    box(root, 0.22, 0.06, 0.04, look.accent, 0, 0.72, 0.16)
  } else {
    sphere(root, 0.22, look.hair, 0, 1.5, 0, 8)
    sphere(root, 0.05, look.accent, -0.22, 1.28, 0.1, 5)
    sphere(root, 0.05, look.accent, 0.22, 1.28, 0.1, 5)
    box(root, 0.16, 0.12, 0.04, look.bottom, 0, 0.96, 0.16)
  }

  return { left, right }
}

function addBag(root: Group, color: string): Group {
  const bag = new Group()
  bag.position.set(0.38, 0.78, 0.18)
  root.add(bag)
  box(bag, 0.28, 0.32, 0.16, '#f7f1e4', 0, 0.16, 0)
  box(bag, 0.22, 0.06, 0.12, color, 0, 0.34, 0)
  cyl(bag, 0.035, 0.035, 0.22, color, -0.06, 0.4, 0, 6)
  cyl(bag, 0.035, 0.035, 0.22, color, 0.06, 0.4, 0, 6)
  return bag
}

function addCart(root: Group): Group {
  const cart = new Group()
  cart.position.set(0, 0, 0.72)
  root.add(cart)
  box(cart, 0.5, 0.22, 0.36, '#f6f3ee', 0, 0.46, 0)
  box(cart, 0.44, 0.06, 0.3, '#e4d3b4', 0, 0.34, 0)
  box(cart, 0.04, 0.42, 0.04, '#b7bcc4', -0.18, 0.62, -0.16)
  box(cart, 0.04, 0.42, 0.04, '#b7bcc4', 0.18, 0.62, -0.16)
  box(cart, 0.4, 0.04, 0.04, '#b7bcc4', 0, 0.82, -0.16)
  for (const [x, z] of [
    [-0.16, 0.14],
    [0.16, 0.14],
    [-0.16, -0.14],
    [0.16, -0.14],
  ] as const) {
    const wheel = cyl(cart, 0.07, 0.07, 0.05, '#2c3138', x, 0.28, z, 8)
    wheel.rotation.z = Math.PI / 2
  }
  return cart
}
