/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from './source';
import type { ClipType } from '../clips';

export class ImageSource extends Source {
	public readonly type: ClipType = 'base';

	public async thumbnail(): Promise<HTMLImageElement> {
		await this.loaded();
		const image = new Image();
		image.src = this.objectURL ?? '';
		image.className = 'object-cover w-full aspect-video h-auto';
		return image;
	}
}
