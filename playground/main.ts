import * as core from '../src';
import { captions } from '../src/test/captions';
import { setupControls } from './controls';
import { setupTimeline } from './timeline';

const composition = new core.Composition({ background: '#76b7f5' });

setupControls(composition);
setupTimeline(composition);

await composition.add(
  new core.VideoClip(
    await core.VideoSource
      .from('/sample_aac_h264_yuv420p_1080p_60fps.mp4'),
    {
      volume: 0.1,
      anchor: 0.5,
      position: 'center',
      height: '100%',
      alpha: new core.Keyframe([0, 120, 240, 300], [0.5, 1, 0.5, 1]),
      scale: new core.Keyframe([0, 30], [0.1, 1], { easing: 'easeIn' }),
      rotation: new core.Keyframe([0, 30], [0, 360], { easing: 'easeOut' }),
    })
    .subclip(30, 540)
    .offsetBy(30)
);

await composition.add(
  new core.ImageClip(await core.ImageSource.from('/lenna.png'), {
    position: 'center',
    height: 600,
    translate: {
      x: new core.Keyframe([0, 40], [1700, -1400], { easing: 'easeOut' }),
      y: 0
    },
    rotation: new core.Keyframe(
      [0, 5, 10, 15, 20, 25, 30, 35, 40],
      [-16, 14, -7, 24, -3, 19, -14, 5, -30]
    ),
    scale: new core.Keyframe([0, 40], [2, 1])
  })
);

await composition.add(
  new core.HtmlClip(await core.HtmlSource.from('/test.html'), {
    position: {
      x: '50%',
      y: '15%',
    },
    anchor: 0.5,
    start: composition.findClips(core.VideoClip).at(0)?.stop.subtract(new core.Timestamp(6000)),
    stop: composition.duration
  })
);

(await composition.add(
  new core.AudioClip(await core.AudioSource.from('/audio.mp3'), {
    transcript: core.Transcript.fromJSON(captions).optimize(),
  })
)).generateCaptions();

await composition.add(
  new core.TextClip({
    text: "Basic text in Diffusion Studio",
    stop: 120,
    textAlign: 'center',
    textBaseline: 'middle',
    fontSize: 14,
    stroke: {
      width: 3,
      color: '#000000',
    },
    x: composition.width / 2,
    y: composition.height * 0.15,
  })
);

await composition.add(
  new core.ComplexTextClip({
    text: "Complex Text",
    stop: composition.duration,
    textAlign: 'center',
    textBaseline: 'middle',
    font: core.Font.fromFamily({ family: 'Geologica', weight: '800' }),
    textCase: 'upper',
    fontSize: 18,
    stroke: {
      width: 3,
      color: '#000000',
    },
    position: {
      y: '85%',
      x: '50%',
    },
    shadow: {
      alpha: 0.7,
      blur: 12,
      distance: 8,
    },
    styles: [{
      fillStyle: '#19fa2c'
    }],
    segments: [{
      start: 8,
      index: 0
    }]
  })
);

await composition.add(
  new core.ImageClip(
    await core.ImageSource.from('/dvd_logo.svg'),
    {
      stop: composition.duration,
      x(this: core.TextClip, time: core.Timestamp) {
        const width = typeof this.width == 'number' ? this.width : 0;
        const range = composition.width - width;
        const x = (time.seconds * 500) % (range * 2);

        return x > range ? range * 2 - x : x;
      },
      y(this: core.TextClip, time: core.Timestamp) {
        const height = typeof this.height == 'number' ? this.height : 0;
        const range = composition.height - height;
        const y = (time.seconds * 200) % (range * 2);

        return y > range ? range * 2 - y : y;
      },
    }
  )
);
