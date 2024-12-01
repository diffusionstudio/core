import type { Timestamp } from '../models';

/**
 * Fast sampler options.
 */
export type FastSamplerOptions = {
	/**
	 * The number of samples to return.
	 */
	length?: number;
	/**
	 * The start time in **milliseconds** relative to the beginning of the clip.
	 */
	start?: Timestamp | number;
	/**
	 * The stop time in **milliseconds** relative to the beginning of the clip.
	 */
	stop?: Timestamp | number;
	/**
	 * Whether to use a logarithmic scale.
	 */
	logarithmic?: boolean;
};

export type SilenceDetectionOptions = {
	/**
	 * If the RMS is below the threshold, the frame is considered silent. 
	 * @default 0.02
	 */
	threshold?: number;
	/**
	 * This parameter affect how accurately the algorithm captures short silences. 
	 * @default 1024
	 */
	hopSize?: number;
	/**
	 * Setting a minimum duration for a silence period helps avoid detecting brief gaps between sounds as silences. 
	 * @default 0.5
	 */
	minDuration?: number;
};

export type AudioSlice = {
	start: Timestamp;
	stop: Timestamp;
};
