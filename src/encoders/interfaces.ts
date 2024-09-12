/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { StreamTarget } from 'mp4-muxer';
import type { Muxer } from 'mp4-muxer';

export interface WebAudioEncoder {
  encode(muxer: Muxer<StreamTarget>, config: AudioEncoderConfig): Promise<void>
}

export interface EncoderInit {
  /**
   * A floating point number indicating the audio context's sample rate, in samples per second.
   *
   * @default 48000
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
   * Defines if the audio should be encoded
   */
  audio?: boolean;
};

export interface VideoEncoderInit extends EncoderInit {
  /**
   * Multiplier of the composition size
   * @example 2 // 1080p -> 4K
   * @default 1 // 1080p -> 1080p
   */
  resolution?: number;
  /**
   * Defines if the performance should be logged
   * @default false;
   */
  debug?: boolean;
}
