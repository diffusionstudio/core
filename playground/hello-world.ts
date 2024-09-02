import * as core from '../src';

// fetch the video
const source = await core.VideoSource // convenience function for fetch -> blob -> file
  .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

// create a video clip and trim it
const video = new core.VideoClip(source) // compatible with the File API
  .subclip(0, 150); // The base unit is frames at 30 FPS

// create a text clip and stylize it
const text = new core.TextClip({ 
  text: 'Bunny - Our Brave Hero', 
  position: 'center', 
  stop: 90, 
  stroke: { color: '#000000' }, 
});

// or 'comp' for short
const composition = new core.Composition();

// this is how to compose your clips
await composition.add(video);
await composition.add(text);

// export video using webcodecs at 25 FPS
new core.WebcodecsEncoder(composition, { fps: 25 })
  .export();
