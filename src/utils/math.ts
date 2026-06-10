export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

export function damp(current: number, target: number, smoothing: number, deltaSeconds: number): number {
  return lerp(current, target, 1 - Math.exp(-smoothing * deltaSeconds));
}
