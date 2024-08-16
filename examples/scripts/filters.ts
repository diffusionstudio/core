import { PixelateFilter } from 'pixi-filters';
import * as core from '@diffusionstudio/core';

export const comp = new core.Composition();

const source = await core.VideoSource
  .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

// you can import Filters from 'pixi-filters' and 'pixi.js'
const video = new core.VideoClip(source)
  .set({ filters: new PixelateFilter(20) })

await comp.appendClip(video);
