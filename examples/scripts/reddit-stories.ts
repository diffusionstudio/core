import * as core from '@diffusionstudio/core';

export const comp = new core.Composition({ height: 1920, width: 1080 }); // use 1080p vertical

// Fetch all resources in parallel
const sources = await Promise.all([
  core.VideoSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/minecraft_parkour_4k.mp4'),
  core.AudioSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/audio/elevenlabs_44100.mp3'),
  core.HtmlSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/html/question_and_answer_card.html'),
  core.Transcript.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/docs/ai_ft_coding_captions.json'),
]);

// Get the first scentence of the transcript (question)
const question = sources[3].groups[0];

// manipulate html source to manipulate title
// the HtmlSource uses an Iframe in the background
sources[2].document!.getElementById('title')!.textContent = question.text;

// add the Video, make sure it centered
const video = new core.VideoClip(sources[0])
  .set({ muted: true, position: 'center', height: '100%' });

// the transcript will be added to the audio for later use
const audio = new core.AudioClip(sources[1])
  .set({ transcript: sources[3] });

// the html should be centered and hide when the 
// question ends. Let's also apply some animations...
const html = new core.HtmlClip(sources[2])
  .set({
    position: 'center',
    stop: question.stop, // starts at scale 0.7 ends at scale 1 after 9 frames
    scale: new core.Keyframe([0, 9], [0.7, 1], { easing: 'easeOut' }),
    translate: {
      x: 0, // starts at y offset 14 ends at 0 after 9 frames
      y: new core.Keyframe([0, 9], [14, 0], { easing: 'easeOut' }),
    }, // starts at opacity 0 ends at opacity 1 after 4 frames
    alpha: new core.Keyframe([0, 4], [0, 1], { easing: 'easeOut' }),
  });

// add all clips to the compostion
await comp.appendClip(video);
await comp.appendClip(audio);
await comp.appendClip(html);

// Create a new caption track
const captions = await comp.appendTrack(core.CaptionTrack)
  .from(audio) // use the audio transcript as source
  .create(core.SolarCaptionPreset); // create clips with caption preset

// hide all clips as long as the html card is visible
for (const clip of captions.clips) {
  if (clip.stop.frames <= question.stop.frames) {
    clip.set({ disabled: true });
  }
}

// set a duration limit
comp.duration = audio.duration;
