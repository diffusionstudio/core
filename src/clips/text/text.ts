/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { Clip } from '../clip';
import { serializable } from '../../services';
import { VisualMixin, visualize } from '../mixins';
import { Font } from './font';
import { Color, Text, TextStyle } from 'pixi.js';
import { SCALE_OFFSET, alignToAnchor, baselineToAnchor } from './text.fixtures';

import type { Track } from '../../tracks';
import type * as types from './text.types';
import type { float, hex, Anchor } from '../../types';
import type { TextClipProps } from './text.interfaces';
import type { Timestamp } from '../../models';

export class TextClip<Props extends TextClipProps = TextClipProps> extends VisualMixin(Clip<TextClipProps>) {
	public readonly type: 'text' | 'complex_text' = 'text';
	public declare track?: Track<TextClip>;

	protected _text: string = '';
	protected _textCase: types.TextCase | undefined;
	protected _anchor: Anchor = { x: 0, y: 0 };
	protected _font: Font = new Font();

	public readonly style = new TextStyle({
		fill: '#FFFFFF',
		fontFamily: this._font.family,
		fontSize: 16,
	});

	constructor(props?: string | TextClipProps) {
		super();
		this.style.padding = 20;

		if (typeof props == 'string') {
			this.text = props;
			this.reflectUpdate();
		} else if (props) {
			Object.assign(this, props);
			this.reflectUpdate();
		}

		this.on('update', this.reflectUpdate.bind(this));
	}

	/**
	 * Set the copy for the text object. To split a line you can use '\n'.
	 */
	@serializable()
	public get text(): string | undefined {
		return this._text;
	}

	public set text(value: string) {
		this._text = value;

		if (!this.view.children.length) {
			const container = new Text({
				text: this.transformedText,
				style: this.style,
				resolution: SCALE_OFFSET,
				scale: SCALE_OFFSET,
			});
			this.view.addChild(container);
		}

		if (this.view.children[0] instanceof Text && this.transformedText) {
			this.view.children[0].text = this.transformedText;
		}
	}

	public get name(): string {
		return this._text;
	}

	@serializable(Font)
	public get font(): Font {
		return this._font;
	}

	public set font(value: Font) {
		this._font = value;

		if (value.loaded) {
			this.style.fontFamily = value.name;
			return;
		}

		// font needs to be loaded first
		this._font.load().then(() => {
			this.style.fontFamily = value.name;
			this.trigger('update', undefined);
		});
	}

	/**
	 * The width at which text will wrap
	 */
	@serializable()
	public get maxWidth(): number | undefined {
		if (this.style.wordWrap) {
			return this.style.wordWrapWidth * SCALE_OFFSET;
		}
		return undefined;
	}

	public set maxWidth(value: number | undefined) {
		if (value) {
			this.style.wordWrap = true;
			this.style.wordWrapWidth = value / SCALE_OFFSET;
		} else {
			this.style.wordWrap = false;
		}
	}

	/**
	 * Alignment for multiline text, does not affect single line text.
	 */
	@serializable()
	public get textAlign(): types.TextAlign {
		return this.style.align;
	}

	public set textAlign(value: types.TextAlign) {
		this.style.align = value;
		this.anchor.x = alignToAnchor[value];
	}

	@serializable()
	public get padding(): number {
		return this.style.padding;
	}

	public set padding(value: number) {
		this.style.padding = value;
	}

	/**
	 * The baseline of the text that is rendered.
	 */
	@serializable()
	public get textBaseline(): types.TextBaseline {
		return this.style.textBaseline;
	}

	public set textBaseline(value: types.TextBaseline) {
		this.style.textBaseline = value;
		this.anchor.y = baselineToAnchor[value];
	}

	/**
	 * A fillstyle that will be used on the text '#00FF00'.
	 */
	@serializable()
	public get fillStyle(): hex {
		const { fill } = this.style;
		return <hex>new Color(fill.toString()).toHex().toUpperCase();
	}

	public set fillStyle(value: hex) {
		this.style.fill = value;
	}

	@serializable()
	public get anchor(): Anchor {
		return this._anchor;
	}

	public set anchor(value: Anchor | float) {
		if (typeof value == 'number') {
			this._anchor = { x: value, y: value }
		} else {
			this._anchor = value;
		}
	}

	/**
	 * An object describing the stroke to apply
	 */
	@serializable()
	public get stroke(): types.Stroke | undefined {
		if (!this.style.stroke) {
			return undefined;
		}

		let {
			color = '#000000',
			alpha = 1,
			width = 3,
			join = 'round',
			miterLimit,
		} = this.style.stroke as types.Stroke;

		color = <hex>new Color(color).toHex().toUpperCase();

		return { color, alpha, width, join, miterLimit };
	}

	public set stroke(value: Partial<types.Stroke> | undefined) {
		if (!value) {
			// @ts-ignore
			this.style.stroke = undefined;
			return;
		}

		const { color = '#000000', alpha = 1, width = 3, join = 'round', miterLimit } = value;

		this.style.stroke = { color, alpha, width, join, miterLimit };
	}

	/**
	 * The casing of the text, e.g. uppercase
	 */
	@serializable()
	public get textCase(): types.TextCase | undefined {
		return this._textCase;
	}

	public set textCase(value: types.TextCase | undefined) {
		this._textCase = value;

		if (this.view.children[0] instanceof Text && this.transformedText) {
			this.view.children[0].text = this.transformedText;
		}
	}

	/**
	 * Set a drop shadow for the text.
	 */
	@serializable()
	public get shadow(): types.TextShadow | undefined {
		if (!this.style.dropShadow) {
			return undefined;
		}

		const { alpha, angle, blur, color: c, distance } = this.style.dropShadow;

		const color = <hex>new Color(c).toHex().toUpperCase();

		return { alpha, angle, blur, color, distance };
	}

	public set shadow(value: Partial<types.TextShadow> | undefined) {
		if (!value) {
			this.style.dropShadow = false;
		} else {
			// @ts-ignore
			this.style.dropShadow = value;
		}
	}

	/**
	 * The font family, can be a single font name, or a list of names where the first is the preferred font.
	 */
	public get fontFamily(): string {
		if (Array.isArray(this.style.fontFamily)) {
			return this.style.fontFamily[0];
		}
		return this.style.fontFamily;
	}

	/**
	 * The font size (as a number it converts to px, but as a string, equivalents are '26px','20pt','160%' or '1.6em')
	 */
	@serializable()
	public get fontSize(): number {
		return this.style.fontSize;
	}

	public set fontSize(value: number) {
		this.style.fontSize = value;
	}

	/**
	 * The space between lines
	 */
	@serializable()
	public get leading(): number {
		return this.style.leading;
	}

	public set leading(value: number) {
		this.style.leading = value;
	}

	@visualize
	public update(_: Timestamp): void | Promise<void> { }

	public copy(): TextClip {
		const clip = TextClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.font = this.font;

		return clip;
	}

	protected get transformedText() {
		if (this.textCase == 'lower') {
			return this._text.toLocaleLowerCase();
		}

		if (this.textCase == 'upper') {
			return this._text.toUpperCase();
		}

		return this._text;
	}

	protected reflectUpdate() {
		const width = this.view.children[0]?.width ?? 0;
		const height = this.view.children[0]?.height ?? 0;
		const offset = (this.style.dropShadow?.distance ?? 0) * SCALE_OFFSET;

		this.view.pivot = {
			x: (width - offset) * this._anchor.x,
			y: (height - offset) * this._anchor.y,
		};
	}

	public set(props?: Props): this {
		return super.set(props);
	}
}
