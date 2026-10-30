import {
  CanvasTexture,
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
} from 'three'
import { BOUNDS, CHICKEN, COUNTER, COW, PLOTS, SHELF_HALF, SHELVES } from '../data/layout'
import { SELLER_COST } from '../data/upgrades'
import { CropPlot } from '../entities/CropPlot'
import { Livestock } from '../entities/Livestock'
import { Shelf } from '../entities/Shelf'
import { Badge } from '../game/badge'
import { CollisionWorld } from '../game/CollisionWorld'
import { box, cyl, flat, labelTexture, lambert, shadow, sphere } from '../game/materials'
import { coneGeo } from '../game/primitives'

export type BuiltWorld = {
  collision: CollisionWorld
  plots: CropPlot[]
  shelves: Shelf[]
  livestock: Livestock
  hireBadge: Badge
}

export function buildWorld(scene: Scene): BuiltWorld {
  const collision = new CollisionWorld()
  addGround(scene)
  addWalls(scene)
  addFences(scene)
  addTrees(scene)
  addProps(scene, collision)

  addRearDoor(scene)
  collision.add(COUNTER.x, COUNTER.z, COUNTER.hw, COUNTER.hd)
  collision.addAABB(BOUNDS.minX, -6.95, BOUNDS.minZ, -11.55)
  collision.addAABB(-4.25, BOUNDS.maxX, BOUNDS.minZ, -11.55)
  collision.add(CHICKEN.x, CHICKEN.z, 0.72, 0.58)
  collision.add(COW.x, COW.z, 0.78, 0.62)

  const plots = PLOTS.map((plot) => {
    const entity = new CropPlot(plot.id, plot.crop, plot.x, plot.z)
    scene.add(entity.mesh)
    return entity
  })

  const shelves = SHELVES.map((shelf) => {
    collision.add(shelf.x, shelf.z, SHELF_HALF.x, SHELF_HALF.z)
    const entity = new Shelf(shelf.id, shelf.product, shelf.x, shelf.z)
    scene.add(entity.mesh)
    return entity
  })

  const livestock = new Livestock()
  scene.add(livestock.chickens)
  scene.add(livestock.cow)

  const hireBadge = new Badge()
  hireBadge.setText(String(SELLER_COST), '#d0892d')
  hireBadge.sprite.position.set(COUNTER.x, 1.7, COUNTER.z + 0.15)
  scene.add(hireBadge.sprite)

  return { collision, plots, shelves, livestock, hireBadge }
}

function rng(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTexture(paint: (ctx: CanvasRenderingContext2D, size: number) => void, repeatX: number, repeatY: number): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  paint(ctx, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  return texture
}

function addGround(scene: Scene): void {
  const grass = canvasTexture((ctx, size) => {
    ctx.fillStyle = '#86d35f'
    ctx.fillRect(0, 0, size, size)
    const random = rng(11)
    for (let i = 0; i < 180; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#93dc6c' : '#74c454'
      ctx.beginPath()
      ctx.ellipse(random() * size, random() * size, 4 + random() * 7, 3 + random() * 4, random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }, 14, 14)
  const shop = canvasTexture((ctx, size) => {
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#f4d7b0' : '#efcfA4'
        ctx.fillRect(x * (size / 4), y * (size / 4), size / 4, size / 4)
      }
    }
  }, 8, 6)

  flat(scene, 78, 78, new MeshLambertMaterial({ map: grass }), 0)
  const floor = flat(scene, 27.2, 14.9, new MeshLambertMaterial({ map: shop }), 0.02)
  floor.position.set(0, 0.02, -7.15)

  const pathMat = new MeshLambertMaterial({ color: '#e7c48d' })
  const path = flat(scene, 2.6, 6.4, pathMat, 0.03)
  path.position.set(0, 0.03, 3.3)

  const rug = flat(scene, 2.4, 1.15, new MeshLambertMaterial({ color: '#f0d78a' }), 0.035)
  rug.position.set(0, 0.035, -1.95)
}

function addWalls(scene: Scene): void {
  const wall = '#f4f8fb'
  const trim = '#7eb7e6'
  const cap = '#8ed15f'
  box(scene, 6.9, 2.15, 0.38, wall, -10.2, 1.08, -14.95)
  box(scene, 18.1, 2.15, 0.38, wall, 4.7, 1.08, -14.95)
  box(scene, 6.9, 0.28, 0.42, trim, -10.2, 2.05, -14.95)
  box(scene, 18.1, 0.28, 0.42, trim, 4.7, 2.05, -14.95)
  box(scene, 27.6, 0.22, 0.7, cap, 0, 2.28, -14.95)
  box(scene, 0.36, 1.7, 15.2, wall, -13.75, 0.85, -7.3)
  box(scene, 0.36, 1.7, 15.2, wall, 13.75, 0.85, -7.3)
  box(scene, 0.42, 0.22, 15.3, cap, -13.75, 1.78, -7.3)
  box(scene, 0.42, 0.22, 15.3, cap, 13.75, 1.78, -7.3)

  for (const x of [-9.4, -2, 2, 6]) {
    box(scene, 1.5, 1.05, 0.08, '#d7ecf8', x, 1.15, -14.72)
    box(scene, 1.62, 0.08, 0.1, trim, x, 1.7, -14.7)
  }

  const sign = new MeshLambertMaterial({ map: labelTexture('FARMSMARTER MART', '#c4513a', '#fff8ea') })
  const board = flat(scene, 7.4, 1.05, sign, 1.72)
  board.rotation.x = 0
  board.position.set(0, 1.72, -14.42)

  const counter = new Group()
  counter.position.set(COUNTER.x, 0, COUNTER.z)
  scene.add(counter)
  box(counter, 3.5, 0.92, 1.15, '#e7cba2', 0, 0.46, 0)
  box(counter, 3.62, 0.12, 1.28, '#f3ddb8', 0, 0.96, 0)
  box(counter, 0.46, 0.32, 0.34, '#3c4148', 0.85, 1.18, 0.15)
  box(counter, 0.32, 0.22, 0.06, '#8fd0ea', 0.85, 1.28, 0.32)
  box(counter, 0.16, 0.04, 0.2, '#222', 0.85, 1.02, 0.28)
}

function addRearDoor(scene: Scene): void {
  const trim = '#d7e6f2'
  const leaf = '#fffaf4'
  box(scene, 0.14, 1.62, 0.28, trim, -6.75, 0.82, -14.72)
  box(scene, 0.14, 1.62, 0.28, trim, -4.45, 0.82, -14.72)
  box(scene, 2.5, 0.16, 0.2, '#e24b45', -5.6, 1.68, -14.7)
  const stoop = flat(scene, 2.4, 1.35, new MeshLambertMaterial({ color: '#f0d7b0' }), 0.03)
  stoop.position.set(-5.6, 0.03, -15.05)

  const left = new Group()
  left.position.set(-6.68, 0, -14.55)
  left.rotation.y = 0.85
  scene.add(left)
  box(left, 0.9, 1.46, 0.07, leaf, 0.46, 0.76, 0)
  box(left, 0.5, 0.7, 0.02, '#d7eef8', 0.46, 0.9, 0.05)

  const right = new Group()
  right.position.set(-4.52, 0, -14.55)
  right.rotation.y = -0.85
  scene.add(right)
  box(right, 0.9, 1.46, 0.07, leaf, -0.46, 0.76, 0)
  box(right, 0.5, 0.7, 0.02, '#d7eef8', -0.46, 0.9, 0.05)
}

function addFences(scene: Scene): void {
  fenceLine(scene, -13.35, 0.4, -13.35, 16.05, 14)
  fenceLine(scene, 13.35, 0.4, 13.35, 16.05, 14)
  fenceLine(scene, -13.35, 16.05, 13.35, 16.05, 18)
  // Crop-yard fence in the foreground, open toward the shop.
  fenceLine(scene, -10.6, 14.15, -1.2, 14.15, 8)
  fenceLine(scene, -10.6, 4.35, -10.6, 14.15, 8)

  for (let i = 0; i < 7; i += 1) {
    box(scene, 0.2, 0.85, 0.1, i % 2 === 0 ? '#f7f3ea' : '#e24b45', -11.55 + i * 0.2, 0.62, 1.35)
  }
  cyl(scene, 0.07, 0.07, 1.15, '#d9d3c8', -11.7, 0.58, 1.35, 6)
  cyl(scene, 0.07, 0.07, 1.15, '#d9d3c8', -10.25, 0.58, 1.35, 6)
}

function fenceLine(scene: Scene, x1: number, z1: number, x2: number, z2: number, posts: number): void {
  for (let i = 0; i <= posts; i += 1) {
    const t = i / posts
    box(scene, 0.12, 0.62, 0.12, '#c48a4e', x1 + (x2 - x1) * t, 0.32, z1 + (z2 - z1) * t)
  }
  const length = Math.hypot(x2 - x1, z2 - z1)
  const angle = -Math.atan2(z2 - z1, x2 - x1)
  for (const y of [0.22, 0.48]) {
    const rail = box(scene, length, 0.08, 0.08, '#ddb075', (x1 + x2) / 2, y, (z1 + z2) / 2)
    rail.rotation.y = angle
  }
}

function addTrees(scene: Scene): void {
  const spots = [
    [-11.6, 15.1, 1],
    [11.4, 15.2, 0.9],
    [12.2, 3.4, 0.85],
    [-12.3, 3.2, 0.8],
    [6.4, 15.15, 1.05],
  ]
  for (const [x, z, scale] of spots) {
    const tree = new Group()
    tree.position.set(x, 0, z)
    scene.add(tree)
    cyl(tree, 0.16 * scale, 0.22 * scale, 0.9, '#8d5a34', 0, 0.45, 0, 6)
    sphere(tree, 0.62 * scale, '#3e8f45', 0, 1.25, 0, 8)
    sphere(tree, 0.42 * scale, '#67b84e', 0.28 * scale, 1.15, 0.1, 7)
    sphere(tree, 0.36 * scale, '#2f7a3c', -0.26 * scale, 1.2, -0.05, 7)
    shadow(tree, 0.55 * scale)
  }

  const random = rng(42)
  const tuft = new InstancedMesh(coneGeo(0.08, 0.24, 4), lambert('#63b447'), 70)
  const dummy = new Object3D()
  let tufts = 0
  for (let i = 0; i < 120 && tufts < 70; i += 1) {
    const x = (random() - 0.5) * 24
    const z = 2.2 + random() * 12.5
    if (x > -10.8 && x < -1.4 && z > 4.2 && z < 13.4) continue
    if (Math.hypot(x - CHICKEN.x, z - CHICKEN.z) < 1.4) continue
    if (Math.hypot(x - COW.x, z - COW.z) < 1.6) continue
    dummy.position.set(x, 0.1, z)
    dummy.rotation.set(0, random() * 3, 0)
    dummy.scale.set(1, 0.65 + random() * 0.7, 1)
    dummy.updateMatrix()
    tuft.setMatrixAt(tufts, dummy.matrix)
    tufts += 1
  }
  tuft.count = tufts
  tuft.instanceMatrix.needsUpdate = true
  scene.add(tuft)
}

function addProps(scene: Scene, collision: CollisionWorld): void {
  const cooler = new Group()
  cooler.position.set(11.15, 0, -12.7)
  scene.add(cooler)
  box(cooler, 1.3, 1.7, 0.7, '#6eb0e4', 0, 0.85, 0)
  box(cooler, 1.05, 0.9, 0.08, '#d7f0ff', 0, 1.05, 0.34)
  box(cooler, 1.35, 0.12, 0.76, '#f4f7fb', 0, 1.72, 0)

  const bin = new Group()
  bin.position.set(11.15, 0, -8.6)
  scene.add(bin)
  cyl(bin, 0.28, 0.24, 0.55, '#d0d5dc', 0, 0.32, 0, 8)
  cyl(bin, 0.3, 0.3, 0.08, '#e24b45', 0, 0.62, 0, 8)
  collision.add(11.15, -8.6, 0.32, 0.32)

  const crate = new Group()
  crate.position.set(-11.2, 0, -8.7)
  scene.add(crate)
  box(crate, 0.7, 0.45, 0.55, '#c48a52', 0, 0.28, 0)
  box(crate, 0.55, 0.4, 0.45, '#d7a36a', 0.05, 0.7, 0)
  collision.add(-11.2, -8.7, 0.4, 0.35)

  const plant = new Group()
  plant.position.set(-12.2, 0, -13.3)
  scene.add(plant)
  cyl(plant, 0.22, 0.18, 0.32, '#d07a45', 0, 0.2, 0, 8)
  sphere(plant, 0.28, '#3f9a45', 0, 0.55, 0, 7)
}
