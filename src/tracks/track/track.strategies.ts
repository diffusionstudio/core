/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { insertModes } from './track.fixtures';
import { Timestamp } from '../../models';

import type { Clip } from '../../clips';
import type { InsertStrategy } from './track.interfaces';
import type { Track } from './track';

export class DefaultInsertStrategy implements InsertStrategy<'DEFAULT'> {
	public mode = insertModes[0];
	private pauseAlignmet = false;

	public add(clip: Clip, track: Track<Clip>): void {
		let isValid = true;

		for (let i = 0; i < track.clips.length; i++) {
			isValid = validate(clip, track.clips[i]);

			if (!isValid) break;

			alignWith(clip, track.clips[i]);
		}

		if (!isValid) return;

		track.clips.push(clip);
		track.clips.sort(startAsc);
	}

	public update(clip: Clip, track: Track<Clip>): void {
		if (this.pauseAlignmet) return;

		track.clips.sort(startAsc);

		for (let i = 0; i < track.clips.length; i++) {
			if (clip.id == track.clips[i].id) continue;

			if (!validate(clip, track.clips[i])) {
				break;
			}
			alignWith(clip, track.clips[i]);
		}
	}

	public offset(time: Timestamp, track: Track<Clip>): void {
		this.pauseAlignmet = true;

		for (const clip of track.clips) {
			clip.offsetBy(time);
		}

		this.pauseAlignmet = false;
	}
}

export class StackInsertStrategy implements InsertStrategy<'STACK'> {
	public mode = insertModes[1];

	public add(clip: Clip, track: Track<Clip>, index: number | undefined = undefined): void {
		let stop = -1;

		if (index != undefined && index > 0 || index == undefined) {
			stop = track.clips.at((index ?? 0) - 1)?.stop.millis ?? -1;
		}

		clip.offsetBy(new Timestamp(stop - clip.start.millis + 1));

		if (index == undefined) {
			track.clips.push(clip);
		} else {
			track.clips.splice(index, 0, clip);
			track.clips.slice(index + 1).forEach((c) => {
				c.offsetBy(clip.stop.subtract(clip.start));
			});
		}
	}

	public update(_: Clip, track: Track<Clip>): void {
		track.clips.sort(startAsc);

		let start = 0;

		for (const clip of track.clips) {
			if (clip.start.millis != start) {
				const offset = start - clip.start.millis;
				clip.offsetBy(new Timestamp(offset));
			}
			start = clip.stop.millis + 1;
		}
	}

	public offset(): void { }
}

function startAsc(a: Clip, b: Clip) {
	return a.start.millis - b.start.millis;
}

function alignWith(clip: Clip, target: Clip) {
	// overlaps with another clip in the beginning
	if (clip.start.millis >= target.start.millis && clip.start.millis <= target.stop.millis) {
		clip.start = target.stop.copy().addMillis(1);
	}
	// overlaps with another clip at the end
	if (clip.stop.millis >= target.start.millis && clip.stop.millis <= target.stop.millis) {
		clip.stop = target.start.copy().addMillis(-1);
	}
}

function validate(clip: Clip, target: Clip) {
	// clip is completly overlapping
	if (clip.start.millis >= target.start.millis && clip.stop.millis <= target.stop.millis) {
		// find a track that the clip could be added to
		const newTrack = target.track?.composition?.tracks.find((t) => {
			return (
				t.type == clip.type &&
				!t.clips.some((n) => {
					return (
						clip.id != n.id &&
						clip.start.millis >= n.start.millis &&
						clip.stop.millis <= n.stop.millis
					);
				})
			);
		});

		if (newTrack) {
			newTrack.add(clip.detach());
			return false;
		}

		target.track?.composition
			?.createTrack(clip.type)
			?.add(clip.detach() as never);

		return false;
	}

	return true;
}
