/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';

import type { MediaClip } from '../../clips';
import { Timestamp } from '../../models';
import { StackInsertStrategy } from '../track/track.strategies';

export class MediaTrack<Clip extends MediaClip> extends Track<MediaClip> {
	public clips: Clip[] = [];
	public async seek(time: Timestamp): Promise<void> {
		for (const clip of this.clips) {
			await clip.seek(time);
		}
	}

	/**
	 * Detect periods of silence across all clips in the track
	 *
	 * This currently only searches for silences in each clip individually
	 *
	 * @returns Array of silence periods with start and stop times in seconds
	 */
	public async removeSilences() {

		// Process each clip
		for (const clip of this.clips) {
			if (!clip.element) {
				continue;
			}

			const silences = await clip.source.silences({});
			if (silences.length === 0) {
				continue;
			}

			const applicableSilences = silences.filter(
				(silence) =>
					(silence.start.millis > clip.range[0].millis &&
						silence.start.millis < clip.range[1].millis) ||
					(silence.stop.millis < clip.range[1].millis &&
						silence.stop.millis > clip.range[0].millis),
			);
			if (applicableSilences.length === 0) {
				continue;
			}

			let start = clip.range[0];
            let currentClip = clip;

			for (const silence of applicableSilences) {
                if (silence.start.millis < start.millis) {
                    const newClip = await currentClip.split(silence.stop.add(currentClip.offset));
                    currentClip.detach();
                    start = silence.stop;
                    currentClip = newClip;
                    continue;
                }

                if (silence.stop.millis > currentClip.range[1].millis) {
                    currentClip = await currentClip.split(silence.start.add(currentClip.offset));
                    currentClip.detach();
                    continue;
                }
                
                const middleClip = await currentClip.split(silence.start.add(currentClip.offset));
                currentClip = await middleClip.split(silence.stop.add(middleClip.offset));
                middleClip.detach();
			}
		}
	}
}
