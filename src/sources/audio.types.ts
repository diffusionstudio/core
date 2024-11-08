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

export type SilenceOptions = {
	/**
	 * The threshold to use for the silence detection in db.
	 */	
	threshold?: number;
	/**
	 * The minimum duration of a silence to be considered a silence in milliseconds.
	 */
	minDuration?: number;
	/**
	 * The window size to use for the silence detection.
	 */
	windowSize?: number;
};
