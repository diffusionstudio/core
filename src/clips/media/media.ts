/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp, Transcript } from '../../models';
import { AudioSource } from '../../sources';
import { AsyncMixin } from '../mixins';
import { RangeDeserializer } from './media.deserializer';
import { serializable, } from '../../services';
import { replaceKeyframes } from '../clip/clip.utils';
import { Clip } from '../clip';

import type { Track } from '../../tracks';
import type { float, frame } from '../../types';
import type { MediaClipProps } from './media.interfaces';


export class MediaClip<Props extends MediaClipProps = MediaClipProps> extends AsyncMixin(Clip<MediaClipProps>) {
	public readonly source = new AudioSource();
	public declare element?: HTMLAudioElement | HTMLVideoElement;

	@serializable(Timestamp)
	public _offset = new Timestamp();

	/**
	 * Is the media currently playing
	 */
	public playing: boolean = false;

	/**
	 * The duration of the media track
	 */
	@serializable(Timestamp)
	public readonly duration: Timestamp = new Timestamp();

	/**
	 * Trimmed start and stop values
	 */
	@serializable(RangeDeserializer)
	public range: [Timestamp, Timestamp] = [new Timestamp(), this.duration];

	/**
	 * Defines the transcript of the video/audio
	 */
	@serializable(Transcript)
	public transcript?: Transcript;

	public constructor(props: MediaClipProps = {}) {
		super();

		Object.assign(this, props);
	}

	public get start(): Timestamp {
		return this.range[0].add(this.offset);
	}

	public get stop(): Timestamp {
		return this.range[1].add(this.offset);
	}

	public set start(time: frame | Timestamp) {
		if (typeof time == 'number') {
			time = Timestamp.fromFrames(time);
		}

		const delta = time.subtract(this.offset);

		if (delta.millis >= 0 && delta.millis < this.range[1].millis) {
			// case in beetween valid range
			this.range[0].millis = delta.millis;
		} else if (delta.millis < 0) {
			// case lower than min value
			this.range[0].millis = 0;
		} else {
			// case larger than max value
			this.range[0].millis = this.range[1].millis - 1;
		}

		this.trigger('frame', undefined);
	}

	public set stop(time: frame | Timestamp) {
		if (typeof time == 'number') {
			time = Timestamp.fromFrames(time);
		}

		const delta = time.subtract(this.offset);

		// note, the upper range might be the duration so don't
		// change the reference? Is this well designed?
		if (delta.millis > this.range[0].millis && delta.millis <= this.duration.millis) {
			// case in beetween valid range
			this.range[1] = delta;
		} else if (delta.millis > this.duration.millis) {
			// case larger than max value
			this.range[1] = this.duration;
		} else {
			// case lower than min value
			this.range[1].millis = this.range[0].millis + 1;
		}

		this.trigger('frame', undefined);
	}

	/**
	 * Offest from frame 0 of the composition
	 */
	public get offset(): Timestamp {
		return this._offset;
	}

	/**
	 * Change clip's offset to zero in frames. Can be negative
	 */
	public set offset(time: frame | Timestamp) {
		if (typeof time == 'number') {
			this._offset.frames = time;
		} else {
			this._offset = time;
		}

		this.trigger('frame', this.offset.frames);
	}

	/**
	 * Offsets the clip by a given frame number
	 */
	public offsetBy(time: frame | Timestamp): this {
		if (typeof time == 'number') {
			this.offset.addFrames(time);
			this.trigger('offsetBy', Timestamp.fromFrames(time));
		} else {
			this.offset.addMillis(time.millis);
			this.trigger('offsetBy', time);
		}

		this.trigger('frame', undefined);

		return this;
	}

	public async connect(track: Track<MediaClip>): Promise<void> {
		if (['LOADING', 'IDLE'].includes(this.state)) {
			await new Promise(this.resolve('load'));
		};

		this.track = track;
		this.state = 'ATTACHED';

		this.trigger('attach', undefined);
	}

	/**
	 * Defines if the clip is currently muted
	 * @default false
	 */
	@serializable()
	public get muted(): boolean {
		return this.element?.muted ?? false;
	}

	public set muted(state: boolean) {
		if (!this.element) return;

		this.element.muted = state;
	}

	/**
	 * Set the media playback to a given frame
	 */
	public seek(frame: frame): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.element) {
				throw new Error("Can't seek on element becaused it's not defined");
			}
			if (frame < this.start.frames || frame > this.stop.frames) {
				frame = this.start.frames;
			}
			this.element.onerror = (e) => reject(e);
			this.element.pause();
			this.element.currentTime = Timestamp
				.fromFrames(frame)
				.subtract(this.offset)
				.seconds;
			this.element.onseeked = () => resolve();
		});
	}

	/**
	 * Returns a slice of a media clip with trimmed start and stop
	 */
	public subclip(start?: frame | Timestamp, stop?: frame | Timestamp): this {
		// start or stop is undefined
		if (!start) start = this.range[0];
		if (!stop) stop = this.range[1];

		if (typeof start == 'number') {
			start = Timestamp.fromFrames(start);
		}

		if (typeof stop == 'number') {
			stop = Timestamp.fromFrames(stop);
		}

		// start is larger than the stop
		if (start.millis >= stop.millis) {
			throw new Error("Start can't lower than or equal the stop");
		}
		// start and/or stop are out of bounds
		if (start.millis < 0) {
			this.range[0].millis = 0;
			start = this.range[0];
		}
		// if the duration is 0, the object has not yet been loaded fully
		if (stop.millis > this.duration.millis && this.duration.millis) {
			stop = this.duration;
		}

		this.range = [start, stop];
		this.trigger('frame', undefined);
		return this;
	}

	/**
	 * Number between 0 and 1 defining the volume of the media
	 * @default 1;
	 */
	@serializable()
	public get volume(): float {
		return this.element?.volume ?? 1;
	}

	public set volume(volume: float) {
		if (!this.element) return;

		this.element.volume = volume;
	}

	public copy(): MediaClip {
		return MediaClip.fromJSON(JSON.parse(JSON.stringify(this)));
	}

	public async split(time?: frame | Timestamp): Promise<this> {
		if (!time) {
			time = this.track?.composition?.frame;
		}
		if (typeof time == 'number') {
			time = Timestamp.fromFrames(time);
		}

		// invalid cases
		if (!time || time.millis <= this.start.millis || time.millis >= this.stop.millis) {
			throw new Error("Cannot split clip at the specified time")
		}
		if (!this.track) {
			throw new Error('Split must be connected to a track')
		}

		// slice relative to the offset
		time = time.subtract(this.offset);

		const copy = this.copy() as this;
		this.range[1] = time.copy();
		copy.range[0] = time.copy().addMillis(1);

		replaceKeyframes(copy, copy.start.subtract(this.start));

		await this.track.add(copy);

		return copy;
	}

	public set(props?: Props): this {
		return super.set(props);
	}
}
