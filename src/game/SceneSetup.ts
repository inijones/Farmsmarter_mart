import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'

export function createScene(): Scene {
  const scene = new Scene()
  scene.background = new Color('#b7e4f8')
  scene.fog = new Fog('#d3f0c4', 46, 82)
  scene.add(new HemisphereLight('#fff7e4', '#73b255', 1.15))
  scene.add(new AmbientLight('#ffffff', 0.28))
  const sun = new DirectionalLight('#fff4d2', 1.35)
  sun.position.set(-12, 20, 8)
  scene.add(sun)
  return scene
}

export function pixelRatio(): number {
  const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900
  return Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : 1.75)
}

export function createRenderer(host: HTMLElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.setPixelRatio(pixelRatio())
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.domElement.style.touchAction = 'none'
  host.appendChild(renderer.domElement)
  return renderer
}
