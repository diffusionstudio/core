/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { serializable } from '../../services';
import * as deserializers from './visual.deserializers';
import { Keyframe } from '../../models';
import { Sprite } from 'pixi.js';

import type { Serializer } from '../../services';
import type { Container, Filter } from 'pixi.js';
import type { Constructor, float, int, Anchor, Position, Scale, Translate2D, Percent } from '../../types';

type BaseClass = { container: Container } & Serializer;

export function VisualMixin<T extends Constructor<BaseClass>>(Base: T) {
	class Mixin extends Base {
		@serializable(deserializers.Deserializer1D)
		public _height?: int | Keyframe<int> | Percent;

		@serializable(deserializers.Deserializer1D)
		public _width?: int | Keyframe<int> | Percent;

		@serializable(deserializers.Deserializer2D)
		public _position: Position = {
			x: this.container.position.x,
			y: this.container.position.y,
		}

		@serializable(deserializers.Deserializer2D)
		public _scale?: Scale;

		/**
		 * Apply one or more `Pixi.js` filters to the clip. 
		 * @example 
		 */
		public filters?: Filter | Filter[];

		/**
		 * Defines the rotation of the clip in degrees
		 * @default 0
		 * @example 90
		 */
		@serializable(deserializers.Deserializer1D)
		public rotation: number | Keyframe<number> = this.container.angle;

		/**
		 * Defines the opacity of the clip as a number
		 * between 0 and 1
		 * @default 1
		 */
		@serializable(deserializers.Deserializer1D)
		public alpha: number | Keyframe<number> = 1;

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
				x: this.container.scale.x,
				y: this.container.scale.y,
			}
		}

		public set scale(value: Scale | float | Keyframe<number>) {
			if (typeof value == 'number' || value instanceof Keyframe) {
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
		public get x(): int | Keyframe<int> | Percent {
			return this._position.x;
		}

		public set x(value: int | Keyframe<int> | Percent) {
			this._position.x = value;
		}

		/**
		 * The position of the clip on the y axis. An alias to position.y
		 * @default 0
		 */
		public get y(): int | Keyframe<int> | Percent {
			return this._position.y;
		}

		public set y(value: int | Keyframe<int> | Percent) {
			this._position.y = value;
		}

		/**
		 * The height of the clip/container
		 */
		public get height(): Keyframe<int> | Percent | int {
			return this._height ?? this.container.height;
		}

		public set height(value: Keyframe<int> | Percent | int) {
			this._height = value;
		}

		/**
		 * The width of the clip/container
		 */
		public get width(): Keyframe<int> | Percent | int {
			return this._width ?? this.container.width;
		}

		public set width(value: Keyframe<int> | Percent | int) {
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
			if (this.container.children[0] instanceof Sprite) {
				return {
					x: this.container.children[0].anchor.x,
					y: this.container.children[0].anchor.y,
				};
			}
			return { x: 0, y: 0 }
		}

		public set anchor(value: Anchor | float) {
			const anchor = typeof value == 'number' ? { x: value, y: value } : value;

			for (const child of this.container.children) {
				if (child instanceof Sprite) {
					child.anchor.set(anchor.x, anchor.y);
				}
			}
		}

		public unrender(): void {
			if (this.filters && this.container.filters) {	// @ts-ignore
				this.container.filters = null;
			}
		}
	}

	return Mixin;
}
