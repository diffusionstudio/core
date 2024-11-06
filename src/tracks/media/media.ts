/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';

import type { MediaClip } from '../../clips';
import type { Timestamp } from '../../models';
import { getSilenceArrayBuffer } from './media.utils';

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
     * @param subSample Number of samples to skip when analyzing audio (higher = faster but less accurate)
     * @param silenceThreshold Volume threshold in dB below which is considered silence
     * @param minSilenceDuration Minimum duration in seconds for a silence period to be included
     * @returns Array of silence periods with start and stop times in seconds
     */
    public async detectSilences(
        subSample: number = 1000,
        silenceThreshold: number = -10, 
        minSilenceDuration: number = 0.1
    ): Promise<{ start: number; stop: number }[]> {
        const silences: { start: number; stop: number }[] = [];
        const audioContext = new AudioContext();

        // Process each clip
        for (const clip of this.clips) {
            if (!clip.element) {
                continue;
            }

            // Get audio data for this clip
            const arrayBuffer = await (await clip.source.getFile()).arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			silences.push(...getSilenceArrayBuffer(audioBuffer, subSample, minSilenceDuration, silenceThreshold, clip.start.seconds));
            
        }

        await audioContext.close();

        return silences.sort((a, b) => a.start - b.start);
    }
}