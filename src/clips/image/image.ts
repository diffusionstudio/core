/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Sprite, Texture } from 'pixi.js';
import { ImageSource } from '../../sources';
import { Clip } from '../clip';
import { VisualMixin, visualize } from '../mixins';
import { IOError } from '../../errors';

import type { Track } from '../../tracks';
import type { ImageClipProps } from './image.interfaces';
import type { Timestamp } from '../../models';

export class ImageClip extends VisualMixin(Clip<ImageClipProps>) {
	public readonly type = 'image';
	public declare track?: Track<ImageClip>;
	public readonly element = new Image();
	public source = new ImageSource();

	/**
	 * Access to the sprite containing the image texture
	 */
	public readonly sprite = new Sprite();

	public constructor(source?: File | ImageSource, props: ImageClipProps = {}) {
		super();

		this.view.addChild(this.sprite);

		if (source instanceof ImageSource) {
			this.source = source;
		}

		if (source instanceof File) {
			this.source.from(source);
		}

		Object.assign(this, props);
	}

	public async init(): Promise<void> {
		this.element.setAttribute('src', await this.source.createObjectURL());

		await new Promise<void>((resolve, reject) => {
			this.element.onload = () => {
				this.sprite.texture = Texture.from(this.element);
				this.state = 'READY';
				resolve();
			}
			this.element.onerror = (e) => {
				console.error(e);
				this.state = 'ERROR';
				reject(new IOError({
					code: 'sourceNotProcessable',
					message: 'An error occurred while processing the input medium.',
				}));
			}
		});
	}

	@visualize
	public update(_: Timestamp): void | Promise<void> { }

	public copy(): ImageClip {
		const clip = ImageClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.source = this.source;

		return clip;
	}
}
