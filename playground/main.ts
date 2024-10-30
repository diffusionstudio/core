import * as core from '../src';
import { captions } from '../src/test/captions';
import { setupControls } from './controls';
import { setupTimeline } from './timeline';

const composition = new core.Composition({ background: '#76b7f5' });

setupControls(composition);
setupTimeline(composition);

const videoSource = await core.VideoSource.from('/sample_aac_h264_yuv420p_1080p_60fps.mp4');

// const track = new core.VideoTrack();

// await track.add(new core.VideoClip(videoSource, {
//   volume: 0.1,
//   anchor: 0.5,
//   position: 'center',
//   height: '100%',
// })
//   .subclip(30, 60)
//   .offsetBy(-30));

// await track.add(
//   new core.VideoClip(videoSource, {
//     volume: 0.1,
//     anchor: 0.5,
//     position: 'center',
//     height: '100%',
//   })
//     .subclip(90, 120)
//     .offsetBy(-30)
// );

// await composition.shiftTrack(track);

const video = await composition.add(
  new core.VideoClip(await core.VideoSource
    .from('/sample_aac_h264_yuv420p_1080p_60fps.mp4'), {
    volume: 0.1,
    anchor: 0.5,
    position: 'center',
    height: '100%',
  })
    .subclip(30, 540)
    .offsetBy(30)
);

video.animate()
  .alpha(0.5).to(1, 120).to(0.5, 120).to(1, 60)
  .scale(0.1, 0, 'easeIn').to(1, 30)
  .rotation(0, 0, 'easeOut').to(360, 30)

await composition.add(
  new core.VideoClip(videoSource, {
    position: 'center',
    height: '100%',
  }).subclip(0, 30)
);

const image = await composition.add(
  new core.ImageClip(await core.ImageSource.from('/lenna.png'), {
    position: 'center',
    height: 600,
  })
);

image.animate()
  .rotation(-16).to(14, 5).to(-7, 10).to(24, 7).to(-3, 9).to(19, 7).to(-14, 12).to(5, 9).to(-30, 13)
  .translateX(1700, 0, 'easeOut').to(-1400, 40)
  .scale(2).to(1, 40);

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
)).addCaptions();

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
  new core.ImageClip(await core.ImageSource.from('/dvd_logo.svg'), {
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
  })
);
