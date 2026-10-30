import { Group, Object3D } from 'three'
import { PRODUCTS } from '../data/products'
import { cone, cyl, sphere } from './materials'
import type { ProductId } from '../types'

export function makeProduct(parent: Object3D, id: ProductId, scale = 1): Group {
  const group = new Group()
  parent.add(group)
  const def = PRODUCTS[id]
  if (id === 'tomato') {
    sphere(group, 0.16 * scale, def.color, 0, 0.16 * scale, 0, 8)
    sphere(group, 0.07 * scale, def.accent, 0, 0.3 * scale, 0, 6)
  } else if (id === 'carrot') {
    const body = cone(group, 0.1 * scale, 0.32 * scale, def.color, 0, 0.16 * scale, 0)
    body.rotation.z = 0.15
    sphere(group, 0.1 * scale, def.accent, 0, 0.34 * scale, 0, 6)
  } else if (id === 'corn') {
    sphere(group, 0.08 * scale, '#6aaa45', 0, 0.28 * scale, 0, 6)
    const cob = sphere(group, 0.12 * scale, def.color, 0, 0.16 * scale, 0, 8)
    cob.scale.set(0.7, 1.15, 0.7)
  } else if (id === 'egg') {
    const egg = sphere(group, 0.13 * scale, def.color, 0, 0.14 * scale, 0, 8)
    egg.scale.set(0.82, 1.05, 0.82)
  } else {
    cyl(group, 0.13 * scale, 0.14 * scale, 0.26 * scale, def.color, 0, 0.15 * scale, 0, 8)
    cyl(group, 0.08 * scale, 0.08 * scale, 0.07 * scale, def.accent, 0, 0.3 * scale, 0, 8)
  }
  return group
}

export function clearGroup(group: Group): void {
  for (let i = group.children.length - 1; i >= 0; i -= 1) group.remove(group.children[i])
}
