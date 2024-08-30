/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Keyframe } from '../../models';

import type { Position } from '../../types';

export class Deserializer1D {
	public static fromJSON<T extends string | number>(json: any) {
		if (typeof json == 'object') {
			return Keyframe.fromJSON<T>(json);
		}

		return json;
	}
}

export class Deserializer2D {
	public static fromJSON(json: Position) {
		if (typeof json.x == 'object') {
			json.x = Keyframe.fromJSON(json.x);
		}
		if (typeof json.y == 'object') {
			json.y = Keyframe.fromJSON(json.y);
		}

		return json;
	}
}
