/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioBufferMock } from '../../vitest.mocks';
import { Composition } from '../composition';
import { WebcodecsAudioEncoder } from './webcodecs.audio';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

const config = {
  codec: 'opus',
  numberOfChannels: 2,
  sampleRate: 48000,
} as const;

describe('WebcodecsAudioEncoder', () => {
  const composition = new Composition();

  const bufferSpy = vi.spyOn(composition, 'audio').mockImplementation(
    async (numberOfChannels: number = 1, sampleRate: number = 1e6) =>
      new AudioBufferMock({ sampleRate, numberOfChannels, length: 50 }) as AudioBuffer
  );
  const configureSpy = vi.spyOn(AudioEncoder.prototype, 'configure').mockImplementation(vi.fn());
  const encodeSpy = vi.spyOn(AudioEncoder.prototype, 'encode').mockImplementation(vi.fn());

  const encoder = new WebcodecsAudioEncoder(composition);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    audio: config,
    fastStart: 'in-memory'
  });

  const muxSpy = vi.spyOn(muxer, 'addAudioChunk');

  beforeEach(() => {
    bufferSpy.mockClear();
    configureSpy.mockClear();
    encodeSpy.mockClear();
    muxSpy.mockClear();
  })

  it('should encode the audio of the composition using the provided configuration', async () => {
    await encoder.encode(muxer, config);

    expect(bufferSpy).toHaveBeenCalledTimes(1);
    expect(configureSpy).toHaveBeenCalledWith(config);
    expect(encodeSpy.mock.calls[0][0]).toBeInstanceOf(AudioData);
  });
});
