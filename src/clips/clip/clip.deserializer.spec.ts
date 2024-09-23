import { describe, it, expect } from 'vitest';
import { ClipDeserializer } from './clip.desierializer';
import { 
  AudioClip, 
  VideoClip, 
  HtmlClip, 
  ImageClip, 
  TextClip, 
  ComplexTextClip, 
  Clip 
} from '..';
import { AudioSource, HtmlSource, ImageSource, VideoSource } from '../../sources';
import type { Source } from '../../sources';

describe('ClipDeserializer', () => {
  it('should return correct clip based on type', () => {
    expect(ClipDeserializer.fromType({ type: 'video' })).toBeInstanceOf(VideoClip);
    expect(ClipDeserializer.fromType({ type: 'audio' })).toBeInstanceOf(AudioClip);
    expect(ClipDeserializer.fromType({ type: 'html' })).toBeInstanceOf(HtmlClip);
    expect(ClipDeserializer.fromType({ type: 'image' })).toBeInstanceOf(ImageClip);
    expect(ClipDeserializer.fromType({ type: 'text' })).toBeInstanceOf(TextClip);
    expect(ClipDeserializer.fromType({ type: 'complex_text' })).toBeInstanceOf(ComplexTextClip);
    expect(ClipDeserializer.fromType({ type: 'unknown' as any })).toBeInstanceOf(Clip); // Default case
  });

  it('should return correct clip based on source', () => {
    // Mock instances for different source types
    const audioSource = new AudioSource();
    const videoSource = new VideoSource();
    const imageSource = new ImageSource();
    const htmlSource = new HtmlSource();

    const res = ClipDeserializer.fromSource(audioSource)

    // Ensure proper class instantiation based on source type
    expect(res).toBeInstanceOf(AudioClip);
    expect(ClipDeserializer.fromSource(videoSource)).toBeInstanceOf(VideoClip);
    expect(ClipDeserializer.fromSource(imageSource)).toBeInstanceOf(ImageClip);
    expect(ClipDeserializer.fromSource(htmlSource)).toBeInstanceOf(HtmlClip);
  });

  it('should return undefined if source type does not match', () => {
    const invalidSourceMock = { type: 'unknown' } as any as Source;
    expect(ClipDeserializer.fromSource(invalidSourceMock)).toBeUndefined();
  });
});
