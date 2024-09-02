/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { HtmlSource } from '../../sources';
import { Clip, toggle } from '../clip';
import { VisualMixin, AsyncMixin, visualize } from '../mixins';
import { Sprite, Texture } from 'pixi.js';

import type { Track } from '../../tracks';
import type { Renderer } from 'pixi.js';
import type { HtmlClipProps } from './html.interfaces';

export class HtmlClip extends VisualMixin(AsyncMixin(Clip<HtmlClipProps>)) {
	public readonly type = 'html';
	public declare track?: Track<HtmlClip>;
	public readonly source = new HtmlSource();

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
		this.context.imageSmoothingEnabled = false;

		this.container.addChild(this.sprite);

		this.element.addEventListener('load', () => {
			this.canvas.width = this.source.document?.body?.scrollWidth ?? 0;
			this.canvas.height = this.source.document?.body?.scrollHeight ?? 0;

			this.context.drawImage(this.element, 0, 0);

			this.sprite.texture = Texture.from(this.canvas, true);

			if (this.state != 'ATTACHED') {
				this.state = 'READY';
			}

			this.trigger('load', undefined);
		});

		this.element.addEventListener('error', (e) => {
			console.error(e);
			this.state = 'ERROR';
			if (this.track) this.detach();
			this.trigger('error', new Error('An error occurred while processing the input medium.'));
		});

		this.source.iframe.addEventListener('error', (e) => {
			console.error(e);
			this.state = 'ERROR';
			if (this.track) this.detach();
			this.trigger('error', new Error('An error occurred while processing the input medium.'));
		});

		this.on('update', () => {
			this.source.update();
			this.element.setAttribute('src', this.source.objectURL ?? '');
		});

		// make sure the source will be loaded with
		// the most recent state
		if(source instanceof HtmlSource) source.update();
		this.load(source);
		Object.assign(this, props);
	}

	@toggle
	@visualize
	public render(renderer: Renderer, _: number): void | Promise<void> {
		renderer.render({ container: this.container, clear: false });
	}

	public async connect(track: Track<HtmlClip>): Promise<void> {
		if (['LOADING', 'IDLE'].includes(this.state)) {
			await new Promise(this.resolve('load'));
		};

		this.track = track;
		this.state = 'ATTACHED';

		this.trigger('attach', undefined);
	}

	public copy(): HtmlClip {
		const clip = HtmlClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.load(this.source);

		return clip;
	}
}
