/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

/**
 * Utility for creating the OpusHead
 */
export function createOpusHead(sampleRate: number, numberOfChannels: number) {
  const head = new Uint8Array(19);
  head[0] = 'O'.charCodeAt(0);  // Magic signature 'OpusHead'
  head[1] = 'p'.charCodeAt(0);
  head[2] = 'u'.charCodeAt(0);
  head[3] = 's'.charCodeAt(0);
  head[4] = 'H'.charCodeAt(0);
  head[5] = 'e'.charCodeAt(0);
  head[6] = 'a'.charCodeAt(0);
  head[7] = 'd'.charCodeAt(0);
  head[8] = 1;  // Version
  head[9] = numberOfChannels;  // Number of channels
  head[10] = 0;  // Pre-skip (2 bytes, default is 0)
  head[11] = 0;
  head[12] = sampleRate & 0xFF;  // Sample rate (4 bytes)
  head[13] = (sampleRate >> 8) & 0xFF;
  head[14] = (sampleRate >> 16) & 0xFF;
  head[15] = (sampleRate >> 24) & 0xFF;
  head[16] = 0;  // Gain (2 bytes, default is 0)
  head[17] = 0;
  head[18] = 0;  // Channel mapping (0 = single stream, default)
  return head;
}
