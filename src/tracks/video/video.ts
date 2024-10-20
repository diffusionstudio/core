/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { MediaTrack } from '../media';
import { Timestamp } from '../../models';

import type { VideoClip } from '../../clips';

export class VideoTrack extends MediaTrack<VideoClip> {
	public readonly type = 'video';

	public async seek(time: Timestamp): Promise<void> {
		if (this.composition?.rendering) {
			// ensures that 'enter' method will be called again
			this.view.removeChildren();
		} else {
			super.seek(time);
		}
	}
}
