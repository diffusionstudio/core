/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { bufferToI16Interleaved } from "../utils";
import { OpusEncoder } from "./opus";

import type { StreamTarget } from 'mp4-muxer';
import type { Composition } from "../composition";
import type { Muxer } from 'mp4-muxer';
import type { WebAudioEncoder } from "./interfaces";
import { toOpusSampleRate } from "./utils";

export class WebassemblyAudioEncoder implements WebAudioEncoder {
  private composition: Composition;

  public constructor(composition: Composition) {
    this.composition = composition;
  }

  public async encode(muxer: Muxer<StreamTarget>, config: AudioEncoderConfig): Promise<void> {
    const numberOfChannels = config.numberOfChannels;
    const sampleRate = toOpusSampleRate(config.sampleRate);

    const output = await this.composition.audio(numberOfChannels, sampleRate);

    if (!output) return;

    const encoder = new OpusEncoder({
      output: (chunk, meta) => {
        muxer.addAudioChunkRaw(
          chunk.data,
          chunk.type,
          chunk.timestamp,
          chunk.duration,
          meta
        );
      },
      error: console.error,
    });

    await encoder.configure({ ...config, sampleRate });

    encoder.encode({
      data: bufferToI16Interleaved(output),
      numberOfFrames: output.length,
    });
  }
}
