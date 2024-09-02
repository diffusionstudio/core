/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { MediaClip } from '../media';
import { toggle } from '../clip';
import { AudioSource } from '../../sources';

import type { Track } from '../../tracks';
import type { AudioClipProps } from './audio.interfaces';

export class AudioClip extends MediaClip<AudioClipProps> {
	public readonly type = 'audio';
	public declare track?: Track<AudioClip>;
	/**
	 * Access to the HTML5 audio element
	 */
	public readonly element = new Audio();
	public readonly source = new AudioSource();

	public constructor(source?: File | AudioSource, props: AudioClipProps = {}) {
		super();

		this.element.addEventListener('canplay', () => {
			if (['READY', 'ATTACHED'].includes(this.state)) return;

			this.duration.seconds = this.element.duration;

			this.state = 'READY';
			this.trigger('load', undefined);
		});

		this.element.addEventListener('emptied', () => {
			this.playing = false;
			this.state = 'IDLE';
			if (this.track) this.detach();
		});

		this.element.addEventListener('error', () => {
			console.log(this.element.error);
			this.state = 'ERROR';
			if (this.track) this.detach();
			this.trigger('error', new Error('An error occurred while processing the input medium.'));
		});

		this.element.addEventListener('play', () => {
			this.playing = true;
		});

		this.element.addEventListener('pause', () => {
			this.playing = false;
		});

		this.load(source);
		Object.assign(this, props);
	}

	public unrender(): void {
		if (this.playing) {
			this.element.pause();
		};
	}

	@toggle
	public render(): void | Promise<void> {
		if (this.track?.composition?.rendering) {
			return this.unrender();
		} else if (this.track?.composition?.playing && !this.playing) {
			this.element.play();
		} else if (!this.track?.composition?.playing && this.playing) {
			this.element.pause();
		}
	}

	public copy(): AudioClip {
		const clip = AudioClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.load(this.source);

		return clip;
	}
}
