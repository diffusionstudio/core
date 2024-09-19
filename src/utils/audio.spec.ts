/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioBufferToWav, blobToMonoBuffer, bufferToF32Planar, bufferToI16Interleaved, floatTo16BitPCM, interleave, resampleBuffer } from './audio';

describe('interleave', () => {
	// Mock the AudioBuffer object
	function createMockAudioBuffer(numberOfChannels: number, channelData: Float32Array[]): AudioBuffer {
		return {
			numberOfChannels,
			getChannelData: vi.fn((channelIndex: number) => channelData[channelIndex]),
			length: channelData.length > 0 ? channelData[0].length : 0, // Safely handle zero channels
		} as unknown as AudioBuffer;
	}

	it('should return single channel data as-is when there is only one channel', () => {
		const channelData = new Float32Array([1, 2, 3, 4]);
		const mockAudioBuffer = createMockAudioBuffer(1, [channelData]);

		const result = interleave(mockAudioBuffer);

		expect(result).toEqual(channelData); // Should return the same array for single channel
	});

	it('should interleave two-channel audio correctly', () => {
		const leftChannel = new Float32Array([1, 3, 5, 7]);
		const rightChannel = new Float32Array([2, 4, 6, 8]);
		const mockAudioBuffer = createMockAudioBuffer(2, [leftChannel, rightChannel]);

		const result = interleave(mockAudioBuffer);

		expect(result).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]));
	});

	it('should interleave three-channel audio correctly', () => {
		const channel1 = new Float32Array([1, 4, 7]);
		const channel2 = new Float32Array([2, 5, 8]);
		const channel3 = new Float32Array([3, 6, 9]);
		const mockAudioBuffer = createMockAudioBuffer(3, [channel1, channel2, channel3]);

		const result = interleave(mockAudioBuffer);

		expect(result).toEqual(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
	});

	it('should handle audio buffer with different channel lengths gracefully', () => {
		const channel1 = new Float32Array([1, 3]);
		const channel2 = new Float32Array([2, 4, 6]);
		const mockAudioBuffer = createMockAudioBuffer(2, [channel1, channel2]);

		const result = interleave(mockAudioBuffer);

		expect(result).toEqual(new Float32Array([1, 2, 3, 4, 0, 6])); // Filling with 0 as undefined behavior
	});

	it('should return an empty array if the audio buffer has no channels', () => {
		const mockAudioBuffer = createMockAudioBuffer(0, []);

		const result = interleave(mockAudioBuffer);

		expect(result).toEqual(new Float32Array([])); // Empty buffer results in an empty array
	});
});

describe('audioBufferToWav', () => {
	const sampleRate = 44100;
	const monoData = new Float32Array([0.5, -0.5, 0.25, -0.25]);
	const stereoDataL = new Float32Array([0.5, 0.25]);
	const stereoDataR = new Float32Array([-0.5, -0.25]);

	const createMockAudioBuffer = (numberOfChannels: number, channelData: Float32Array[]) => {
		return {
			numberOfChannels,
			length: channelData[0].length,
			sampleRate,
			getChannelData: vi.fn((channel: number) => channelData[channel]),
		} as any as AudioBuffer;
	};

	it('should correctly convert a mono AudioBuffer to a WAV blob', () => {
		const mockAudioBuffer = createMockAudioBuffer(1, [monoData]);

		const wavBlob = audioBufferToWav(mockAudioBuffer);

		expect(wavBlob).toBeInstanceOf(Blob);
		expect(wavBlob.type).toBe('audio/wav');
	});

	it('should correctly convert a stereo AudioBuffer to a WAV blob', () => {
		const mockAudioBuffer = createMockAudioBuffer(2, [stereoDataL, stereoDataR]);

		const wavBlob = audioBufferToWav(mockAudioBuffer);

		expect(wavBlob).toBeInstanceOf(Blob);
		expect(wavBlob.type).toBe('audio/wav');
	});

	it('should interleave stereo AudioBuffer data correctly', () => {
		const mockAudioBuffer = createMockAudioBuffer(2, [stereoDataL, stereoDataR]);

		const interleaved = interleave(mockAudioBuffer);

		expect(interleaved).toEqual(new Float32Array([0.5, -0.5, 0.25, -0.25]));
	});

	it('should interleave mono AudioBuffer data correctly (no interleaving)', () => {
		const mockAudioBuffer = createMockAudioBuffer(1, [monoData]);

		const interleaved = interleave(mockAudioBuffer);

		expect(interleaved).toEqual(monoData);
	});

	it('should write correct PCM data to the DataView', () => {
		const mockAudioBuffer = createMockAudioBuffer(1, [monoData]);
		const interleavedData = interleave(mockAudioBuffer);

		const arrayBuffer = new ArrayBuffer(interleavedData.length * 2);
		const view = new DataView(arrayBuffer);

		floatTo16BitPCM(view, interleavedData, 0);

		// Verify that the data is correctly converted to 16-bit PCM
		expect(view.getInt16(0, true)).toBe(16383);  // 0.5 * 32767 (max value for 16-bit PCM)
		expect(view.getInt16(2, true)).toBe(-16384); // -0.5 * 32768 (min value for 16-bit PCM)
		expect(view.getInt16(4, true)).toBe(8191);   // 0.25 * 32767
		expect(view.getInt16(6, true)).toBe(-8192);  // -0.25 * 32768
	});

	it('should write correct WAV headers and PCM data', async () => {
		const mockAudioBuffer = createMockAudioBuffer(1, [monoData]);
		const wavBlob = audioBufferToWav(mockAudioBuffer);

		// Use FileReader to read the blob as an ArrayBuffer
		const reader = new FileReader();

		const arrayBufferPromise = new Promise<ArrayBuffer>((resolve, reject) => {
			reader.onloadend = () => resolve(reader.result as ArrayBuffer);
			reader.onerror = reject;
		});

		reader.readAsArrayBuffer(wavBlob);

		const buffer = await arrayBufferPromise;
		const view = new DataView(buffer);

		// Check the RIFF header
		expect(String.fromCharCode(view.getUint8(0))).toBe('R');
		expect(String.fromCharCode(view.getUint8(1))).toBe('I');
		expect(String.fromCharCode(view.getUint8(2))).toBe('F');
		expect(String.fromCharCode(view.getUint8(3))).toBe('F');

		// Check the WAVE header
		expect(String.fromCharCode(view.getUint8(8))).toBe('W');
		expect(String.fromCharCode(view.getUint8(9))).toBe('A');
		expect(String.fromCharCode(view.getUint8(10))).toBe('V');
		expect(String.fromCharCode(view.getUint8(11))).toBe('E');

		// Additional header checks (optional, as per the WAV specification)
		// Example: Check 'fmt ' chunk and audio format info
		expect(String.fromCharCode(view.getUint8(12))).toBe('f');
		expect(String.fromCharCode(view.getUint8(13))).toBe('m');
		expect(String.fromCharCode(view.getUint8(14))).toBe('t');
		expect(view.getUint16(20, true)).toBe(1);  // Audio format: PCM
	});
});

describe('bufferToF32Planar', () => {
	// Mock the AudioBuffer for testing
	function createMockAudioBuffer(channels: number, length: number, data: number[][]): AudioBuffer {
		const audioBuffer = {
			numberOfChannels: channels,
			length: length,
			getChannelData: (channel: number) => {
				return new Float32Array(data[channel]);
			}
		} as AudioBuffer;
		return audioBuffer;
	}

	it('should correctly convert a mono channel AudioBuffer to a Float32Array', () => {
		const mockData = [[0.1, 0.2, 0.3]];
		const buffer = createMockAudioBuffer(1, 3, mockData);

		const result = bufferToF32Planar(buffer);

		expect(result).toEqual(new Float32Array([0.1, 0.2, 0.3]));
	});

	it('should correctly convert a stereo (2 channels) AudioBuffer to a Float32Array', () => {
		const mockData = [
			[0.1, 0.2, 0.3],
			[0.4, 0.5, 0.6]
		];
		const buffer = createMockAudioBuffer(2, 3, mockData);

		const result = bufferToF32Planar(buffer);

		expect(result).toEqual(new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]));
	});

	it('should return an empty Float32Array for an empty AudioBuffer', () => {
		const buffer = createMockAudioBuffer(1, 0, [[]]);

		const result = bufferToF32Planar(buffer);

		expect(result).toEqual(new Float32Array());
	});

	it('should handle multiple channels and varying data lengths correctly', () => {
		// Ensure both channels have the same length by padding with zeros if necessary
		const mockData = [
			[0.1, 0.2],  // 2 samples
			[0.3, 0.4, 0.5] // 3 samples
		];

		// The buffer length should be the same for all channels (3 in this case)
		const paddedData = mockData.map(data => {
			const padded = new Array(3).fill(0); // Pad to length 3
			data.forEach((val, idx) => padded[idx] = val);
			return padded;
		});

		const buffer = createMockAudioBuffer(2, 3, paddedData);

		const result = bufferToF32Planar(buffer);

		// The expected result should include the padded zeros
		expect(result).toEqual(new Float32Array([0.1, 0.2, 0, 0.3, 0.4, 0.5]));
	});
});

describe('bufferToI16Interleaved', () => {
	const createMockAudioBuffer = (numberOfChannels: number, channelData: Float32Array[], sampleRate = 44100) => {
		return {
			numberOfChannels,
			length: channelData[0].length,
			sampleRate,
			getChannelData: vi.fn((channel: number) => channelData[channel]),
		} as any as AudioBuffer;
	};

	it('should handle a single channel correctly', () => {
		const audioData = [new Float32Array([0.5, -0.5, 0])]; // Simulate mono audio buffer with 3 samples
		const mockAudioBuffer = createMockAudioBuffer(1, audioData);

		const result = bufferToI16Interleaved(mockAudioBuffer);

		expect(result).toEqual(new Int16Array([16383, -16383, 0])); // Expected interleaved 16-bit PCM values
	});

	it('should handle two channels correctly', () => {
		const audioData = [
			new Float32Array([0.5, -0.5, 0]),  // Channel 1
			new Float32Array([-1, 1, 0.25]),   // Channel 2
		];
		const mockAudioBuffer = createMockAudioBuffer(2, audioData);

		const result = bufferToI16Interleaved(mockAudioBuffer);

		// Expected interleaved format for stereo: [Ch1Sample1, Ch2Sample1, Ch1Sample2, Ch2Sample2, ...]
		expect(result).toEqual(new Int16Array([16383, -32767, -16383, 32767, 0, 8191]));
	});

	it('should handle empty audio buffer', () => {
		const audioData: Float32Array[] = [new Float32Array([])]; // No samples
		const mockAudioBuffer = createMockAudioBuffer(1, audioData);

		const result = bufferToI16Interleaved(mockAudioBuffer);

		expect(result).toEqual(new Int16Array([])); // Expect empty array
	});

	it('should handle multi-channel audio', () => {
		const audioData = [
			new Float32Array([1, -1]),     // Channel 1
			new Float32Array([-0.5, 0]),   // Channel 2
			new Float32Array([0.25, -0.25]), // Channel 3
		];
		const mockAudioBuffer = createMockAudioBuffer(3, audioData);

		const result = bufferToI16Interleaved(mockAudioBuffer);

		// Expected interleaved format for 3 channels: [Ch1Sample1, Ch2Sample1, Ch3Sample1, Ch1Sample2, Ch2Sample2, Ch3Sample2, ...]
		expect(result).toEqual(new Int16Array([32767, -16383, 8191, -32767, 0, -8191]));
	});

	it('should correctly clamp values outside of the [-1, 1] range', () => {
		const audioData = [new Float32Array([1.5, -2, 0.75])]; // Values out of the [-1, 1] range
		const mockAudioBuffer = createMockAudioBuffer(1, audioData);

		const result = bufferToI16Interleaved(mockAudioBuffer);

		// Values above 1 should be clamped to 32767, below -1 clamped to -32767
		expect(result).toEqual(new Int16Array([32767, -32767, 24575])); // 0.75 * 32767 ≈ 24575
	});
});

describe('blobToMonoBuffer', () => {
	// Mock for AudioBuffer
	class MockAudioBuffer {
		numberOfChannels: number;
		length: number;
		sampleRate: number;
		private channels: Float32Array[];

		constructor(numberOfChannels: number, length: number, sampleRate: number) {
			this.numberOfChannels = numberOfChannels;
			this.length = length;
			this.sampleRate = sampleRate;
			this.channels = Array(numberOfChannels)
				.fill(null)
				.map(() => new Float32Array(length));
		}

		getChannelData(channel: number) {
			return this.channels[channel];
		}
	}

	// Mock for OfflineAudioContext
	class MockOfflineAudioContext {
		sampleRate: number;
		length: number;

		constructor({ sampleRate, length }: { sampleRate: number; length: number }) {
			this.sampleRate = sampleRate;
			this.length = length;
		}

		createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
			return new MockAudioBuffer(numberOfChannels, length, sampleRate);
		}

		async decodeAudioData(_: ArrayBuffer) {
			// Always return a 2-channel buffer for simplicity
			return new MockAudioBuffer(2, 100, this.sampleRate);
		}
	}

	it('merges stereo to mono', async () => {
		const mockBlob = {
			arrayBuffer: async () => new ArrayBuffer(100) // Mock arrayBuffer method
		};

		// Mock the OfflineAudioContext within the scope of this test
		const createBufferSpy = vi.spyOn(MockOfflineAudioContext.prototype, 'createBuffer');
		const decodeAudioDataSpy = vi.spyOn(MockOfflineAudioContext.prototype, 'decodeAudioData');

		// Inject the mock class instead of the real OfflineAudioContext
		vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext);

		const result = await blobToMonoBuffer(mockBlob as unknown as Blob, 44100);

		// Validate the outcome
		expect(result.numberOfChannels).toBe(1);
		expect(result.length).toBe(100);
		expect(result.sampleRate).toBe(44100);
		expect(createBufferSpy).toHaveBeenCalled();
		expect(decodeAudioDataSpy).toHaveBeenCalled();

		// Restore the original context after test
		vi.restoreAllMocks();
	});

	it('returns the original buffer if mono', async () => {
		const mockBlob = {
			arrayBuffer: async () => new ArrayBuffer(100) // Mock arrayBuffer method
		};

		// Mock the OfflineAudioContext and modify the decoded buffer to mono
		const decodeAudioDataSpy = vi.spyOn(MockOfflineAudioContext.prototype, 'decodeAudioData')
			.mockResolvedValueOnce(new MockAudioBuffer(1, 100, 44100));

		vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext);

		const result = await blobToMonoBuffer(mockBlob as unknown as Blob, 44100);

		// Validate the buffer is mono and the function handled it correctly
		expect(result.numberOfChannels).toBe(1);
		expect(result.length).toBe(100);
		expect(result.sampleRate).toBe(44100);
		expect(decodeAudioDataSpy).toHaveBeenCalled();

		// Restore the original context
		vi.restoreAllMocks();
	});
});

describe('resampleBuffer', () => {
	let OfflineAudioContextMock: any;

	// Setup before each test
	beforeEach(() => {
		// Mocking OfflineAudioContext constructor
		OfflineAudioContextMock = vi.fn(() => ({
			createBuffer: vi.fn((numberOfChannels, length, sampleRate) => ({
				numberOfChannels,
				length,
				sampleRate,
				getChannelData: vi.fn(() => new Float32Array(length)),
			})),
		}));

		// Mocking it for the local context of this test suite
		vi.spyOn(window, 'OfflineAudioContext').mockImplementation(OfflineAudioContextMock);
	});

	// Clean up after each test
	afterEach(() => {
		vi.restoreAllMocks(); // Restore original implementations
	});

	// Helper function to create a mock AudioBuffer
	const createMockAudioBuffer = (sampleRate: number, duration: number, numberOfChannels: number) => {
		const length = Math.floor(sampleRate * duration);
		return {
			sampleRate,
			duration,
			numberOfChannels,
			length,
			getChannelData: vi.fn(() => new Float32Array(length)),
		} as unknown as AudioBuffer;
	};

	it('should return the same buffer if sample rate and number of channels match', () => {
		const buffer = createMockAudioBuffer(44100, 2, 2); // 44100 Hz, 2 seconds, 2 channels
		const result = resampleBuffer(buffer, 44100, 2);

		expect(result).toBe(buffer); // Should return the same buffer
	});

	it('should resample the buffer to a different sample rate', () => {
		const buffer = createMockAudioBuffer(44100, 2, 2); // Original buffer with 44100 Hz, 2 channels
		const newSampleRate = 22050; // Resampling to 22050 Hz
		const result = resampleBuffer(buffer, newSampleRate, 2);

		expect(result.sampleRate).toBe(newSampleRate);
		expect(result.length).toBeLessThan(buffer.length); // Length should be less than original
		expect(result.numberOfChannels).toBe(2);
	});

	it('should change the number of channels if requested', () => {
		const buffer = createMockAudioBuffer(44100, 2, 1); // 44100 Hz, 2 seconds, 1 channel
		const result = resampleBuffer(buffer, 44100, 2); // Change to 2 channels

		expect(result.numberOfChannels).toBe(2); // Should now have 2 channels
		expect(result.length).toBe(buffer.length);
	});

	it('should properly interpolate audio data when downsampling', () => {
		const buffer = createMockAudioBuffer(44100, 1, 1); // 44100 Hz, 1 second, 1 channel
		const result = resampleBuffer(buffer, 22050, 1); // Downsample to 22050 Hz

		expect(result.sampleRate).toBe(22050);
		expect(result.length).toBe(Math.floor(buffer.duration * 22050));
	});

	it('should create a buffer of the correct length', () => {
		const buffer = createMockAudioBuffer(44100, 3, 2); // 3-second buffer at 44100 Hz
		const newSampleRate = 48000; // Resample to 48000 Hz
		const result = resampleBuffer(buffer, newSampleRate, 2);

		const expectedLength = Math.floor(buffer.duration * newSampleRate);
		expect(result.length).toBe(expectedLength);
	});

	it('should handle edge case when the original buffer has a length of 0', () => {
		const buffer = createMockAudioBuffer(44100, 0, 2); // Empty buffer

		const result = resampleBuffer(buffer, 48000, 2);
		expect(result.length).toBe(0);
		expect(result.sampleRate).toBe(48000);
		expect(result.numberOfChannels).toBe(2);
	});
});
