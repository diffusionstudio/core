/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { createOpusHead } from './opus.utils';
import { OPUS_WASM_PATH, OPUS_JS_PATH, SUPPORTED_RATES } from './opus.fixtures';
import { EncoderError } from '../../errors';

import type {
  EncodedOpusChunkOutputCallback,
  OpusEncoderConfig,
  OpusEncoderInit,
  OpusEncoderSamples,
} from './opus.types';

export class OpusEncoder {
  public output: EncodedOpusChunkOutputCallback;
  public error: WebCodecsErrorCallback;
  public config?: OpusEncoderConfig;

  private encoder?: any;
  private opus?: any;
  private meta?: EncodedAudioChunkMetadata;

  /**
   * Create a new OpusEncoder for encoding pcm to opus
   * @param init encoder callbacks
   */
  public constructor(init: OpusEncoderInit) {
    this.output = init.output;
    this.error = init.error;
  }

  /**
   * Configure the encoder. **Note** these values must match the samples to encode
   * @param config The sample rate and channel count to use
   */
  public async configure(config: OpusEncoderConfig): Promise<void> {
    const opusModule = await import(/* @vite-ignore *//* webpackIgnore: true */OPUS_JS_PATH);
    const { numberOfChannels, sampleRate } = this.config = config;

    if (!SUPPORTED_RATES.includes(sampleRate)) {
      throw new EncoderError({
        code: 'sampleRateNotSupported',
        message: `Unsupported sample rate, supported: ${SUPPORTED_RATES.join()}`,
      })
    }

    // create new wasm module
    this.opus = await opusModule.default({
      locateFile(path: string, scriptDirectory: string) {
        if (path.endsWith('.wasm')) {
          return OPUS_WASM_PATH;
        }
        return scriptDirectory + path;
      }
    });

    // Create the Opus encoder with dynamic sample rate and number of channels
    this.encoder = this.opus._opus_encoder_create(sampleRate, numberOfChannels, 2048);

    // meta data for encoded audio chunks
    this.meta = {
      decoderConfig: {
        codec: "opus", // Extract or create the OpusHead
        description: createOpusHead(sampleRate, numberOfChannels).buffer,
        numberOfChannels: numberOfChannels,
        sampleRate: sampleRate,
      }
    }
  }

  /**
   * Encode the samples synchronously (this is a blocking event)
   * @param samples The data to encode
   */
  public encode({ data, numberOfFrames, timestamp = 0 }: OpusEncoderSamples) {
    if (!this.encoder || !this.opus || !this.config || !this.meta) {
      throw new EncoderError({
        code: 'unconfiguredEncoder',
        message: 'Cannot encode samples using an unconfigured encoder',
      });
    }

    // Parameters
    // Adjust chunk size for 20ms frames at the given sample rate
    const { sampleRate, numberOfChannels } = this.config;
    const chunkSize = Math.floor((sampleRate / 1000) * 20);

    // In Microseconds
    let offset = 0;
    const duration = (chunkSize / sampleRate) * 1e6;

    while (offset < numberOfFrames) {
      // Slice the PCM data into smaller chunks for encoding
      const pcmChunk = data.subarray(offset * numberOfChannels, (offset + chunkSize) * numberOfChannels);
      const pcmPointer = this.opus._malloc(pcmChunk.length * 2); // Allocate memory for PCM (16-bit data)

      // Write PCM data into WebAssembly memory
      this.opus.HEAP16.set(pcmChunk, pcmPointer >> 1); // Since it's 16-bit, we shift the pointer

      // Allocate output buffer for encoded data
      const maxPacketSize = 4000; // Max size for encoded Opus packet
      const outputPointer = this.opus._malloc(maxPacketSize);

      // Encode PCM chunk
      const encodedBytes = this.opus._opus_encode(
        this.encoder,
        pcmPointer,
        chunkSize,
        outputPointer,
        maxPacketSize
      );

      if (encodedBytes > 0) {
        const chunk = new Uint8Array(
          this.opus.HEAPU8.subarray(outputPointer, outputPointer + encodedBytes)
        );

        this.output(
          {
            data: chunk,
            timestamp,
            type: 'key',
            duration,
          },
          this.meta
        )
      } else {
        this.error(new DOMException('PCM chunk could not be encoded'));
      }

      // Free memory allocated for this chunk
      this.opus._free(pcmPointer);
      this.opus._free(outputPointer);

      // Move to the next chunk
      offset += chunkSize;
      timestamp += duration;
    }
  }
}
