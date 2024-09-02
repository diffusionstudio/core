import * as core from '../src';
import { captions } from '../src/test/captions';

const app = document.getElementById('app');


const composition = new core.Composition({ background: '#76b7f5' });

const play = document.createElement('button')
play.innerText = 'Play';
play.onclick = () => composition.play();

const pause = document.createElement('button');
pause.innerText = 'Pause';
pause.onclick = () => composition.pause();

const seek = document.createElement('button');
seek.innerText = 'Seek 0';
seek.onclick = () => composition.seek(<core.frame>0);

const render = document.createElement('button');
render.innerText = 'Export';
render.onclick = () => new core.WebcodecsEncoder(composition, { debug: true }).export();

app!.appendChild(play);
app!.appendChild(pause);
app!.appendChild(seek);
app!.appendChild(render);


await composition.attachPlayer(app!);
composition.canvas!.style.transform = 'scale(0.4) translateY(20px)';
composition.canvas!.style.transformOrigin = 'top left';

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
