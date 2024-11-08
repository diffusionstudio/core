import { Timestamp } from '../models';

/**
 * Find the silences in an audio clip.
 * @param samples - The sub-sampled samples of the audio clip.
 * @param threshold - The threshold to use for the silence detection in db.
 * @param minDuration - The minimum duration of a silence to be considered a silence in milliseconds.
 * @param duration - The length of the audio clip in milliseconds.
 * @returns An array of the silences in the clip.
 */
export function findSilences(
	samples: Float32Array,
	threshold: number,
	minDuration: number,
	duration: number,
): { start: Timestamp; stop: Timestamp }[] {
	const decibelValues = samples.map((sample) => 20 * Math.log10(Math.max(Math.abs(sample), 1e-10)));
	const silences: { start: Timestamp; stop: Timestamp }[] = [];

	// Find silence periods in this clip
	let silenceStart: number | null = null;

	for (let i = 0; i < decibelValues.length; i++) {
		if (decibelValues[i] < threshold) {
			if (silenceStart === null) {
				silenceStart = i;
			}
		} else if (silenceStart !== null) {
			const silenceDuration = ((i - silenceStart) * duration) / decibelValues.length;
			if (silenceDuration >= minDuration) {
				// Convert chunk indices to seconds and adjust for clip offset
				const silenceStartFrame = Math.round((silenceStart * duration) / decibelValues.length);
				const silenceStopFrame = Math.round((i * duration) / decibelValues.length);

				silences.push({
					start: new Timestamp(silenceStartFrame),
					stop: new Timestamp(silenceStopFrame),
				});
			}
			silenceStart = null;
		}
	}

	// Handle silence at end of clip
	if (silenceStart !== null) {
		const silenceDuration = decibelValues.length - silenceStart;
		if (silenceDuration >= minDuration || silenceDuration == decibelValues.length) {
			silences.push({
				start: new Timestamp(Math.round((silenceStart * duration) / decibelValues.length)),
				stop: new Timestamp(duration),
			});
		}
	}

	return silences;
}
