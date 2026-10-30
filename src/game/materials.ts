import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  type BufferGeometry,
  type Material,
} from 'three'
import { boxGeo, circleGeo, coneGeo, cylGeo, planeGeo, sphereGeo } from './primitives'

const lamberts = new Map<string, MeshLambertMaterial>()

export function lambert(color: string): MeshLambertMaterial {
  let material = lamberts.get(color)
  if (!material) {
    material = new MeshLambertMaterial({ color })
    lamberts.set(color, material)
  }
  return material
}

export const shadowMat = new MeshBasicMaterial({
  color: '#1d2a18',
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
})

export function put(
  parent: Object3D,
  geometry: BufferGeometry,
  material: Material,
  x = 0,
  y = 0,
  z = 0,
): Mesh {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function box(parent: Object3D, w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0): Mesh {
  return put(parent, boxGeo(w, h, d), lambert(color), x, y, z)
}

export function sphere(parent: Object3D, r: number, color: string, x = 0, y = 0, z = 0, seg = 10): Mesh {
  return put(parent, sphereGeo(r, seg), lambert(color), x, y, z)
}

export function cyl(
  parent: Object3D,
  rt: number,
  rb: number,
  h: number,
  color: string,
  x = 0,
  y = 0,
  z = 0,
  seg = 8,
): Mesh {
  return put(parent, cylGeo(rt, rb, h, seg), lambert(color), x, y, z)
}

export function cone(parent: Object3D, r: number, h: number, color: string, x = 0, y = 0, z = 0): Mesh {
  return put(parent, coneGeo(r, h), lambert(color), x, y, z)
}

export function shadow(parent: Object3D, radius: number, y = 0.025): Mesh {
  const mesh = put(parent, circleGeo(radius), shadowMat, 0, y, 0)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

export function flat(parent: Object3D, width: number, depth: number, material: Material, y = 0): Mesh {
  const mesh = put(parent, planeGeo(), material, 0, y, 0)
  mesh.rotation.x = -Math.PI / 2
  mesh.scale.set(width, depth, 1)
  return mesh
}

export function tileTexture(c1: string, c2: string, repeatX: number, repeatY: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? c1 : c2
      ctx.fillRect(x * 32, y * 32, 32, 32)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  return texture
}

export function labelTexture(text: string, bg: string, fg: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 180
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = fg
  ctx.font = '700 58px Trebuchet MS, Segoe UI, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
