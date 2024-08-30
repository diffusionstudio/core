/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';

import type { frame } from '../../types';
import type { MediaClip } from '../../clips';

export class MediaTrack<Clip extends MediaClip> extends Track<MediaClip> {
	public clips: Clip[] = [];
	public async seek(frame: frame): Promise<void> {
		for (const clip of this.clips) {
			await clip.seek(frame);
		}
	}
}
