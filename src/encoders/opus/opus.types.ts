export type OpusEncoderSamples = {
  /**
   * 16-bit signed integer array of interleaved audio samples
   */
  data: Int16Array,
  /**
   * The number of frames (usually total samples / number of channels)
   */
  numberOfFrames: number,
  /**
   * Defines the timestamp of the first frame
   */
  timestamp?: number
}

export type EncodedOpusChunk = {
  data: Uint8Array;
  timestamp: number;
  type: 'key' | 'delta';
  duration: number;
}

export type OpusEncoderConfig = Omit<AudioEncoderConfig, 'codec' | 'bitrate'>;

export type EncodedOpusChunkOutputCallback = (output: EncodedOpusChunk, metadata: EncodedAudioChunkMetadata) => void;

export type OpusEncoderInit = { output: EncodedOpusChunkOutputCallback, error: WebCodecsErrorCallback };
