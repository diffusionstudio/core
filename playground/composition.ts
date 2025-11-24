import * as core from '@diffusionstudio/core';

export const settings: core.CompositionSettings = {
  background: '#76b7f5',
};

export async function main(composition: core.Composition) {
  core.env.experimental_timeBase = 30;
  core.env.experimental_canonicalTimeBase = 48_000;

  const videoSource = await core.Source.from<core.VideoSource>('/bbb_1080p_30fps.mp4');

  const CLIPS = 50;
  const videoDuration = 20;
  const minClipDuration = 4;
  const slideStep = videoDuration / CLIPS;

  const videoLayer = new core.Layer({ mode: 'SEQUENTIAL' });
  await composition.add(videoLayer);

  for (let i = 0; i < CLIPS; i++) {
    const startTime = i * slideStep;
    const endTime = startTime + minClipDuration;

    if (endTime > videoDuration) continue;

    const videoClip = new core.VideoClip(videoSource, {
      position: 'center',
      height: '100%',
      range: [startTime, endTime],
      duration: minClipDuration,
    });

    await videoLayer.add(videoClip);
  }
}
