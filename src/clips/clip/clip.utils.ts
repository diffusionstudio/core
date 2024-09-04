/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Container, Filter } from "pixi.js";
import { Keyframe } from "../../models";

import type { Timestamp } from "../../models";

/**
 * Replace all keyframes of an object and nested objects
 * @param obj The object to crawl
 * @param time Time of replacement
 * @param depth Portection agains circular deps
 * @returns void
 */
export function replaceKeyframes(obj: any, time: Timestamp, depth = 0) {
  if (
    obj instanceof Container
    || obj instanceof Filter
    || depth == 3
  ) return;

  for (const key in obj) {
    const value = obj[key];

    if (!key) continue;

    if (value instanceof Keyframe) {
      obj[key] = value.value(time);
    }

    if (value != null && typeof value == 'object' && Object.keys(value).length) {
      replaceKeyframes(value, time, depth + 1);
    }
  }
}
