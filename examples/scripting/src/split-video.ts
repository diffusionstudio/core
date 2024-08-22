import * as core from '@diffusionstudio/core';

export const comp = new core.Composition();

const source = await core.VideoSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4');

const video0 = await comp.appendClip(
  new core.VideoClip(source, {
    position: 'center',
    scale: new core.Keyframe([0, 30], [0.1, 1], { easing: 'easeOut' }),
    rotation: new core.Keyframe([0, 30], [0, 360], { easing: 'easeOut' }),
  })
);

// split at frame. If no argument is provided
// the video will be split at the current
// playback position (composition.frame)
const video1 = await video0.split(300);

video0.set({
  translate: {
    x: new core.Keyframe([290, 300], [0, -comp.width]),
    y: 0
  }
})

// all keyframes were converted to their numeric
// value at the time of the split, i.e. scale and rotation
// are no longer key frames
video1.set({
  translate: {
    x: new core.Keyframe([0, 10], [comp.width, 0]),
    y: 0
  }
});
