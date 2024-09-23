/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect } from 'vitest';
import { createOpusHead } from './opus.utils';

describe('createOpusHead', () => {
  it('should generate a correct Opus header', () => {
    const sampleRate = 48000;
    const numberOfChannels = 2;
    const result = createOpusHead(sampleRate, numberOfChannels);

    // Check that the result is a Uint8Array of length 19
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(19);

    // Check magic signature "OpusHead"
    expect(result[0]).toBe('O'.charCodeAt(0));
    expect(result[1]).toBe('p'.charCodeAt(0));
    expect(result[2]).toBe('u'.charCodeAt(0));
    expect(result[3]).toBe('s'.charCodeAt(0));
    expect(result[4]).toBe('H'.charCodeAt(0));
    expect(result[5]).toBe('e'.charCodeAt(0));
    expect(result[6]).toBe('a'.charCodeAt(0));
    expect(result[7]).toBe('d'.charCodeAt(0));

    // Check version is set to 1
    expect(result[8]).toBe(1);

    // Check number of channels
    expect(result[9]).toBe(numberOfChannels);

    // Check pre-skip is 0 (bytes 10 and 11)
    expect(result[10]).toBe(0);
    expect(result[11]).toBe(0);

    // Check sample rate is correctly encoded (bytes 12-15)
    expect(result[12]).toBe(sampleRate & 0xFF);
    expect(result[13]).toBe((sampleRate >> 8) & 0xFF);
    expect(result[14]).toBe((sampleRate >> 16) & 0xFF);
    expect(result[15]).toBe((sampleRate >> 24) & 0xFF);

    // Check gain is 0 (bytes 16 and 17)
    expect(result[16]).toBe(0);
    expect(result[17]).toBe(0);

    // Check channel mapping is 0
    expect(result[18]).toBe(0);
  });

  it('should correctly encode a different sample rate and number of channels', () => {
    const sampleRate = 44100;
    const numberOfChannels = 1;
    const result = createOpusHead(sampleRate, numberOfChannels);

    // Check number of channels
    expect(result[9]).toBe(numberOfChannels);

    // Check sample rate is correctly encoded (bytes 12-15)
    expect(result[12]).toBe(sampleRate & 0xFF);
    expect(result[13]).toBe((sampleRate >> 8) & 0xFF);
    expect(result[14]).toBe((sampleRate >> 16) & 0xFF);
    expect(result[15]).toBe((sampleRate >> 24) & 0xFF);
  });
});
