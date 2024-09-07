/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { Timestamp } from "../../models";
import type { MixinType } from "../../types";
import type { Clip } from "../clip";
import type { VisualMixin } from "./visual";

/**
 * Defines the visual render decorator
 */
export function visualize<T extends MixinType<typeof VisualMixin> & Clip> // @ts-ignore
  (target: T, propertyKey: string, descriptor: PropertyDescriptor) {

  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: [Timestamp]) {
    const timestamp = args[0].subtract(this.start);
    const screen = {
      width: this.track?.composition?.width ?? 1920,
      height: this.track?.composition?.height ?? 1080,
    }

    /**
     * Handle the postion of the object
     */

    let transX: number;
    if (typeof this.translate.x == 'number') {
      transX = this.translate.x;
    } else if (typeof this.translate.x == 'function') {
      transX = this.translate.x.bind(this)(timestamp);
    } else {
      transX = this.translate.x.value(timestamp);
    }

    let transY: number;
    if (typeof this.translate.y == 'number') {
      transY = this.translate.y;
    } else if (typeof this.translate.y == 'function') {
      transY = this.translate.y.bind(this)(timestamp);
    } else {
      transY = this.translate.y.value(timestamp);
    }

    let posX: number;

    if (typeof this._position.x == 'number') {
      posX = this._position.x;
    } else if (typeof this._position.x == 'string') {
      posX = Number.parseFloat(this._position.x) * screen.width / 100;
    } else if (typeof this._position.x == 'function') {
      posX = this._position.x.bind(this)(timestamp);
    } else {
      posX = this._position.x.value(timestamp);
    }

    let posY: number;

    if (typeof this._position.y == 'number') {
      posY = this._position.y;
    } else if (typeof this._position.y == 'string') {
      posY = Number.parseFloat(this._position.y) * screen.height / 100;
    } else if (typeof this._position.y == 'function') {
      posY = this._position.y.bind(this)(timestamp)
    } else {
      posY = this._position.y.value(timestamp);
    }

    this.view.position.set(posX + transX, posY + transY);


    /**
     * Handle the dimensions of the object
     */
    if (typeof this._height == 'string') {
      this.view.height = Math.round(Number.parseFloat(this._height) * screen.height / 100);
    } else if (typeof this._height == 'object') {
      this.view.height = this._height.value(timestamp);
    } else if (typeof this._height == 'function') {
      this.view.height = this._height.bind(this)(timestamp);
    } else if (this._height) {
      this.view.height = this._height;
    }

    // Keep aspect ratio
    if (this._height && !this._width) {
      this.view.scale.set(this.view.scale.y);
    }

    if (typeof this._width == 'string') {
      this.view.width = Math.round(Number.parseFloat(this._width) * screen.width / 100);
    } else if (typeof this._width == 'object') {
      this.view.width = this._width.value(timestamp);
    } else if (typeof this._width == 'function') {
      this.view.width = this._width.bind(this)(timestamp);
    } else if (this._width) {
      this.view.width = this._width;
    }

    // Keep aspect ratio
    if (this._width && !this._height) {
      this.view.scale.set(this.view.scale.x);
    }

    if (this._scale) {
      let scaleX: number;

      if (typeof this._scale.x == 'number') {
        scaleX = this._scale.x;
      } else if (typeof this._scale.x == 'function') {
        scaleX = this._scale.x.bind(this)(timestamp);
      } else {
        scaleX = this._scale.x.value(timestamp);
      }

      let scaleY: number;

      if (typeof this._scale.y == 'number') {
        scaleY = this._scale.y;
      } else if (typeof this._scale.y == 'function') {
        scaleY = this._scale.y.bind(this)(timestamp)
      } else {
        scaleY = this._scale.y.value(timestamp);
      }

      // Make scale relative in case width is defined
      if (this._width || this._height) {
        scaleX *= this.view.scale._x;
        scaleY *= this.view.scale._y;
      }

      this.view.scale.set(scaleX, scaleY);
    }

    /**
     * Handle the rotation of the object
     */
    if (typeof this.rotation == 'number') {
      this.view.angle = this.rotation;
    } else if (typeof this.rotation == 'function') {
      this.view.angle = this.rotation.bind(this)(timestamp);
    } else {
      this.view.angle = this.rotation.value(timestamp);
    }

    /**
     * Handle the opacity of the object
     */
    if (typeof this.alpha == 'number') {
      this.view.alpha = this.alpha;
    } else if (typeof this.alpha == 'function') {
      this.view.alpha = this.alpha.bind(this)(timestamp);
    } else {
      this.view.alpha = this.alpha.value(timestamp);
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
};