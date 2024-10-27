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
