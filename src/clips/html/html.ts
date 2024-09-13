/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { HtmlSource } from '../../sources';
import { Clip } from '../clip';
import { VisualMixin, visualize } from '../mixins';
import { Sprite, Texture } from 'pixi.js';
import { IOError } from '../../errors';

import type { Track } from '../../tracks';
import type { HtmlClipProps } from './html.interfaces';
import type { Timestamp } from '../../models';

export class HtmlClip extends VisualMixin(Clip<HtmlClipProps>) {
	public readonly type = 'html';
	public declare track?: Track<HtmlClip>;
	public source = new HtmlSource();

	/**
	 * Access to the html document that
	 * will be rendered to the canvas
	 */
	public readonly element = new Image();
	public readonly canvas = document.createElement('canvas');
	public readonly context = this.canvas.getContext('2d')!;

	/**
	 * Access to the sprite containing the canvas
	 */
	public readonly sprite = new Sprite();

	public constructor(source?: File | HtmlSource, props: HtmlClipProps = {}) {
		super();
		this.view.addChild(this.sprite);

		Object.assign(this, props);

		if (source instanceof HtmlSource) {
			this.source = source;
		}

		if (source instanceof File) {
			this.source.from(source);
		}

		this.element.addEventListener('load', () => {
			const width = this.source.document?.body?.scrollWidth;
			const height = this.source.document?.body?.scrollHeight;
			if (!width || !height) return;

			this.canvas.width = width;
			this.canvas.height = height;

			this.context.imageSmoothingEnabled = false;
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.drawImage(this.element, 0, 0);

			this.sprite.texture = Texture.from(this.canvas, true);

			this.trigger('load', undefined);
		});

		this.element.addEventListener('error', (e) => {
			console.error(e);
			this.state = 'ERROR';
			this.trigger('error', new IOError({
				code: 'sourceNotProcessable',
				message: 'An error occurred while processing the input medium.',
			}));
			if (this.track) this.detach();
		});

		this.on('update', async () => {
			this.source.update();
			this.element.setAttribute('src', await this.source.createObjectURL());
		});
	}

	public async init(): Promise<void> {
		this.element.setAttribute('src', await this.source.createObjectURL());

		await new Promise<void>((resolve, reject) => {
			this.element.onload = () => {
				const width = this.source.document?.body?.scrollWidth;
				const height = this.source.document?.body?.scrollHeight;

				if (!width || !height) {
					return reject(new IOError({
						code: 'sourceNotProcessable',
						message: 'Cannot display source with height or width at 0',
					}))
				}

				this.state = 'READY';
				resolve();
			}
			this.element.onerror = (e) => {
				console.error(e);
				reject(new IOError({
					code: 'sourceNotProcessable',
					message: 'An error occurred while processing the input medium.',
				}));
			}
		});
	}

	@visualize
	public update(_: Timestamp): void | Promise<void> { }

	public copy(): HtmlClip {
		const clip = HtmlClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.source = this.source;

		return clip;
	}
}
