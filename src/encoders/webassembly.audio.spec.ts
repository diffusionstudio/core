/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioBufferMock } from '../../vitest.mocks';
import { Composition } from '../composition';
import { WebassemblyAudioEncoder } from './webassembly.audio';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { OpusEncoder } from './opus';

const config = {
  codec: 'opus',
  numberOfChannels: 2,
  sampleRate: 48000,
} as const;

describe('WebassemblyAudioEncoder', () => {
  const composition = new Composition();

  const bufferSpy = vi.spyOn(composition, 'audio').mockImplementation(
    async (numberOfChannels: number = 1, sampleRate: number = 1e6) =>
      new AudioBufferMock({ sampleRate, numberOfChannels, length: 50 }) as AudioBuffer
  );
  const configureSpy = vi.spyOn(OpusEncoder.prototype, 'configure').mockImplementation(vi.fn());
  const encodeSpy = vi.spyOn(OpusEncoder.prototype, 'encode')
    .mockImplementation(function (this: OpusEncoder, ...args: any[]) {
      this.output({
        data: new Uint8Array(10),
        duration: 20,
        timestamp: 0,
        type: 'key'
      }, { decoderConfig: config })
      return vi.fn()(...args);
    });

  const encoder = new WebassemblyAudioEncoder(composition);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    audio: config,
    fastStart: 'in-memory'
  });

  const muxSpy = vi.spyOn(muxer, 'addAudioChunkRaw');

  beforeEach(() => {
    bufferSpy.mockClear();
    configureSpy.mockClear();
    encodeSpy.mockClear();
    muxSpy.mockClear();
  })

  it('should encode the audio of the composition using the provided configuration', async () => {
    await encoder.encode(muxer, { ...config, sampleRate: 50_000 });

    expect(bufferSpy).toHaveBeenCalledTimes(1);
    expect(configureSpy).toHaveBeenCalledWith(config);
    expect(encodeSpy.mock.calls[0][0].numberOfFrames).toBe(50);
    // 2 channels times 50
    expect(encodeSpy.mock.calls[0][0].data.length).toBe(100);

    expect(muxSpy).toHaveBeenCalledTimes(1);
    expect(muxSpy.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
    expect(muxSpy.mock.calls[0][0].length).toBe(10);
    expect(muxSpy.mock.calls[0][1]).toBe('key');
    expect(muxSpy.mock.calls[0][2]).toBe(0);
    expect(muxSpy.mock.calls[0][3]).toBe(20);
  });
});
