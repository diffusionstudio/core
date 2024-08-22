import * as core from '@diffusionstudio/core';
import { Settings } from './types';

export const settings: Settings = { height: 1920, width: 1080 };

export async function main(composition: core.Composition) {
  const sources = await Promise.all([
    core.VideoSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/minecraft_parkour_4k.mp4'),
    core.AudioSource.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/audio/elevenlabs_44100.mp3'),
    core.Transcript.from('https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/docs/ai_ft_coding_captions.json'),
  ]);

  const video = new core.VideoClip(sources[0])
    .set({ muted: true, position: 'center', height: '100%' });
  const audio = new core.AudioClip(sources[1])
    .set({ transcript: sources[2] });

  await composition.appendClip(video);
  await composition.appendClip(audio);

  /**
   * Default Tiktok captions clone
   */
  class TikTokCaptionPreset implements core.CaptionPresetStrategy {
    // required for serialization/deserialization
    public type = 'TIKTOK'

    // this is the required function that gets an empty track
    // and appends the text or complex text clips
    public async applyTo(track: core.CaptionTrack): Promise<void> {
      if (!track.clip?.transcript) return;

      const font = core.Font.fromFamily({ family: 'Montserrat', weight: '500' });

      // iter accepts the config parameters count, duration, length
      // count: determines the number of words in a group
      // duration: determines the duration of a group
      // length: determines the number of characters in a group
      // use a range of values to randomize the output e.g. [2, 6]
      for (const words of track.clip.transcript.iter({ duration: [4] })) {
        await track.appendClip(
          new core.TextClip({
            text: words.text,
            start: words.start,
            stop: words.stop,
            font,
            textAlign: 'center',
            fontSize: 14,
            stroke: {
              width: 4,
            },
            position: {
              x: '50%',
              y: '70%',
            },
            maxWidth: 700,
          })
        );
      }
    }
  }

  await composition.appendTrack(core.CaptionTrack)
    .from(audio)
    .create(TikTokCaptionPreset); // <- insert here

  composition.duration = audio.duration;
}
