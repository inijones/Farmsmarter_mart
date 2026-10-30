export function naira(value: number): string {
  return `₦${Math.floor(value).toLocaleString('en-NG')}`
}

export function inkFor(hex: string): string {
  const raw = hex.replace('#', '')
  const value = Number.parseInt(raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance > 0.64 ? '#243228' : '#fffaf2'
}
