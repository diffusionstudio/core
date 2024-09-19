/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

/**
 * Converts an AudioBuffer to a Float32Array.
 * For 2 channels it will result in something like:
 * [L[0], R[0], L[1], R[1], ... , L[n], R[n]]
 */
export function interleave(input: AudioBuffer): Float32Array {
	if (input.numberOfChannels === 1) {
		// No need to interleave channels, just return single channel data to save performance and memory
		return input.getChannelData(0);
	}
	const channels = [];
	for (let i = 0; i < input.numberOfChannels; i++) {
		channels.push(input.getChannelData(i));
	}

	const maxLength = Math.max(...channels.map(channelData => channelData.length));
	const result = new Float32Array(maxLength * input.numberOfChannels);

	let index = 0;
	let inputIndex = 0;

	// for 2 channels its like: [L[0], R[0], L[1], R[1], ... , L[n], R[n]]
	while (inputIndex < maxLength) {
		channels.forEach((channelData) => {
			result[index++] = channelData[inputIndex] !== undefined ? channelData[inputIndex] : 0;
		});
		inputIndex++;
	}

	return result;
}

/**
 * Writes a string to a DataView at the specified offset.
 */
function stringToDataView(dataview: DataView, offset: number, header: string): void {
	for (let i = 0; i < header.length; i++) {
		dataview.setUint8(offset + i, header.charCodeAt(i));
	}
}

/**
 * Converts a Float32Array to 16-bit PCM.
 */
export function floatTo16BitPCM(
	dataview: DataView,
	buffer: Float32Array,
	offset: number,
): DataView {
	for (let i = 0; i < buffer.length; i++, offset += 2) {
		const tmp = Math.max(-1, Math.min(1, buffer[i]));
		dataview.setInt16(offset, tmp < 0 ? tmp * 0x8000 : tmp * 0x7fff, true);
	}
	return dataview;
}

/**
 * Writes the WAV headers for the specified Float32Array.
 *
 * Returns a DataView containing the WAV headers and file content.
 */
function writeWavHeaders(
	buffer: Float32Array,
	numOfChannels: number,
	sampleRate: number,
): DataView {
	const bitDepth = 16;
	const bytesPerSample = bitDepth / 8;
	const sampleSize = numOfChannels * bytesPerSample;

	const fileHeaderSize = 8;
	const chunkHeaderSize = 36;
	const chunkDataSize = buffer.length * bytesPerSample;
	const chunkTotalSize = chunkHeaderSize + chunkDataSize;

	const arrayBuffer = new ArrayBuffer(fileHeaderSize + chunkTotalSize);
	const view = new DataView(arrayBuffer);

	stringToDataView(view, 0, 'RIFF');
	view.setUint32(4, chunkTotalSize, true);
	stringToDataView(view, 8, 'WAVE');
	stringToDataView(view, 12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, numOfChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * sampleSize, true);
	view.setUint16(32, sampleSize, true);
	view.setUint16(34, bitDepth, true);
	stringToDataView(view, 36, 'data');
	view.setUint32(40, chunkDataSize, true);

	return floatTo16BitPCM(view, buffer, fileHeaderSize + chunkHeaderSize);
}

/**
 * Converts the specified AudioBuffer to a Blob.
 *
 * Note that changing the MIME type does not change the actual file format.
 * The output is a WAVE in any case
 */
export function audioBufferToWav(buffer: AudioBuffer, type: string = 'audio/wav'): Blob {
	const recorded = interleave(buffer);
	const dataview = writeWavHeaders(recorded, buffer.numberOfChannels, buffer.sampleRate);
	const audioBlob = new Blob([dataview], { type });

	return audioBlob;
}

/**
 * Convert an audio buffer into a planar float 32 array
 */
export function bufferToF32Planar(input: AudioBuffer): Float32Array {
	const result = new Float32Array(input.length * input.numberOfChannels);

	let offset = 0;
	for (let i = 0; i < input.numberOfChannels; i++) {
		const data = input.getChannelData(i);
		result.set(data, offset);
		offset += data.length;
	}

	return result;
}

/**
 * Conver an audio buffer inter a interleaved int 16 array
 */
export function bufferToI16Interleaved(audioBuffer: AudioBuffer): Int16Array {
	const numberOfChannels = audioBuffer.numberOfChannels;
	const length = audioBuffer.length;
	const interleaved = new Int16Array(length * numberOfChannels);

	for (let i = 0; i < length; i++) {
		for (let channel = 0; channel < numberOfChannels; channel++) {
			let sample = audioBuffer.getChannelData(channel)[i] * 32767; // Convert float [-1,1] to 16-bit PCM
			
			// Clamp values to the Int16 range
			if (sample > 32767) sample = 32767;
			if (sample < -32767) sample = -32767;

			interleaved[i * numberOfChannels + channel] = sample;
		}
	}

	return interleaved;
}

/**
 * Merges the channels of the audio blob into a mono AudioBuffer
 */
export async function blobToMonoBuffer(
	blob: Blob,
	sampleRate = 22050,
	scalingFactor = Math.sqrt(2),
) {
	const data = await blob.arrayBuffer();
	const context = new OfflineAudioContext({ sampleRate, length: 1 });
	const buffer = await context.decodeAudioData(data);

	const ouput = context.createBuffer(1, buffer.length, sampleRate);

	if (buffer.numberOfChannels >= 2) {
		const left = buffer.getChannelData(0);
		const right = buffer.getChannelData(1);

		const mono = ouput.getChannelData(0);

		for (let i = 0; i < buffer.length; ++i) {
			mono[i] = (scalingFactor * (left[i] + right[i])) / 2;
		}

		return ouput;
	}

	return buffer;
}

/**
 * Change the sample rate of an audio buffer
 * @param buffer The buffer to resample
 * @param sampleRate The desired sample rate
 * @param numberOfChannels The desired number of channels
 * @returns The resampled audio buffer
 */
export function resampleBuffer(buffer: AudioBuffer, sampleRate = 44100, numberOfChannels = 2) {
	// sample rate and channels already match
	if (buffer.sampleRate == sampleRate && buffer.numberOfChannels == numberOfChannels) {
		return buffer;
	}

	const length = Math.floor(buffer.duration * sampleRate);
	const audioContext = new OfflineAudioContext(numberOfChannels, 1, sampleRate);

	// Create a new AudioBuffer with the desired sample rate
	const result = audioContext.createBuffer(numberOfChannels, length, sampleRate);

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const prevData = buffer.getChannelData(channel);
		const nextData = result.getChannelData(channel);
		const ratio = buffer.sampleRate / sampleRate;

		for (let i = 0; i < nextData.length; i++) {
			const originalIndex = i * ratio;
			const lowerIndex = Math.floor(originalIndex);
			const upperIndex = Math.ceil(originalIndex);

			if (upperIndex >= prevData.length) {
				nextData[i] = prevData[lowerIndex];
			} else {
				const interpolation = originalIndex - lowerIndex;
				nextData[i] =
					prevData[lowerIndex] * (1 - interpolation) +
					prevData[upperIndex] * interpolation;
			}
		}
	}

	return result;
}
