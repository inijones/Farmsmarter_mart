export const input = {
  x: 0,
  y: 0,
  keys: {} as Record<string, boolean>,
}

const pitch = (58 * Math.PI) / 180
const yaw = 0.58
const horizontal = Math.cos(pitch)
const ox = Math.sin(yaw) * horizontal
const oz = Math.cos(yaw) * horizontal
const oy = Math.sin(pitch)
const ground = Math.hypot(ox, oz) || 1

export const cameraOffset = { x: ox, y: oy, z: oz }
export const screenAxes = {
  fx: -ox / ground,
  fz: -oz / ground,
  rx: oz / ground,
  rz: -ox / ground,
}
