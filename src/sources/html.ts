/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from './source';
import { documentToSvgImageUrl } from './html.utils';
import { parseMimeType } from '../clips';
import { IOError } from '../errors';

import type { ClipType } from '../clips';

export class HtmlSource extends Source {
	public readonly type: ClipType = 'base';
	/**
	 * Access to the iframe that is required
	 * for extracting the html's dimensions
	 */
	public readonly iframe: HTMLIFrameElement;

	public constructor() {
		super();

		const iframe = document.createElement('iframe');

		iframe.style.position = "absolute";
		iframe.style.width = "0";
		iframe.style.height = "0";
		iframe.style.border = "0";
		iframe.style.visibility = 'hidden';

		document.body.appendChild(iframe);

		this.iframe = iframe;
	}

	/**
	 * Access to the html document as loaded
	 * within the iframe. Can be manipulated with
	 * javascript
	 */
	public get document(): Document | undefined {
		return this.iframe.contentWindow?.document;
	}

	public async createObjectURL(): Promise<string> {
		if (!this.file && this.state == 'LOADING') {
			await new Promise(this.resolve('load'));
		}

		if (this.objectURL) return this.objectURL;

		this.objectURL = documentToSvgImageUrl(this.document);

		return this.objectURL;
	}

	public async from(input: File | string, init?: RequestInit | undefined): Promise<this> {
		try {
			this.state = 'LOADING';

			if (input instanceof File) {
				this.name = input.name;
				this.mimeType = parseMimeType(input.type);
				this.external = false;
				this.file = input;
			} else {
				// case input is a request url
				const res = await fetch(input, init);

				if (!res?.ok) throw new IOError({
					i18n: 'unexpectedIOError',
					message: 'An unexpected error occurred while fetching the file',
				});

				const blob = await res.blob();
				this.name = input.toString().split('/').at(-1) ?? '';
				this.external = true;
				this.file = new File([blob], this.name, { type: blob.type });
				this.externalURL = input;
				this.mimeType = parseMimeType(blob.type);
			}

			this.iframe.setAttribute('src', URL.createObjectURL(this.file));

			await new Promise<void>((resolve, reject) => {
				this.iframe.onload = () => resolve();
				this.iframe.onerror = (e) => reject(e);
			});

			this.state = 'READY';
			this.trigger('load', undefined);
		} catch (e) {
			this.state = 'ERROR';
			this.trigger('error', new Error(String(e)));
			throw e;
		}

		return this;
	}

	/**
	 * Update the object url using the current
	 * contents of the iframe document
	 */
	public update() {
		// url has not been created yet
		if (!this.objectURL) return;

		this.objectURL = documentToSvgImageUrl(this.document);
	}

	public async thumbnail(): Promise<HTMLImageElement> {
		const image = new Image();
		image.src = await this.createObjectURL();
		image.className = 'object-contain w-full aspect-video h-auto';
		return image;
	}
}
