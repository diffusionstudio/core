/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Serializer, serializable } from '../../services';
import { EventEmitterMixin } from '../../mixins';
import { Container } from 'pixi.js';
import { toggle } from './clip.decorator';
import { replaceKeyframes } from './clip.utils';

import type { Renderer } from 'pixi.js';
import type { ClipEvents, ClipState, ClipType } from './clip.types';
import type { frame } from '../../types';
import type { Track } from '../../tracks';
import type { Source } from '../../sources';
import type { ClipProps } from './clip.interfaces';


export class Clip<Props extends ClipProps = ClipProps> extends EventEmitterMixin<ClipEvents, typeof Serializer>(Serializer) {
	@serializable()
	public _name: undefined | string;

	@serializable(Timestamp)
	public _start: Timestamp = new Timestamp();

	@serializable(Timestamp)
	public _stop: Timestamp = Timestamp.fromSeconds(16);

	/**
	 * Defines the type of the clip
	 */
	public readonly type: ClipType = 'BASE';

	/**
	 * Defines the source of the clip with a
	 * one-to-many (1:n) relationship
	 */
	public source?: Source;

	/**
	 * The container that contains the render related information
	 */
	public readonly container = new Container();

	/**
	 * Timestamp when the clip has been created
	 */
	public readonly createdAt: Date = new Date();

	/**
	 * Controls the visability of the clip
	 */
	@serializable()
	public disabled = false;

	/**
	 * Track is ready to be rendered
	 */
	public state: ClipState = 'IDLE';

	/**
	 * Access the parent track
	 */
	public track?: Track<Clip>;

	/**
	 * Human readable identifier ot the clip
	 */
	public get name(): string | undefined {
		return this._name ?? this.source?.name;
	}

	public set name(name: string) {
		this._name = name;
	}

	/**
	 * Get the first visible frame
	 */
	public get start(): Timestamp {
		return this._start;
	}

	/**
	 * Get the last visible frame
	 */
	public get stop(): Timestamp {
		return this._stop;
	}

	public constructor(props: ClipProps = {}) {
		super();

		Object.assign(this, props);
	}

	/**
	 * Call this function to connect the clip to the track
	 */
	public async connect(track: Track<Clip>): Promise<void> {
		this.state = 'ATTACHED';
		this.track = track;

		this.trigger('attach', undefined);
	}

	/**
	 * Change clip's offset to zero in seconds. Can be negative
	 */
	public set start(time: frame | Timestamp) {
		if (typeof time == 'number') {
			this.start.frames = time;
		} else {
			this._start = time;
		}

		if (this.start.millis >= this.stop.millis) {
			// make stop one frame larger than the start
			this.stop.millis = this.start.millis + 1;
		}

		this.trigger('frame', this.start.frames);
	}

	/**
	 * Set the last visible time that the
	 * clip is visible
	 */
	public set stop(time: frame | Timestamp) {
		if (typeof time == 'number') {
			this.stop.frames = time;
		} else {
			this._stop = time;
		}

		if (this.stop.millis <= this.start.millis) {
			// make start one frame smaller than the stop
			this.start.millis = this.stop.millis - 1;
		}

		this.trigger('frame', this.stop.frames);
	}

	/**
	 * Offsets the clip by a given frame number
	 */
	public offsetBy(time: frame | Timestamp): this {
		if (typeof time == 'number') {
			this.start.addFrames(time);
			this.stop.addFrames(time);
			this.trigger('offsetBy', Timestamp.fromFrames(time));
		} else {
			this.start.addMillis(time.millis);
			this.stop.addMillis(time.millis);
			this.trigger('offsetBy', time);
		}

		this.trigger('frame', undefined);

		return this;
	}

	/**
	 * Render the current frame
	 */
	@toggle
	public render(renderer: Renderer, time: number): void | Promise<void> {
		renderer.render({ container: this.container, clear: false }); time;
	}

	/**
	 * Will be called after the last visible
	 * frame has been rendered
	 */
	public unrender(): void { }

	/**
	 * Remove the clip from the track
	 */
	public detach(): this {
		const index = this.track?.clips.findIndex((n) => n.id == this.id);

		if (this.state == 'ATTACHED') {
			this.state = 'READY';
		}

		if (index == undefined || index == -1) {
			console.info('The clip is not connected to any track');
			return this;
		}

		this.track?.clips.splice(index, 1);
		this.trigger('detach', undefined);
		return this;
	}

	/**
	 * Split the clip into two clips at the specified time
	 * @param time split, will use the current frame of the composition 
	 * a fallback
	 * @returns The clip that was created by performing this action
	 */
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

		const copy = this.copy() as this;
		this.stop = time.copy();
		copy.start = time.copy().addMillis(1);

		replaceKeyframes(copy, copy.start.subtract(this.start));

		await this.track.appendClip(copy);

		return copy;
	}

	/**
	 * Create a copy of the clip
	 */
	public copy(): Clip {
		return Clip.fromJSON(JSON.parse(JSON.stringify(this)));
	}

	/**
	 * Modify the properties of the clip and 
	 * trigger an update afterwards
	 */
	public set(props?: Props): this {
		if (props) Object.assign(this, props);

		this.trigger('update', undefined);

		return this;
	}
}