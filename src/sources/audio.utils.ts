import { Timestamp } from '../models';

import type { AudioSlice, SilenceDetectionOptions } from './audio.types';


/**
 * Detect silences in an audio buffer
 * @param audioBuffer - The web audio buffer.
 * @param options - Options for silence detection
 */
export function detectSilences(
	audioBuffer: AudioBuffer,
	options: SilenceDetectionOptions = {}
): AudioSlice[] {
	const { threshold = 0.02, hopSize = 1024, minDuration = 500 } = options;

	const slices: AudioSlice[] = [];
	const channel = audioBuffer.getChannelData(0);
	const sampleRate = audioBuffer.sampleRate;

	// Convert minDuration from milliseconds to samples
	const minSamples = Math.floor((minDuration / 1000) * sampleRate);

	let silenceStart: number | null = null;
	let consecutiveSilentSamples = 0;

	// Process audio in frames
	for (let i = 0; i < channel.length; i += hopSize) {
		// Calculate RMS for current frame
		let rms = 0;
		const frameEnd = Math.min(i + hopSize, channel.length);

		for (let j = i; j < frameEnd; j++) {
			rms += channel[j] * channel[j];
		}
		rms = Math.sqrt(rms / (frameEnd - i));

		// Check if frame is silent
		if (rms < threshold) {
			consecutiveSilentSamples += hopSize;
			if (silenceStart === null) {
				silenceStart = i;
			}
		} else {
			// If we had a silence of sufficient duration, add it to slices
			if (silenceStart !== null && consecutiveSilentSamples >= minSamples) {
				slices.push({
					start: Timestamp.fromSeconds(silenceStart / sampleRate),
					stop: Timestamp.fromSeconds(i / sampleRate)
				});
			}
			silenceStart = null;
			consecutiveSilentSamples = 0;
		}
	}

	// Handle silence at the end of audio
	if (silenceStart !== null && consecutiveSilentSamples >= minSamples) {
		slices.push({
			start: Timestamp.fromSeconds(silenceStart / sampleRate),
			stop: Timestamp.fromSeconds(channel.length / sampleRate)
		});
	}

	return slices;
}
