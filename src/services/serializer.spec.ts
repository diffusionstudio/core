/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { Serializer, serializable } from './serializer';

import type { Constructor } from '../types';

class Base extends Serializer {
	@serializable()
	name: string;

	constructor(name: string = '') {
		super();
		this.name = name;
	}
}

class Texture extends Base {
	private _width = 0;

	@serializable()
	get width() {
		return this._width;
	}

	set width(value: number) {
		this._width = value;
	}

	@serializable()
	height = 0;

	@serializable()
	data = [0, 4, 8];

	visibilty = false;
}

// This mixin adds a scale property, with getters and setters
// for changing it with an encapsulated private property:
function Scale<TBase extends Constructor>(Base: TBase) {
	class Scaling extends Base {
		_scale = 1;

		set scale(scale: number) {
			this._scale = scale;
		}

		get scale(): number {
			return this._scale;
		}
	}

	serializable()(Scaling.prototype, 'scale');

	return Scaling;
}

class Sprite extends Scale(Base) {
	@serializable()
	x = 0;

	// let's not use it here
	y = 0;

	@serializable(Texture)
	texture: Texture | undefined;
}

describe('The Serializer Object', () => {
	it('should be able to serialize all flagged properties', () => {
		const texture = new Texture('image.png');
		const data = JSON.parse(JSON.stringify(texture));

		expect(data.name).toBe('image.png');
		expect(data.width).toBe(0);
		expect(data.height).toBe(0);
		expect(data.data.join()).toBe('0,4,8');
		expect(data.visibilty).not.toBeDefined();
	});

	it('should be able to serialize all changed properties', () => {
		const texture = new Texture('image.png');

		texture.width = 20;
		texture.height = 40;
		texture.data.pop();

		const data = JSON.parse(JSON.stringify(texture));
		expect(data.name).toBe('image.png');
		expect(data.width).toBe(20);
		expect(data.height).toBe(40);
		expect(data.data.join()).toBe('0,4');
	});

	it('should be able to serialize all mixin properties', () => {
		const ScaledTexture = Scale(Texture);
		const texture = new ScaledTexture('image.png');

		texture.width = 20;
		texture.height = 40;
		texture.scale = 4;

		const data = JSON.parse(JSON.stringify(texture));
		expect(data.name).toBe('image.png');
		expect(data.width).toBe(20);
		expect(data.height).toBe(40);
		expect(data.scale).toBe(4);
	});

	it('should be able to deserialize all flagged properties', () => {
		const json = JSON.stringify(new Texture('image.png'));
		const texture = Texture.fromJSON(JSON.parse(json));

		expect(texture).toBeInstanceOf(Texture);
		expect(texture.name).toBe('image.png');
		expect(texture.width).toBe(0);
		expect(texture.height).toBe(0);
		expect(texture.data.join()).toBe('0,4,8');
		expect(texture.visibilty).toBe(false);
	});

	it('should be able to deserialize all changed properties', () => {
		const _texture = new Texture();

		_texture.width = 20;
		_texture.height = 40;
		_texture.data.pop();
		_texture.visibilty = true;

		const texture = Texture.fromJSON(JSON.parse(JSON.stringify(_texture)));

		expect(texture).toBeInstanceOf(Texture);
		expect(texture.name).toBe('');
		expect(texture.width).toBe(20);
		expect(texture.height).toBe(40);
		expect(texture.data.join()).toBe('0,4');
		expect(texture.visibilty).toBe(false);
	});

	it('should be able to serialize all mixin properties', () => {
		const ScaledTexture = Scale(Texture);
		const _texture = new ScaledTexture('image.jpg');

		_texture.width = 20;
		_texture.height = 40;
		_texture.scale = 4;

		const texture = ScaledTexture.fromJSON(JSON.parse(JSON.stringify(_texture)));

		expect(texture).toBeInstanceOf(ScaledTexture);
		expect(texture.name).toBe('image.jpg');
		expect(texture.width).toBe(20);
		expect(texture.height).toBe(40);
		expect(texture.scale).toBe(4);
	});

	it('should be able to serialize + deserialize objects with nested serializers', () => {
		const sprite0 = new Sprite();

		const data0 = JSON.parse(JSON.stringify(sprite0));

		expect(data0.x).toBe(0);
		expect(data0.y).not.toBeDefined();
		expect(data0.texture).toBe(undefined);

		const sprite1 = Sprite.fromJSON(JSON.parse(JSON.stringify(sprite0)));

		expect(sprite1).toBeInstanceOf(Sprite);
		expect(sprite1.x).toBe(0);
		expect(sprite1.y).toBe(0);
		expect(sprite1.texture).toBe(undefined);

		sprite1.x = 60;
		sprite1.y = 50;
		sprite1.texture = new Texture('video.mp4');
		sprite1.texture.height = 70;
		sprite1.texture.width = 80;

		const data1 = JSON.parse(JSON.stringify(sprite1));

		expect(data1.x).toBe(60);
		expect(data1.y).not.toBeDefined();
		expect(data1.texture).toBeDefined();
		expect(data1.texture.height).toBe(70);
		expect(data1.texture.width).toBe(80);
		expect(data1.texture.name).toBe('video.mp4');
		expect(data1.texture.visibilty).not.toBeDefined();

		const sprite2 = Sprite.fromJSON(JSON.parse(JSON.stringify(sprite1)));

		expect(sprite2).toBeInstanceOf(Sprite);
		expect(sprite2.x).toBe(60);
		expect(sprite2.y).toBe(0);
		expect(sprite2.texture).toBeInstanceOf(Texture);
		expect(sprite2.texture?.height).toBe(70);
		expect(sprite2.texture?.width).toBe(80);
		expect(sprite2.texture?.name).toBe('video.mp4');
		expect(sprite2.texture?.visibilty).toBe(false);
	});
});
