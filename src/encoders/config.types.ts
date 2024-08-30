/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export type EncoderEvents = {
	render: {
		/**
		 * Defines how many were rendered yet
		 */
		progress: number;
		/**
		 * Defines the total number of frames
		 * to be rendered
		 */
		total: number;
		/**
		 * Defines the estimated remaining
		 * render time
		 */
		remaining: Date;
	};
	canceled: undefined;
	done: undefined;
};

export type EncoderOptions = {
	/**
	 * Multiplier of the composition size
	 * @example 2 // 1080p -> 4K
	 * @default 1 // 1080p -> 1080p
	 */
	resolution?: number;
	/**
	 * A floating point number indicating the audio context's sample rate, in samples per second.
	 *
	 * @default 44100
	 */
	sampleRate?: number

	/**
	 * Defines the number of channels
	 * of the composed audio
	 *
	 * @default 2
	 */
	numberOfChannels?: number;

	/**
	 * Defines the bitrate at which the video
	 * should be rendered at
	 * @default 10e6
	 */
	videoBitrate?: number;

	/**
	 * Defines the maximum size of the video
	 * encoding queue, increasing this number
	 * will put a higher pressure on the gpu.
	 * It's restricted to a value between 1 and 100
	 * @default 5
	 */
	gpuBatchSize?: number;

	/**
	 * Defines the fps at which the composition
	 * will be rendered
	 * @default 30
	 */
	fps?: number;

	/**
	 * Defines if the performance should be logged
	 * @default false;
	 */
	debug?: boolean;
};
