/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Source } from './source';
import type { ClipType } from '../clips';

export class ImageSource<T extends Object = {}> extends Source<T> {
	public readonly type: ClipType = 'image';

	public async thumbnail(): Promise<HTMLImageElement> {
		const image = new Image();
		image.src = await this.createObjectURL();
		image.className = 'object-cover w-full aspect-video h-auto';
		return image;
	}
}
