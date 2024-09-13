/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { MediaClip } from '../media';
import { AudioSource } from '../../sources';
import { IOError } from '../../errors';

import type { Track } from '../../tracks';
import type { AudioClipProps } from './audio.interfaces';

export class AudioClip extends MediaClip<AudioClipProps> {
	public readonly type = 'audio';
	public declare track?: Track<AudioClip>;
	public source = new AudioSource();

	/**
	 * Access to the HTML5 audio element
	 */
	public readonly element = new Audio();

	public constructor(source?: File | AudioSource, props: AudioClipProps = {}) {
		super();

		if (source instanceof AudioSource) {
			this.source = source;
		}

		if (source instanceof File) {
			this.source.from(source);
		}

		this.element.addEventListener('play', () => {
			this.playing = true;
		});

		this.element.addEventListener('pause', () => {
			this.playing = false;
		});

		Object.assign(this, props);
	}

	public async init(): Promise<void> {
		const objectURL = await this.source.createObjectURL();
		this.element.setAttribute('src', objectURL);

		await new Promise<void>((resolve, reject) => {
			this.element.oncanplay = () => {
				this.duration.seconds = this.element.duration;
				this.state = 'READY';
				resolve();
			}

			this.element.onerror = () => {
				this.state = 'ERROR';

				const error = new IOError({
					code: 'sourceNotProcessable',
					message: 'An error occurred while processing the input medium.',
				});

				reject(this.element.error ?? error);
			}
		});
	}

	public update(): void | Promise<void> {
		if (this.track?.composition?.rendering) {
			return this.exit();
		} else if (this.track?.composition?.playing && !this.playing) {
			this.element.play();
		} else if (!this.track?.composition?.playing && this.playing) {
			this.element.pause();
		}
	}

	public exit(): void {
		if (this.playing) {
			this.element.pause();
		};
	}

	public copy(): AudioClip {
		const clip = AudioClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.source = this.source;

		return clip;
	}
}
