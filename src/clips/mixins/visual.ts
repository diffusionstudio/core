/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { serializable } from '../../services';
import * as deserializers from './visual.deserializers';
import { createAnimationBuilder } from '../../models/animation-builder';
import { AnimationBuilder } from './visual.animation';
import { Keyframe } from '../../models';
import { Sprite } from 'pixi.js';

import type { Serializer } from '../../services';
import type { Container, Filter } from 'pixi.js';
import type { Constructor, float, int, Anchor, Position, Scale, Translate2D, Percent, NumberCallback } from '../../types';

type BaseClass = { view: Container } & Serializer;

export function VisualMixin<T extends Constructor<BaseClass>>(Base: T) {
	class Mixin extends Base {
		/**
		 * Apply one or more `Pixi.js` filters to the clip. 
		 * @example 
		 * clip.filters = [new BlurFilter()];
		 */
		public filters?: Filter | Filter[];

		@serializable(deserializers.Deserializer1D)
		public _height?: int | Keyframe<int> | Percent | NumberCallback;

		@serializable(deserializers.Deserializer1D)
		public _width?: int | Keyframe<int> | Percent | NumberCallback;

		@serializable(deserializers.Deserializer2D)
		public _position: Position = {
			x: this.view.position.x,
			y: this.view.position.y,
		}

		@serializable(deserializers.Deserializer2D)
		public _scale?: Scale;

		/**
		 * Defines the rotation of the clip in degrees
		 * @default 0
		 * @example 90
		 */
		@serializable(deserializers.Deserializer1D)
		public rotation: number | Keyframe<number> | NumberCallback = this.view.angle;

		/**
		 * Defines the opacity of the clip as a number
		 * between 0 and 1
		 * @default 1
		 */
		@serializable(deserializers.Deserializer1D)
		public alpha: number | Keyframe<number> | NumberCallback = 1;

		/**
		 * 2D position offset of the clip.
		 * @default { x: 0, y: 0 }
		 */
		@serializable(deserializers.Deserializer2D)
		public translate: Translate2D = { x: 0, y: 0 }

		/**
		 * The coordinate of the object relative to the local coordinates of the parent.
		 * @default { x: 0, y: 0 }
		 */
		public get position(): Position {
			return this._position;
		}

		public set position(value: Position | 'center') {
			if (typeof value == 'string') {
				this._position = { x: '50%', y: '50%' }
				this.anchor = { x: 0.5, y: 0.5 }
			} else {
				this._position = value;
			}
		}

		/**
		 * The scale factors of this object along the local coordinate axes.
		 * Will be added to the scale applied by setting height and/or width
		 * @default { x: 1, y: 1 }
		 */
		public get scale(): Scale {
			return this._scale ?? {
				x: this.view.scale.x,
				y: this.view.scale.y,
			}
		}

		public set scale(value: Scale | float | Keyframe<number> | NumberCallback) {
			if (typeof value == 'number' || value instanceof Keyframe || typeof value == 'function') {
				this._scale = { x: value, y: value }
			} else {
				this._scale = value
			}
		}

		/**
		 * The position of the clip on the x axis relative. 
		 * An alias to position.x
		 * @default 0
		 */
		public get x(): int | Keyframe<int> | Percent | NumberCallback {
			return this._position.x;
		}

		public set x(value: int | Keyframe<int> | Percent | NumberCallback) {
			this._position.x = value;
		}

		/**
		 * The position of the clip on the y axis. An alias to position.y
		 * @default 0
		 */
		public get y(): int | Keyframe<int> | Percent | NumberCallback {
			return this._position.y;
		}

		public set y(value: int | Keyframe<int> | Percent | NumberCallback) {
			this._position.y = value;
		}

		/**
		 * Offset relative to the x position
		 * @default 0
		 */
		public get translateX(): int | Keyframe<int> | NumberCallback {
			return this.translate.x;
		}

		public set translateX(value: int | Keyframe<int> | NumberCallback) {
			this.translate.x = value;
		}

		/**
		 * Offset relative to the y position
		 * @default 0
		 */
		public get translateY(): int | Keyframe<int> | NumberCallback {
			return this.translate.y;
		}

		public set translateY(value: int | Keyframe<int> | NumberCallback) {
			this.translate.y = value;
		}

		/**
		 * The height of the clip/container
		 */
		public get height(): Keyframe<int> | Percent | int | NumberCallback {
			return this._height ?? this.view.height;
		}

		public set height(value: Keyframe<int> | Percent | int | NumberCallback) {
			this._height = value;
		}

		/**
		 * The width of the clip/container
		 */
		public get width(): Keyframe<int> | Percent | int | NumberCallback {
			return this._width ?? this.view.width;
		}

		public set width(value: Keyframe<int> | Percent | int | NumberCallback) {
			this._width = value;
		}

		/**
		* The anchor sets the origin point of the clip. Setting the anchor to (0.5,0.5) 
		* means the clips' origin is centered. Setting the anchor to (1,1) would mean 
		* the clips' origin point will be the bottom right corner. If you pass only 
		* single parameter, it will set both x and y to the same value.
		*/
		@serializable()
		public get anchor(): Anchor {
			if (this.view.children[0] instanceof Sprite) {
				return {
					x: this.view.children[0].anchor.x,
					y: this.view.children[0].anchor.y,
				};
			}
			return { x: 0, y: 0 }
		}

		public set anchor(value: Anchor | float) {
			const anchor = typeof value == 'number' ? { x: value, y: value } : value;

			for (const child of this.view.children) {
				if (child instanceof Sprite) {
					child.anchor.set(anchor.x, anchor.y);
				}
			}
		}

		public enter(): void {
			if (this.filters && !this.view.filters) {
				this.view.filters = this.filters;
			}
		}

		public exit(): void {
			if (this.filters && this.view.filters) {
				this.view.filters = null as any;
			}
		}

		public animate() {
			return createAnimationBuilder(
				new AnimationBuilder(this)
			);
		}
	}

	return Mixin;
}
