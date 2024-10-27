/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { autoDetectRenderer, Container } from 'pixi.js';
import { framesToMillis, Timestamp, FPS_DEFAULT } from '../models';
import { MediaClip } from '../clips';
import { Serializer } from '../services';
import { TrackDeserializer } from '../tracks';
import { isClass } from '../utils';
import { EventEmitterMixin } from '../mixins';
import { BaseError } from '../errors';

import type { Clip } from '../clips';
import type { Renderer } from 'pixi.js';
import type { float, frame } from '../types';
import type { Track, TrackType } from '../tracks';
import type {
	CompositionEvents,
	CompositionSettings,
	CompositionState,
	ScreenshotImageFormat,
} from './composition.types';


export class Composition extends EventEmitterMixin<CompositionEvents, typeof Serializer>(Serializer) {
	private _duration = new Timestamp();

	/**
	 * Access to the underlying pixijs renderer
	 */
	public renderer?: Renderer;

	/**
	 * The root container of the composition
	 */
	public stage = new Container();

	/**
	 * Settings of the composition
	 */
	public settings: CompositionSettings;

	/**
	 * Tracks attached to the composition
	 */
	public tracks: Track<Clip>[] = [];

	/**
	 * The current frame that the playback is set to
	 */
	public frame: frame = 0;

	/**
	 * User defined fixed duration, use the duration
	 * property to set this value
	 */
	public fixedDuration?: Timestamp;

	/**
	 * Defines the current state of the composition
	 */
	public state: CompositionState = 'IDLE';

	/**
	 * Defines the fps used for rendering.
	 */
	public fps: float = FPS_DEFAULT;

	/**
	 * Get the canvas element that has been
	 * added to the dom
	 */
	public canvas?: HTMLCanvasElement;

	/**
	 * Defines the context of the external
	 * canvas element
	 */
	private context?: CanvasRenderingContext2D;

	public constructor({
		height = 1080,
		width = 1920,
		background = '#000000',
		backend = 'webgpu',
	}: Partial<CompositionSettings> = {}) {
		super();

		this.settings = { height, width, background, backend };

		this.on('update', this.update.bind(this));
		this.on('attach', this.update.bind(this));
		this.on('detach', this.update.bind(this));
		this.on('load', this.update.bind(this));
		this.on('frame', this.update.bind(this));
		this.on('error', this.update.bind(this));

		autoDetectRenderer({ ...this.settings, preference: backend })
			.then(renderer => {
				this.renderer = renderer;
				this.trigger('init', undefined);
			})
			.catch(error => {
				console.error(error);
				this.trigger('error', new BaseError({
					code: 'backendDetectionError',
					message: `${error}`
				}));
			});
	}

	/**
	 * The realtime playback has started
	 */
	public get playing(): boolean {
		return this.state == 'PLAY';
	}

	/**
	 * Composition is rendering in
	 * non realtime
	 */
	public get rendering(): boolean {
		return this.state == 'RENDER';
	}

	/**
	 * Get the current width of the canvas
	 */
	get width(): number {
		return this.settings.width;
	}

	/**
	 * Get the current height of the canvas
	 */
	get height(): number {
		return this.settings.height;
	}

	/**
	 * This is where the playback stops playing
	 */
	public get duration(): Timestamp {
		if (this.fixedDuration) {
			return this.fixedDuration;
		}
		return this._duration;
	}

	/**
	 * Limit the total duration of the composition
	 */
	public set duration(time: frame | Timestamp | undefined) {
		if (!time) {
			this.fixedDuration = undefined;
		} else if (time instanceof Timestamp) {
			this.fixedDuration = time;
		} else {
			this.fixedDuration = Timestamp.fromFrames(time);
		}

		this.trigger('frame', this.fixedDuration?.frames ?? 0);
	}

	/**
	 * Set the player as a child of the given html div element
	 */
	public attachPlayer(element: HTMLElement): void {
		if (!this.canvas) {
			this.canvas = document.createElement('canvas');
			this.canvas.height = this.settings.height;
			this.canvas.width = this.settings.width;
			this.canvas.style.background = 'black';
			this.context = this.canvas.getContext('2d')!;
			this.context.imageSmoothingEnabled = false;
			this.computeFrame();
		}

		element.appendChild(this.canvas);
	}

	/**
	 * Remove the player from the dom
	 */
	public detachPlayer(element: HTMLElement): void {
		if (this.canvas) {
			element.removeChild(this.canvas);
		}
	}

	/**
	 * Append a new track, it will be inserted at 
	 * index 0 and rendered last (top layer)
	 */
	public shiftTrack<L extends Track<Clip>>(Track: (new () => L) | L): L {
		// Check if track has been instantiated
		const track = typeof Track == 'object' ? Track : new Track();

		track.connect(this);

		this.stage.addChild(track.view);
		this.tracks.unshift(track);

		track.bubble(this);
		this.trigger('update', undefined);

		return track;
	}

	/**
	 * Create a track with the given type
	 * @param type the desired type of the track
	 * @returns A new track
	 */
	public createTrack<T extends TrackType>(type: T) {
		const track = TrackDeserializer.fromType({ type });
		this.shiftTrack(track);

		return track;
	}

	/**
	 * Convenience function for appending a track
	 * aswell as the clip to the composition
	 */
	public async add<L extends Clip>(clip: L): Promise<L> {
		const track = this.createTrack(clip.type);
		await track.add(clip as never);

		return clip;
	}

	/**
	 * Remove a given clip from the composition
	 * @returns `Clip` when it has been successfully removed `undefined` otherwise
	 */
	public remove<L extends Clip>(clip: L): L | undefined {
		for (const track of this.tracks) {
			if (track.clips.find(c => c.id == clip.id)) {
				return track.remove(clip);
			}
		}
	}

	/**
	 * Remove all tracks that are of the specified type
	 * @param track type to be removed
	 */
	public removeTracks(Track: new (composition: Composition) => Track<Clip>): Track<Clip>[] {
		const removed = this.tracks.filter((track) => track instanceof Track);
		this.tracks = this.tracks.filter((track) => !(track instanceof Track));

		return removed;
	}

	/**
	 * Find tracks that match the profided parameters
	 */
	public findTracks<T extends Track<Clip>>(
		predicate: ((value: Track<Clip>) => boolean) | (new () => T),
	): T[] {
		return this.tracks.filter((track) => {
			let matches: boolean;

			if (isClass(predicate)) {
				matches = track instanceof predicate;
			} else {
				// @ts-ignore
				matches = predicate(track);
			}
			return matches;
		}) as T[];
	}

	/**
	 * Find clips that match the profided parameters
	 */
	public findClips<T extends Clip>(
		predicate: ((value: Clip) => boolean) | (new () => T),
	): T[] {
		const clips: T[] = [];

		for (const track of this.tracks) {
			for (const clip of track.clips) {
				let matches: boolean;

				if (isClass(predicate)) {
					matches = clip instanceof predicate;
				} else {
					// @ts-ignore
					matches = predicate(clip);
				}

				if (matches) {
					clips.push(clip as any);
				}
			}
		}
		return clips;
	}

	/**
	 * Compute the currently active frame
	 */
	public computeFrame(): void {
		if (!this.renderer) return;

		for (let i = 0; i < this.tracks.length; i++) {
			this.tracks[i].update(Timestamp.fromFrames(this.frame));
		}

		this.renderer.render(this.stage);
		this.context?.clearRect(0, 0, this.settings.width, this.settings.height);
		this.context?.drawImage(this.renderer.canvas, 0, 0);

		this.trigger('currentframe', this.frame);

		if (this.playing) {
			this.frame++;
		}
	}

	/**
	 * Take a screenshot of the still frame
	 */
	public screenshot(format: ScreenshotImageFormat = 'png', quality = 1): string {
		this.computeFrame();

		if (!this.renderer) {
			throw new BaseError({
				code: 'rendererNotDefined',
				message: 'Please wait until the renderer is defined'
			})
		}

		return this.renderer.canvas.toDataURL(`image/${format}`, quality);
	}

	/**
	 * Set the playback position to a specific time
	 * @param value new playback time
	 */
	public async seek(value: frame | Timestamp) {
		if (typeof value == 'number') {
			this.frame = Math.round(value > 0 ? value : 0);
		} else {
			this.frame = value.frames > 0 ? value.frames : 0;
		}

		if (this.playing) {
			this.pause();
		}

		for (const track of this.tracks) {
			await track.seek(Timestamp.fromFrames(this.frame));
		}

		// prevents video frame from being closed
		if (!this.rendering) {
			this.computeFrame();
		}
	}

	/**
	 * Play the composition
	 */
	public async play(): Promise<void> {
		if (this.rendering) return;

		this.state = 'PLAY';

		if (this.frame >= this.duration.frames) {
			this.frame = 0;
		}

		for (const track of this.tracks) {
			await track.seek(Timestamp.fromFrames(this.frame));
		}

		this.ticker();
		this.trigger('play', this.frame);
	}

	/**
	 * Pause the composition
	 */
	public async pause(): Promise<void> {
		this.state = 'IDLE';
		this.computeFrame();
		this.trigger('pause', this.frame);
	}

	public async audio(numberOfChannels = 2, sampleRate = 48000): Promise<AudioBuffer> {
		const length = this.duration.seconds * sampleRate;
		const context = new OfflineAudioContext({
			sampleRate,
			length,
			numberOfChannels,
		});

		const output = context.createBuffer(numberOfChannels, length, sampleRate);

		for (const clip of this.findClips(MediaClip)) {
			if (clip.disabled || clip.muted || clip.track?.disabled) {
				continue;
			}

			const offset = Math.round(clip.offset.seconds * output.sampleRate);
			const start = Math.round(clip.range[0].seconds * output.sampleRate);
			const stop = Math.round(clip.range[1].seconds * output.sampleRate);

			try {
				const buffer = await clip.source.decode(numberOfChannels, sampleRate);
				const lastChannel = buffer.numberOfChannels - 1;

				for (let i = 0; i < numberOfChannels; i++) {
					const outputData = output.getChannelData(i);
					const bufferData = buffer.getChannelData(
						i > lastChannel ? lastChannel : i, // important for mono audio tracks
					);

					for (let i = 0; i < outputData.length - 1; i++) {
						if (i < offset + start || i > offset + stop || i - offset < 0) {
							continue;
						}

						outputData[i] += (bufferData[i - offset] ?? 0) * clip.volume;
						// make sure the value is between -1 and 1;
						if (outputData[i] > 1) outputData[i] = 1;
						if (outputData[i] < -1) outputData[i] = -1;
					}

					output.getChannelData(i).set(outputData);
				}
			} catch (_) { }
		}

		return output;
	}

	/**
	 * Get the current playback time and composition
	 * duration formatted as `00:00 / 00:00` by default.
	 * if **hours** is set the format is `HH:mm:ss` whereas
	 * **milliseconds** will return `mm:ss.SSS`
	 */
	public time(precision?: { hours?: boolean; milliseconds?: boolean }) {
		const millis = framesToMillis(this.frame);

		const start = precision?.hours ? 11 : 14;
		const stop = precision?.milliseconds ? 23 : 19;

		return (
			new Date(millis).toISOString().slice(start, stop) +
			' / ' +
			new Date(this.duration.millis).toISOString().slice(start, stop)
		);
	}

	/**
	 * Remove a given track from the composition
	 * @returns `Track` when it has been successfully removed `undefined` otherwise
	 */
	public removeTrack<T extends Track<Clip>>(track: T): T | undefined {
		const index = this.tracks.findIndex((t) => t.id == track.id);

		if (track.view.parent) {
			this.stage.removeChild(track.view);
		}

		if (index != undefined && index >= 0) {
			this.tracks.splice(index, 1);
			this.trigger('detach', undefined);
			return track;
		}
	}

	private async ticker() {
		const interval = 1000 / FPS_DEFAULT;

		let then = performance.now();
		let delta = 0;
		do {
			const now = await new Promise(requestAnimationFrame);
			if (now - then < interval - delta) {
				continue;
			}
			delta = Math.min(interval, delta + now - then - interval);
			then = now;
			this.computeFrame();
		} while (this.frame <= this.duration.frames && this.playing);

		// reached end of composition
		if (this.playing) {
			this.seek(0);
		}
	}

	/**
	 * Updates the state of the composition
	 */
	private update(): void {
		this._duration.frames = Math.max(
			...this.tracks
				.filter((track) => !track.disabled)
				.map((track) => track.stop?.frames ?? 0),
			0
		);

		this.computeFrame();
	}
}
