/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';

import type { MediaClip, MediaClipProps } from '../../clips';
import { Timestamp } from '../../models';
import { SilenceOptions } from '../../sources';

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
	public async removeSilences(options: SilenceOptions = {}) {
		const numClips = this.clips.length;

		let newClips: MediaClip<MediaClipProps>[] = [];
		let clipsToDetach: MediaClip<MediaClipProps>[] = [];
		// Process each clip
		for (let i = 0; i < numClips; i++) {
			const clip = this.clips[i];
			if (!clip.element) {
				continue;
			}

			const silences = await clip.source.silences(options);
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

			clipsToDetach.push(clip);
			let start = clip.range[0];
            let currentClip = clip.copy();

			for (const silence of applicableSilences) {
				if (silence.start.millis <= start.millis) {
					start = silence.stop;
					currentClip.range[0] = silence.stop;
                    continue;
                }

                if (silence.stop.millis >= currentClip.range[1].millis) {
					currentClip.range[1] = silence.start;
					start = silence.stop;
					newClips.push(currentClip);
                    continue;
                }
                const middleClip = currentClip.copy();
				middleClip.range[0] = silence.stop;

                currentClip.range[1] = silence.start;
				newClips.push(currentClip);	

				currentClip = middleClip;
			}
			if (currentClip.id !== newClips.at(-1)?.id) {
				newClips.push(currentClip);
			}
		}
		clipsToDetach.forEach((clip) => clip.detach());
		const promises = newClips.map((clip) => this.add(clip));
		await Promise.all(promises);
	}
}
