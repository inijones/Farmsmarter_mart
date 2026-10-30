import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  PlaneGeometry,
  SphereGeometry,
} from 'three'

const geos = new Map<string, BufferGeometry>()

function cache(key: string, create: () => BufferGeometry): BufferGeometry {
  let geometry = geos.get(key)
  if (!geometry) {
    geometry = create()
    geos.set(key, geometry)
  }
  return geometry
}

export function boxGeo(w: number, h: number, d: number): BufferGeometry {
  return cache(`box:${w}:${h}:${d}`, () => new BoxGeometry(w, h, d))
}

export function sphereGeo(r: number, seg = 10): BufferGeometry {
  return cache(`sph:${r}:${seg}`, () => new SphereGeometry(r, seg, Math.max(6, seg - 2)))
}

export function cylGeo(rt: number, rb: number, h: number, seg = 8): BufferGeometry {
  return cache(`cyl:${rt}:${rb}:${h}:${seg}`, () => new CylinderGeometry(rt, rb, h, seg))
}

export function coneGeo(r: number, h: number, seg = 8): BufferGeometry {
  return cache(`cone:${r}:${h}:${seg}`, () => new ConeGeometry(r, h, seg))
}

export function circleGeo(r: number): BufferGeometry {
  return cache(`cir:${r}`, () => new CircleGeometry(r, 14))
}

export function planeGeo(): BufferGeometry {
  return cache('plane', () => new PlaneGeometry(1, 1))
}
