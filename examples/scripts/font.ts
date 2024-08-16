import * as core from '@diffusionstudio/core';

export const comp = new core.Composition();

const video = await comp.appendClip(
  new core.VideoClip(
    await core.VideoSource
      .from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/drone_footage_1080p_25fps.mp4')
  )
);

const duration = video.duration.frames;
comp.duration = duration;

await comp.appendClip(
  new core.TextClip('Hello World')
    .set({
      position: 'center', // use one of the default fonts
      font: core.Font.fromFamily({ family: 'The Bold Font', weight: '500' }),
      rotation: new core.Keyframe(
        [0, 15],
        [243, 360 * 2],
        { type: 'degrees' }
      ),
      translate: {
        x: new core.Keyframe(
          [duration - 10, duration],
          [0, -2000],
          { easing: 'easeIn' }
        ),
        y: 0,
      },
      scale: new core.Keyframe([0, 10], [0.3, 1]),
      fontSize: 34
    })
);

// provide custom web font. Local font strings are also supported
// e.g. source: 'local('FlamboyantSansSerif')'
// https://developer.chrome.com/docs/capabilities/web-apis/local-fonts
const roboto = new core.Font({
  source: "https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmSU5fBBc4AMP6lQ.woff2",
  weight: '400',
  family: 'Roboto'
});

await comp.appendClip(
  new core.TextClip('Diffusion Studio')
    .set({
      textAlign: 'right',
      textBaseline: 'bottom',
      font: roboto,
      fontSize: 9,
      x: '95%',
      y: '93%'
    })
);

await comp.appendClip(
  new core.TextClip('August 2024')
    .set({
      textAlign: 'right',
      textBaseline: 'top',
      fillStyle: '#000000',
      font: roboto,
      fontSize: 9,
      x: '95%',
      y: '7%'
    })
);
