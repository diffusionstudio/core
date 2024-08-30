/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

/**
 * Performs linear interpolation between two numbers.
 * @param start - The starting value.
 * @param end - The ending value.
 * @param t - The interpolation factor (between 0 and 1).
 * @returns The interpolated value.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpolates between two hex color values.
 * @param color1 - The starting color in hex format.
 * @param color2 - The ending color in hex format.
 * @param t - The interpolation factor (between 0 and 1).
 * @returns The interpolated color in hex format.
 */
export function interpolateColor(color1: string, color2: string, t: number): string {
  // Assuming colors are in the format '#RRGGBB'
  const c1 = Number.parseInt(color1.slice(1), 16);
  const c2 = Number.parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const easingFunctions = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => {
    if (t < 0.5) return 2 * t * t;
    return -1 + (4 - 2 * t) * t;
  },
}
