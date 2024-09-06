/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from './source';
import { documentToSvgImageUrl } from './html.utils';

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
		if (this.objectURL) return this.objectURL;

		this.iframe.setAttribute('src',
			URL.createObjectURL(await this.getFile())
		);

		await new Promise<void>((resolve, reject) => {
			this.iframe.onload = () => resolve();
			this.iframe.onerror = (e) => reject(e);
		});

		this.objectURL = documentToSvgImageUrl(this.document);

		return this.objectURL;
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
