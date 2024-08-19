import * as core from '@diffusionstudio/core';

export const comp = new core.Composition();

const source = await core.VideoSource
  .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

// we use this for labelling our clips
const text = new core.TextClip({
  textAlign: 'center',
  textBaseline: 'middle',
  fontSize: 12,
  stroke: { color: '#000000' },
  font: core.Font.fromFamily({ family: 'Geologica', weight: '400' })
});

const video = await comp.appendClip(
  new core.VideoClip(source, { 
    scale: 0.5, 
    muted: true,
  })
);

await comp.appendClip(
  text.set({ 
    text: 'Cut by composition duration', 
    x: '25%', 
    y: '25%' 
  })
);

// The video duration is 20 seconds
const duration = video.duration.frames;
// Let's limit the composition duration to 19 seconds
comp.duration = duration - 30;

await comp.appendClip(
  video.copy()
    .set({ x: '50%' })
    .subclip(30, duration - 60)
);

await comp.appendClip(
  text.copy().set({ 
    text: 'Trimmed start and stop', 
    x: '75%', 
    y: '25%' 
  })
);

await comp.appendClip(
  video.copy()
    .set({ y: '50%' })
    .offsetBy(-60)
);

await comp.appendClip(
  text.copy().set({ 
    text: 'Negative offset', 
    x: '25%', 
    y: '75%',
  })
);

await comp.appendClip(
  video.copy()
    .set({ x: '50%', y: '50%' })
    .offsetBy(60)
    .subclip(30, duration - 180)
);

await comp.appendClip(
  text.copy().set({ 
    text: 'Positive offset & Trim', 
    x: '75%', 
    y: '75%',
  })
);
