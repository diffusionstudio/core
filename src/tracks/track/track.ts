/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Clip } from '../../clips';
import { arraymove } from '../../utils';
import { Serializer } from '../../services';
import { EventEmitterMixin } from '../../mixins';
import { DefaultInsertStrategy, StackInsertStrategy } from './track.strategies';

import type { Composition } from '../../composition';
import type { InsertMode, TrackPosition, TrackType } from './track.types';
import type { InsertStrategy } from './track.interfaces';
import type { frame } from '../../types';
import type { Renderer } from 'pixi.js';

export class Track<Clp extends Clip> extends EventEmitterMixin(Serializer) {
	/**
	 * Controls the visability of the track
	 */
	public disabled: boolean = false;

	/**
	 * The clips to be displayed
	 */
	public clips: Clp[] = [];

	/**
	 * Pointer to the expected track
	 */
	public pointer: number = 0;

	/**
	 * Reference to the composition
	 */
	public composition?: Composition;

	/**
	 * Id that can be used to search by kind
	 */
	public readonly type: TrackType = 'BASE';

	/**
	 * Controls how the clips should be inserted and updated
	 */
	public strategy: InsertStrategy<InsertMode> = new DefaultInsertStrategy();

	/**
	 * Connect the track with the composition
	 */
	public connect(composition: Composition): void {
		this.composition = composition;
	}

	/**
	 * Applies the stack property
	 */
	public stacked(value = true): this {
		if (value) {
			this.strategy = new StackInsertStrategy();
			// make sure to realign clips
			this.strategy.update(new Clip(), this);
		} else {
			this.strategy = new DefaultInsertStrategy();
		}

		this.trigger('update', undefined);

		return this;
	}

	/**
	 * Change the position of the track
	 */
	public position(position: TrackPosition): this {
		const tracks = this.composition?.tracks ?? [];
		const fromIndex = tracks.findIndex((n) => n.id == this.id);
		if (fromIndex == -1) return this;

		let toIndex = 0;
		if (position == 'bottom') toIndex = tracks.length;
		else if (position == 'top') toIndex = 0;
		else toIndex = position;

		arraymove(tracks, fromIndex, toIndex);

		this.trigger('update', undefined);
		return this;
	}

	/**
	 * Seek the provided frame if the track contains
	 * audio or video clips
	 */
	public seek(frame: frame): void {
		frame;
	}

	/**
	 * Move all clips of the track at once along the timeline
	 */
	public offsetBy(time: frame | Timestamp): this {
		if (typeof time == 'number') {
			this.strategy.offset(Timestamp.fromFrames(time), this);
		} else {
			this.strategy.offset(time, this);
		}

		return this;
	}

	/**
	 * Render the clip to the canvas
	 */
	public render(renderer: Renderer, time: number): void | Promise<void> {
		// case track doesn't contain tracks to render
		if (this.disabled || !this.clips.length || !this.clipRef) return;

		// clean up last rendered clip
		if (time < this.clipRef.start.millis || time > this.clipRef.stop.millis) {
			this.clipRef.unrender();
		}

		if (time > this.stop.millis || time < this.start.millis) return;

		// search for next clip to be rendered
		for (let idx = 0; idx < this.clips.length; idx++) {
			// start from current position and check all others
			const pointer = (this.pointer + idx) % this.clips.length;

			// get last and current clip
			const clip = this.clips[pointer];
			const last = this.clips[pointer - 1];

			// clip should be rendered
			if (time >= clip.start.millis && time <= clip.stop.millis) {
				this.pointer = pointer;
				return this.clipRef?.render?.(renderer, time);
			}

			// clip will be rendered next
			if (time < clip.start.millis && time > (last?.stop.millis ?? 0)) {
				this.pointer = pointer;
				return;
			}
		}
	}

	/**
	 * Add a new clip to the track
	 */
	public async appendClip(clip: Clp): Promise<this> {
		// only append clip if composition is initialized
		if (this.composition && !this.composition.renderer) {
			await new Promise(this.composition.resolve('init'));
		}

		try {
			await clip.connect(this);
			this.strategy.add(clip, this);

			clip.on('frame', () => {
				this.strategy.update(clip, this);
			});
			clip.on('detach', () => {
				this.strategy.update(clip, this);
			});

			this.bubble('frame', clip);
			this.bubble('update', clip);
			this.bubble('error', clip);
			this.bubble('attach', clip);
			this.bubble('detach', clip);
			this.bubble('load', clip);

			this.trigger('attach', undefined);
		} catch (error) {
			console.error(error);
		}

		return this;
	}

	/**
	 * Get the first visible frame of the clip
	 */
	public get stop(): Timestamp {
		return this.clips.filter((n) => !n.disabled).at(-1)?.stop ?? new Timestamp();
	}

	/**
	 * Get the last visible frame of the clip
	 */
	public get start(): Timestamp {
		return this.clips.filter((n) => !n.disabled).at(0)?.start ?? new Timestamp();
	}

	/**
	 * apply a function to all clips within the track
	 */
	public apply(fn: (value: Clp) => void): void {
		this.clips.forEach(fn);
	}

	/**
	 * Remove the track from the composition
	 */
	public detach(): this {
		const index = this.composition?.tracks.findIndex((n) => n.id == this.id);

		if (index == undefined || index == -1) {
			// The track is not connected to the composition
			return this;
		}

		this.composition?.tracks.splice(index, 1);
		this.trigger('detach', undefined);
		return this;
	}

	/**
	 * Get the clip that the pointer is
	 * currently referencing
	 */
	private get clipRef(): Clp | undefined {
		return this.clips[this.pointer];
	}
}
