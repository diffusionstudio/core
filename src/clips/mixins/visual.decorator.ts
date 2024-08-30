/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { MixinType } from "../../types";
import type { Clip } from "../clip";
import type { VisualMixin } from "./visual";

/**
 * Defines the visual render decorator
 */
export function visualize<T extends MixinType<typeof VisualMixin> & Clip> // @ts-ignore
  (target: T, propertyKey: string, descriptor: PropertyDescriptor) {

  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: any[]) {
    const timestamp = (args[1] ?? 0) - this.start.millis;
    const screen = {
      width: this.track?.composition?.width ?? 0,
      height: this.track?.composition?.height ?? 0,
    }

    if (this.filters && !this.container.filters) {
      this.container.filters = this.filters;
    }

    /**
     * Handle the postion of the object
     */

    const transX = typeof this.translate.x == 'number'
      ? this.translate.x
      : this.translate.x.value(timestamp);

    const transY = typeof this.translate.y == 'number'
      ? this.translate.y
      : this.translate.y.value(timestamp);

    let posX: number;

    if (typeof this._position.x == 'number') {
      posX = this._position.x;
    } else if (typeof this._position.x == 'string') {
      posX = Number.parseFloat(this._position.x) * screen.width / 100;
    } else {
      posX = this._position.x.value(timestamp);
    }

    let posY: number;

    if (typeof this._position.y == 'number') {
      posY = this._position.y;
    } else if (typeof this._position.y == 'string') {
      posY = Number.parseFloat(this._position.y) * screen.height / 100;
    } else {
      posY = this._position.y.value(timestamp);
    }

    this.container.position.set(posX + transX, posY + transY);


    /**
     * Handle the dimensions of the object
     */
    if (typeof this._height == 'string') {
      this.container.height = Math.round(Number.parseFloat(this._height) * screen.height / 100);
    } else if (typeof this._height == 'object') {
      this.container.height = this._height.value(timestamp);
    } else if (this._height) {
      this.container.height = this._height;
    }

    // Keep aspect ratio
    if (this._height && !this._width) {
      this.container.scale.set(this.container.scale.y);
    }

    if (typeof this._width == 'string') {
      this.container.width = Math.round(Number.parseFloat(this._width) * screen.width / 100);
    } else if (typeof this._width == 'object') {
      this.container.width = this._width.value(timestamp);
    } else if (this._width) {
      this.container.width = this._width;
    }

    // Keep aspect ratio
    if (this._width && !this._height) {
      this.container.scale.set(this.container.scale.x);
    }

    if (this._scale) {
      let scaleX = typeof this._scale.x == 'number'
        ? this._scale.x
        : this._scale.x.value(timestamp);

      let scaleY = typeof this._scale.y == 'number'
        ? this._scale.y
        : this._scale.y.value(timestamp);

      // Make scale relative in case width is defined
      if (this._width || this._height) {
        scaleX *= this.container.scale._x;
        scaleY *= this.container.scale._y;
      }

      this.container.scale.set(scaleX, scaleY);
    }

    /**
     * Handle the rotation of the object
     */
    if (typeof this.rotation != 'number') {
      this.container.angle = this.rotation.value(timestamp);
    } else {
      this.container.angle = this.rotation;
    }

    /**
     * Handle the opacity of the object
     */
    if (typeof this.alpha != 'number') {
      this.container.alpha = this.alpha.value(timestamp);
    } else {
      this.container.alpha = this.alpha;
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
};