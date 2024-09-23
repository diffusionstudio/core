/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Decoder } from './decoder';

describe('Decoder', () => {
  let mockPostMessage: Mock<any>
  let mockVideoDecoder: Mock<any>
  let mockVideoFrame: any;
  let decoder: Decoder;

  beforeEach(() => {
    // Mock postMessage for 'self'
    mockPostMessage = vi.fn();
    (global as any).self = {
      postMessage: mockPostMessage,
      close: vi.fn(),
    };

    // Mock VideoDecoder
    mockVideoDecoder = vi.fn().mockImplementation(({ output, error }) => {
      return {
        output,
        error,
        decode: vi.fn(),
        close: vi.fn(),
      };
    });
    (global as any).VideoDecoder = mockVideoDecoder;

    // Mock VideoFrame
    mockVideoFrame = {
      timestamp: 0,
      duration: 1000000, // 1 second in nanoseconds
      close: vi.fn(),
    };
  });

  it('should initialize with correct properties', () => {
    const range = [0, 5] satisfies [number, number]; // 5 seconds range
    const fps = 30;

    decoder = new Decoder(range, fps);

    expect(decoder.video).toBeDefined();
    expect(mockVideoDecoder).toHaveBeenCalled();
    expect(decoder['currentTime']).toBe(range[0] * 1e6);
    expect(decoder['firstTimestamp']).toBe(range[0] * 1e6);
    expect(decoder['totalFrames']).toBe(((range[1] - range[0]) * fps) + 1);
    expect(decoder['fps']).toBe(fps);
  });

  it('should post a frame and update current time and count', () => {
    const range = [0, 5] satisfies [number, number];
    const fps = 30;

    decoder = new Decoder(range, fps);

    decoder['postFrame'](mockVideoFrame);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'frame', frame: mockVideoFrame });
    expect(decoder['currentTime']).toBeGreaterThan(range[0] * 1e6); // Time should increase
    expect(decoder['currentFrames']).toBe(1);
  });

  it('should handle frame output within range and post frames', () => {
    const range = [0, 5] satisfies [number, number];
    const fps = 30;

    decoder = new Decoder(range, fps);
    mockVideoFrame.timestamp = range[0] * 1e6; // Start time

    decoder['handleFrameOutput'](mockVideoFrame);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'frame', frame: mockVideoFrame });
    expect(mockVideoFrame.close).toHaveBeenCalled();
  });

  it('should handle errors and post error messages', () => {
    const range = [0, 5] satisfies [number, number];
    const fps = 30;
    const mockError = new DOMException('Test Error');

    decoder = new Decoder(range, fps);
    
    decoder['handleError'](mockError);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'error',
      message: 'Test Error',
    });
    expect(self.close).toHaveBeenCalled();
  });
});
