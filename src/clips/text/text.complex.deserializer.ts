/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Font } from './font';

import type * as types from './text.types';

export class StylesDeserializer {
	public static fromJSON(obj: types.StyleOption[]) {
		return obj.map(item => {
			if (item.font) {
				item.font = Font.fromJSON(item.font);
			}
			return item;
		})
	}
}
