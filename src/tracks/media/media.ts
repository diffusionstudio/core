/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';
import { Timestamp } from '../../models';
import { SilenceDetectionOptions } from '../../sources';

import type { MediaClip } from '../../clips';

export class MediaTrack<Clip extends MediaClip> extends Track<MediaClip> {
	public clips: Clip[] = [];
	public async seek(time: Timestamp): Promise<void> {
		for (const clip of this.clips) {
			await clip.seek(time);
		}
	}

	/**
	 * Remove silences from all clips in the track
	 *
	 * @param options - Options for silence detection
	 */
	public async removeSilences(options: SilenceDetectionOptions = {}) {
		const clips: MediaClip[] = [];

		for (const clip of this.clips.map((clip) => clip.detach())) {
			clips.push(...(await clip.removeSilences(options)));
		}

		for (const clip of clips) {
			await this.add(clip);
		}
	}
}
