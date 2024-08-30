/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { WebFonts } from './font.fixtures';
import type { FONT_WEIGHTS } from './font.static';

/**
 * Defines all available font families
 */
export type FontFamily = keyof typeof WebFonts | string;

/**
 * Defines all available font weights
 */
export type FontWeight = keyof typeof FONT_WEIGHTS;

/**
 * Defines the style of the font
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * Defines all available font subsets which
 * limit the number of characters
 */
export type FontSubset = 'latin' | 'latin-ext' | 'vietnamese' | 'cyrillic' | 'cyrillic-ext';

/**
 * Defines the source where the font is coming from
 */
export type FontType = 'local' | 'web';

/**
 * Defines the properties that are required
 * to load a new font
 */
export type FontSource = {
	/**
	 * Name of the Family
	 * @example 'Arial'
	 */
	family: string;
	/**
	 * Source of the Variant
	 * @example url(arial.ttf)
	 */
	source: string;
	/**
	 * Defines the font style
	 * @example 'italic'
	 */
	style?: string;
	/**
	 * The weight of the font
	 * @example '400'
	 */
	weight?: string;
};

/**
 * Defines a single font that has one or
 * more variants
 */
export type FontSources = {
	family: string;
	variants: FontSource[];
};

/**
 * Defines the arguments to identify
 * a default webfont
 */
export type WebfontProperties<T extends keyof typeof WebFonts> = {
	family: T;
	weight: typeof WebFonts[T]['weights'][number];
};
