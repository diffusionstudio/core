/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import type { hex, int } from '../../types';
import type { Font } from './font';

/**
 * Defines the vertical alignment of the text.
 * This key also sets the anchor point.
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Defines the horizonal alignment of the text.
 * This key also sets the anchor point.
 */
export type TextBaseline = 'alphabetic' | 'top' | 'hanging' | 'middle' | 'ideographic' | 'bottom';

export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'round' | 'bevel' | 'miter';

/**
 * Defines the stroke properties that
 * can be applied to a text
 */
export type Stroke = {
	/** 
	 * The alpha value to use for the fill. 
	 */
	alpha?: number;
	/** 
	 * The color to use for the fill. 
	 */
	color?: hex;
	/** 
	 * The width of the stroke. 
	 */
	width?: number;
	/** 
	 * The line join style to use.
	 */
	join?: LineJoin;
	/** 
	 * The miter limit to use. 
	 */
	miterLimit?: number;
};

/**
 * Defines the text casing
 */
export type TextCase = 'upper' | 'lower';

/**
 * Defines the text shadow
 */
export type TextShadow = {
	/** Set alpha for the drop shadow  */
	alpha: number;
	/** Set a angle of the drop shadow */
	angle: number;
	/** Set a shadow blur radius */
	blur: number;
	/** A fill style to be used on the  e.g., '#00FF00' */
	color: hex;
	/** Set a distance of the drop shadow */
	distance: number;
};

/**
 * Defines the thickness/weight of the font
 */
export type fontWeight =
	| 'normal'
	| 'bold'
	| 'bolder'
	| 'lighter'
	| '100'
	| '200'
	| '300'
	| '400'
	| '500'
	| '600'
	| '700'
	| '800'
	| '900';

export type TextSegment = {
	/**
	 * Defines the index of the style object,
	 * leave undefined for default styles
	 */
	index?: number;
	/**
	 * Defines the start of the style segment
	 */
	start: number;
	/**
	 * Defines the stop of the style segment, leave
	 * undefined when it's the end of the text
	 */
	stop?: number;
};

export type RenderSplit = {
	/**
	 * Defines the index of the style object,
	 * leave undefined for default styles
	 */
	index?: number;
	/**
	 * Defines the tokens to be rendered
	 */
	tokens: string[];
};

export type StyleOption = {
	fillStyle?: string;
	fontSize?: number;
	stroke?: Stroke;
	font?: Font;
};

export type Background = {
	/**
	 * @default #000000
	 */
	fill?: string;
	/**
	 * @default 1
	 */
	alpha?: number;
	/**
	 * @default 20
	 */
	borderRadius?: number;
	/**
	 * @default { x: 40, y: 10 }
	 */
	padding?: { x: int; y: int };
};
