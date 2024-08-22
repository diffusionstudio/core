import { PixelateFilter } from 'pixi-filters';
import * as core from '@diffusionstudio/core';

export async function main(composition: core.Composition) {
  const source = await core.VideoSource
    .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

  // compatible with Filters from 'pixi-filters' and 'pixi.js'
  await composition.appendClip(
    new core.VideoClip(source, {
      filters: new PixelateFilter(20),
    })
  );
};
