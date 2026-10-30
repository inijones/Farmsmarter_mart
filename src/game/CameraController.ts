import { PerspectiveCamera, Vector3 } from 'three'
import { cameraOffset } from './view'

export class CameraController {
  readonly camera: PerspectiveCamera
  private readonly look = new Vector3()
  private readonly lookDesired = new Vector3()
  private readonly desired = new Vector3()
  private readonly offset = new Vector3(cameraOffset.x, cameraOffset.y, cameraOffset.z)
  private distance = 22

  constructor() {
    this.camera = new PerspectiveCamera(30, 1, 0.1, 140)
    this.resize(window.innerWidth, window.innerHeight)
  }

  resize(width: number, height: number): void {
    const aspect = width / Math.max(1, height)
    this.camera.aspect = aspect
    this.camera.fov = aspect < 0.75 ? 32 : 28
    this.distance = aspect < 0.62 ? 30 : aspect < 0.9 ? 26 : aspect < 1.2 ? 22.5 : 20
    this.camera.updateProjectionMatrix()
  }

  snap(x: number, y: number, z: number): void {
    this.placeLook(x, y, z, this.look)
    this.camera.position.copy(this.look).addScaledVector(this.offset, this.distance)
    this.camera.lookAt(this.look)
  }

  update(dt: number, x: number, y: number, z: number): void {
    this.placeLook(x, y, z, this.lookDesired)
    const blend = 1 - Math.exp(-dt * 4.2)
    this.look.lerp(this.lookDesired, blend)
    this.desired.copy(this.look).addScaledVector(this.offset, this.distance)
    this.camera.position.lerp(this.desired, blend)
    this.camera.lookAt(this.look)
  }

  private placeLook(x: number, y: number, z: number, target: Vector3): void {
    const intoShop = z > 0.4 ? 3.6 : 0.4
    target.set(x, y, z - intoShop)
  }
}
