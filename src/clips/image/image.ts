/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Sprite, Texture } from 'pixi.js';
import { ImageSource } from '../../sources';
import { Clip, toggle } from '../clip';
import { VisualMixin, AsyncMixin, visualize } from '../mixins';

import type { Renderer } from 'pixi.js';
import type { Track } from '../../tracks';
import type { ImageClipProps } from './image.interfaces';

export class ImageClip extends VisualMixin(AsyncMixin(Clip<ImageClipProps>)) {
	public readonly type = 'IMAGE';
	public declare track?: Track<ImageClip>;
	public readonly element = new Image();
	public readonly source = new ImageSource();

	/**
	 * Access to the sprite containing the image texture
	 */
	public readonly sprite = new Sprite();

	public constructor(source?: File | ImageSource, props: ImageClipProps = {}) {
		super();

		this.container.addChild(this.sprite);

		this.element.addEventListener('load', () => {
			if (['READY', 'ATTACHED'].includes(this.state)) return;

			this.sprite.texture = Texture.from(this.element);

			this.state = 'READY';

			this.trigger('load', undefined);
		});

		this.element.addEventListener('emptied', () => {
			this.state = 'IDLE';
			if (this.track) this.detach();
		});

		this.element.addEventListener('error', (e) => {
			console.error(e);
			this.state = 'ERROR';
			if (this.track) this.detach();
			this.trigger('error', new Error('An error occurred while processing the input medium.'));
		});

		this.load(source);
		Object.assign(this, props);
	}

	@toggle
	@visualize
	public render(renderer: Renderer, _: number): void | Promise<void> {
		renderer.render({ container: this.container, clear: false });
	}

	public async connect(track: Track<ImageClip>): Promise<void> {
		if (['LOADING', 'IDLE'].includes(this.state)) {
			await new Promise(this.resolve('load'));
		};

		this.track = track;
		this.state = 'ATTACHED';

		this.trigger('attach', undefined);
	}

	public copy(): ImageClip {
		const clip = ImageClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.load(this.source);

		return clip;
	}
}
