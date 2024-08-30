/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { MediaTrack } from '../media';
import type { VideoClip } from '../../clips';

export class VideoTrack extends MediaTrack<VideoClip> {
	public readonly type = 'VIDEO';
}
