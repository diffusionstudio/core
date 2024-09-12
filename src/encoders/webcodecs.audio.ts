/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { bufferToF32Planar } from "../utils";
import { Muxer } from 'mp4-muxer';

import type { StreamTarget } from 'mp4-muxer';
import type { Composition } from "../composition";
import type { WebAudioEncoder } from "./interfaces";

export class WebcodecsAudioEncoder implements WebAudioEncoder {
  private composition: Composition;

  public constructor(composition: Composition) {
    this.composition = composition;
  }

  public async encode(muxer: Muxer<StreamTarget>, config: AudioEncoderConfig): Promise<void> {
    const { numberOfChannels, sampleRate } = config;

    const output = await this.composition.audio(numberOfChannels, sampleRate);

    if (!output) return;

    const encoder = new AudioEncoder({
      output: (chunk, meta) => {
        meta && muxer.addAudioChunk(chunk, meta);
      },
      error: console.error,
    });

    encoder.configure(config);

    const data = new AudioData({
      format: 'f32-planar',
      sampleRate: output.sampleRate,
      numberOfChannels: output.numberOfChannels,
      numberOfFrames: output.length,
      timestamp: 0,
      data: bufferToF32Planar(output),
    });

    encoder.encode(data);
    await encoder.flush();
  }
}
