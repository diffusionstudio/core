/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Timestamp } from '../../models';
import { Clip } from '../../clips';
import { Container } from 'pixi.js';
import { arraymove } from '../../utils';
import { Serializer } from '../../services';
import { EventEmitterMixin } from '../../mixins';
import { DefaultInsertStrategy, StackInsertStrategy } from './track.strategies';

import type { Composition } from '../../composition';
import type { InsertMode, TrackLayer, TrackType } from './track.types';
import type { InsertStrategy } from './track.interfaces';
import type { frame } from '../../types';

type Events = {
	update: any;
	frame: number | undefined;
	attach: undefined;
	detach: undefined;
}

export class Track<Clp extends Clip> extends EventEmitterMixin<Events, typeof Serializer>(Serializer) {
	private _disabled: boolean = false;

	public view = new Container();

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
	public readonly type: TrackType = 'base';

	/**
	 * Controls how the clips should be inserted and updated
	 */
	public strategy: InsertStrategy<InsertMode> = new DefaultInsertStrategy();

	/**
	 * Controls the visability of the track
	 */
	public get disabled(): boolean {
		return this._disabled;
	}

	public set disabled(value: boolean) {
		if (value && this.clipRef && inGraph(this.clipRef)) {
			this.view.removeChild(this.clipRef.view);
			this.clipRef?.exit();
		}

		this._disabled = value;

		this.trigger('update', undefined);
	}

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
	 * Change the layer of the track
	 */
	public layer(layer: TrackLayer): this {
		const tracks = this.composition?.tracks ?? [];
		const fromIndex = tracks.findIndex((n) => n.id == this.id);
		const lastIndex = tracks.length - 1;
		if (fromIndex == -1) return this;

		let toIndex = 0;
		if (layer == 'bottom') toIndex = lastIndex;
		else if (layer == 'top') toIndex = 0;
		else if (layer < 0) toIndex = 0;
		else if (layer > lastIndex) toIndex = lastIndex;
		else toIndex = layer;

		arraymove(tracks, fromIndex, toIndex);
		this.composition?.stage.setChildIndex(this.view, lastIndex - toIndex);

		this.trigger('update', undefined);
		return this;
	}

	/**
	 * Seek the provided time if the track contains
	 * audio or video clips
	 */
	public seek(time: Timestamp): void {
		time;
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
	 * Triggered when the track is redrawn
	 */
	public update(time: Timestamp): void | Promise<void> {
		// case track doesn't contain tracks to render
		if (this.disabled || !this.clips.length) return;

		const { millis } = time;

		// the clip has left the stage
		if (inGraph(this.clipRef) && (!inRange(millis, this.clipRef) || this.clipRef?.disabled)) {
			this.clipRef && this.view.removeChild(this.clipRef.view);
			this.clipRef?.exit(); // call after remove
		}

		if (!inRange(millis, this)) return;

		// search for next clip to be rendered
		for (let idx = 0; idx < this.clips.length; idx++) {
			// start from current position and check all others
			const pointer = (this.pointer + idx) % this.clips.length;

			// get last and current clip
			const clip = this.clips[pointer];
			const last = this.clips[pointer - 1];

			// clip should be rendered
			if (inRange(millis, clip) && !clip.disabled) {
				this.pointer = pointer;

				// the clip has entered the stage
				if (!inGraph(clip)) {
					clip.enter(); // call before add
					this.view.addChild(clip.view);
				}

				return clip.update(time);
			}

			// clip will be rendered next
			if (millis < clip.start.millis && millis > (last?.stop.millis ?? 0)) {
				this.pointer = pointer;
				return;
			}
		}
	}

	/**
	 * Adds a new clip to the track
	 * @param clip The clip to add
	 * @param index The index to insert the clip at, will be ignored if track is not stacked
	 * @throws Error if the clip can't be added
	 */
	public async add(clip: Clp, index?: number): Promise<Clp> {
		// only append clip if composition is initialized
		if (this.composition && !this.composition.renderer) {
			await new Promise(this.composition.resolve('init'));
		}

		await clip.init();
		await clip.connect(this);
		await this.strategy.add(clip, this, index);

		clip.on('frame', () => {
			this.strategy.update(clip, this);
		});
		clip.bubble(this);

		this.trigger('attach', undefined);

		return clip;
	}

	/**
	 * Remove a given clip from the track
	 * @returns `Track` when it has been successfully removed `undefined` otherwise
	 */
	public remove<L extends Clp>(clip: L): L | undefined {
		const index = this.clips.findIndex((c) => c.id == clip.id);

		if (clip.state == 'ATTACHED') {
			clip.state = 'READY';
		}

		if (clip.view.parent) {
			this.view.removeChild(clip.view);
		}

		if (index != undefined && index >= 0) {
			this.clips.splice(index, 1);
			this.strategy.update(clip, this);
			this.trigger('detach', undefined);

			return clip;
		}
	}

	/**
	 * Get the first visible frame of the clip
	 */
	public get stop(): Timestamp {
		return this.clips.at(-1)?.stop ?? new Timestamp();
	}

	/**
	 * Get the last visible frame of the clip
	 */
	public get start(): Timestamp {
		return this.clips.at(0)?.start ?? new Timestamp();
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
		this.composition?.removeTrack(this);

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

/**
 * Check if a clip or track should be rendered
 * @param millis Time in milliseconds
 * @param node A clip or track
 * @returns True if the time is between the start and stop of the clip/track
 */
function inRange(time: number, node?: Track<Clip> | Clip): boolean {
	if (!node) return false;

	return time >= node.start.millis && time <= node.stop.millis;
}

/**
 * Check if the clip is part of the scene graph to render
 * @param clip The clip to verify
 * @returns True if the clip is part of the scene graph
 */
function inGraph(clip?: Clip): boolean {
	if (!clip) return false;

	return !!clip.view.parent;
}
