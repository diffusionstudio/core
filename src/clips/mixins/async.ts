/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from '../../sources';

import type { Constructor } from '../../types';
import type { ClipState } from '../clip';

type BaseClass = {
	state: ClipState;
};

export function AsyncMixin<T extends Constructor<BaseClass>>(Base: T) {
	return class extends Base {
		/**
		 * Access to the underlying element
		 */
		public declare element?:
			| HTMLAudioElement
			| HTMLVideoElement
			| HTMLImageElement
			| HTMLIFrameElement;

		public source = new Source();

		/**
		 * Add a new source to the clip
		 */
		public async load(input?: File | Source): Promise<this> {
			this.state = 'LOADING';

			if (input instanceof File) {
				this.source = await this.source.from(input);
				this.source.added = true;
			} else if (input instanceof Source && input.objectURL) {
				this.source = input;
				this.source.added = true;
			} else {
				console.warn('Invalid source has been provided');
				return this;
			}

			this.source.trigger('update', undefined);
			this.element?.setAttribute('src', this.source.objectURL!);

			return this;
		}
	};
}
