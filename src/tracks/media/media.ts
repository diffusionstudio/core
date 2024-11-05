/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Track } from '../track';

import type { MediaClip } from '../../clips';
import type { Timestamp } from '../../models';

export class MediaTrack<Clip extends MediaClip> extends Track<MediaClip> {
	public clips: Clip[] = [];
	public async seek(time: Timestamp): Promise<void> {
		for (const clip of this.clips) {
			await clip.seek(time);
		}
	}

	/**
     * Detect periods of silence across all clips in the track
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
            const channelData = audioBuffer.getChannelData(0);

            // Process samples in chunks
            const sampleSize = subSample;
            const numChunks = Math.floor(channelData.length / sampleSize);
            const minSilenceChunks = Math.floor(minSilenceDuration * audioBuffer.sampleRate / subSample);
            
            const decibelValues: number[] = [];
            
            for (let i = 0; i < numChunks; i++) {
                const chunk = channelData.slice(i * sampleSize, (i + 1) * sampleSize);
                const rms = Math.sqrt(chunk.reduce((sum, val) => sum + val * val, 0) / chunk.length);
                const db = 20 * Math.log10(Math.max(rms, 1e-10));
                decibelValues.push(db);
            }

            // Find silence periods in this clip
            let silenceStart: number | null = null;
            
            for (let i = 0; i < decibelValues.length; i++) {
                if (decibelValues[i] < silenceThreshold) {
                    if (silenceStart === null) {
                        silenceStart = i;
                    }
                } else if (silenceStart !== null) {
                    const silenceDuration = i - silenceStart;
                    if (silenceDuration >= minSilenceChunks) {
                        // Convert chunk indices to seconds and adjust for clip offset
                        const silenceStartTime = (silenceStart * sampleSize) / audioBuffer.sampleRate;
                        const silenceStopTime = (i * sampleSize) / audioBuffer.sampleRate;
                        
                        silences.push({
                            start: silenceStartTime + clip.start.seconds,
                            stop: silenceStopTime + clip.start.seconds
                        });
                    }
                    silenceStart = null;
                }
            }

            // Handle silence at end of clip
            if (silenceStart !== null) {
                const silenceDuration = decibelValues.length - silenceStart;
                if (silenceDuration >= minSilenceChunks || silenceDuration == decibelValues.length) {
                    silences.push({
                        start: (silenceStart * sampleSize) / audioBuffer.sampleRate + clip.start.seconds,
                        stop: audioBuffer.duration + clip.start.seconds
                    });
                }
            }
        }

        await audioContext.close();

        // Sort silences by start time and merge overlapping periods
        silences.sort((a, b) => a.start - b.start);
        const mergedSilences: typeof silences = [];
        
        for (const silence of silences) {
            if (mergedSilences.length === 0) {
                mergedSilences.push(silence);
                continue;
            }

            const lastSilence = mergedSilences[mergedSilences.length - 1];
            if (silence.start <= lastSilence.stop) {
                // Merge overlapping silence periods
                lastSilence.stop = Math.max(lastSilence.stop, silence.stop);
            } else {
                mergedSilences.push(silence);
            }
        }

        return mergedSilences;
    }
