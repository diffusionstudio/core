import * as core from '@diffusionstudio/core';

export const comp = new core.Composition();

// fetch external resources
const sources = await Promise.all([
  core.ImageSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/images/transparent_background.png'),
  core.Transcript.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/docs/ai_ft_coding_captions.json')
])

// add a background image
await comp.appendClip(
  new core.ImageClip(sources[0], {
    stop: core.Timestamp.fromSeconds(22)
  })
);

// MediaClip is the base of an Audio or Video Clip
const media = new core.MediaClip({ transcript: sources[1].optimize() });

// Now let's add all available caption preset
(await comp.appendTrack(core.CaptionTrack)
  .from(media)
  .create(core.ClassicCaptionPreset))
  .apply((clip) => clip.set({ x: '73%' }));

(await comp.appendTrack(core.CaptionTrack)
  .from(media)
  .create(core.CascadeCaptionPreset))
  .apply((clip) => clip.set({ x: '4%', y: '8%', maxWidth: 800 }));

(await comp.appendTrack(core.CaptionTrack)
  .from(media)
  .create(core.GuineaCaptionPreset))
  .apply(clip => clip.set({ x: '73%', y: '16%' }));

(await comp.appendTrack(core.CaptionTrack)
  .from(media)
  .create(core.SolarCaptionPreset))
  .apply(clip => clip.set({ x: '73%', y: '80%' }));

// you can also instantiate and customize 
const preset = new core.SpotlightCaptionPreset();
preset.color = '#a436f7'; // purple

(await comp.appendTrack(core.CaptionTrack)
  .from(media)
  .create(preset))
  .apply(clip => clip.set({ x: '23%', y: '80%' }));

(await comp.appendTrack(core.CaptionTrack)
  .from(media)
  .create(core.WhisperCaptionPreset))
  .apply(clip => clip.set({ x: '27%' }));
