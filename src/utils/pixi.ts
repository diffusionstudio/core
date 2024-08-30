/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Renderer } from "pixi.js";

/**
 * Util for clearing the renderer and
 * ignoring all errors
 */
export function clear(renderer?: Renderer, context?: CanvasRenderingContext2D) {
  try {
    renderer?.clear();
    context?.clearRect(0, 0, renderer!.width, renderer!.height);
  } catch (_) { }
}
