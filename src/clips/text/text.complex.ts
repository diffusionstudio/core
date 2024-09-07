/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { TextClip } from './text';
import { serializable } from '../../services';
import { createMetricsProxy, split, TextMetrics, TextMetricLine } from './text.utils';
import { alignToAnchor, baselineToAnchor, SCALE_OFFSET } from './text.fixtures';
import { CanvasTextMetrics, Container, Graphics, Text } from 'pixi.js';
import { StylesDeserializer } from './text.complex.deserializer';

import type { ComplexTextClipProps } from './text.complex.interfaces';
import type { Track } from '../../tracks';
import type * as types from './text.types';
import type { TextStyle } from 'pixi.js';


export class ComplexTextClip extends TextClip<ComplexTextClipProps> {
	public readonly type = 'complex_text';
	public declare track?: Track<ComplexTextClip>;

	private _maxWidth?: number;
	private _textAlign: types.TextAlign = 'left';
	private _textBaseline: types.TextBaseline = 'top';

	/**
	 * Access to the container that contains
	 * all text objects
	 */
	public model = new Container<Text>();
	public segments: types.TextSegment[] = [];
	public metrics = new TextMetrics();

	@serializable()
	public background?: types.Background;

	@serializable(StylesDeserializer)
	public styles?: types.StyleOption[];

	public constructor(props?: string | ComplexTextClipProps) {
		super();

		this.view.addChild(this.model);

		if (typeof props == 'string') {
			this.text = props;
			this.reflectUpdate();
		} else if (props) {
			Object.assign(this, props);
			this.reflectUpdate();
		}
	}

	/**
	 * Set the copy for the text object. To split a line you can use '\n'.
	 */
	@serializable()
	public get text(): string {
		return this._text;
	}

	public set text(value: string) {
		this._text = value;
	}

	/**
	 * The width at which text will wrap
	 */
	@serializable()
	public get maxWidth(): number | undefined {
		return this._maxWidth;
	}

	public set maxWidth(value: number | undefined) {
		this._maxWidth = value;
	}

	/**
	 * Alignment for multiline text, does not affect single line text.
	 */
	@serializable()
	public get textAlign(): types.TextAlign {
		return this._textAlign;
	}

	public set textAlign(value: types.TextAlign) {
		this._textAlign = value;
		this._anchor.x = alignToAnchor[value];
		const width = this.metrics.width;

		for (const line of this.metrics.lines) {
			let x = 0;

			if (value == 'center' || value == 'justify') {
				x = (width - line.width) / 2;
			}

			if (value == 'right') {
				x = width - line.width;
			}

			for (const tokens of line.tokens) {
				this.model.children[tokens.index].x = x;
				x += tokens.metrics.lineWidths[0];
			}
		}
	}

	/**
	 * The baseline of the text that is rendered.
	 */
	@serializable()
	public get textBaseline(): types.TextBaseline {
		return this._textBaseline;
	}

	public set textBaseline(value: types.TextBaseline) {
		this._textBaseline = value;
		this._anchor.y = baselineToAnchor[value];

		let y = 0;

		for (const line of this.metrics.lines) {
			const height = line.height;

			for (const token of line.tokens) {
				let offset = 0;

				if (value == 'middle') {
					offset = (height - token.metrics.lineHeight) / 2;
				}

				if (value == 'bottom') {
					offset = height - token.metrics.lineHeight;
				}

				this.model.children[token.index].y = y + offset;
			}

			y += height;
		}
	}

	public copy(): ComplexTextClip {
		const clip = ComplexTextClip.fromJSON(JSON.parse(JSON.stringify(this)));
		clip.filters = this.filters;
		clip.font = this.font;

		return clip;
	}

	private createRenderSplits(splits: types.TextSegment[] = []): types.RenderSplit[] {
		const text = this.transformedText ?? '';
		const result: types.RenderSplit[] = [
			{
				index: undefined,
				tokens: split(text.substring(0, splits?.at(0)?.start)),
			},
		];

		for (let i = 0; i < splits.length; i++) {
			result.push({
				index: splits[i].index,
				tokens: split(text.substring(splits[i].start, splits[i].stop)),
			});

			if ((splits[i].stop ?? text.length) >= text.length) continue;

			result.push({
				index: undefined,
				tokens: split(text.substring(splits[i].stop!, splits.at(i + 1)?.start)),
			});
		}

		return result.filter((p) => p.tokens.join('').trim().length);
	}

	private createTextMetrics(renderSplits: types.RenderSplit[], styles: TextStyle[]) {
		// reset current state
		const textMetrics = new TextMetrics();

		// do for each text split
		for (const split of renderSplits) {
			const style = split.index != undefined ? styles[split.index] : this.style;

			// do for each word
			for (let i = 0; i < split.tokens.length; i++) {
				const metrics = createMetricsProxy(CanvasTextMetrics.measureText(split.tokens[i], style));

				const width = (textMetrics.lines.at(-1)?.width ?? 0) + metrics.lineWidths[0];
				const maxWidth = this.maxWidth ?? Number.POSITIVE_INFINITY;
				const lineBreak = split.tokens.at(i - 1)?.match(/(\n|\\n).$/gim);

				if (width > maxWidth || lineBreak || !textMetrics.lines.length) {
					textMetrics.lines.push(new TextMetricLine());
				}

				this.model.addChild(
					new Text({
						text: split.tokens[i],
						style,
						resolution: SCALE_OFFSET,
						scale: SCALE_OFFSET,
					}),
				);

				textMetrics.lines.at(-1)?.tokens.push({
					metrics,
					index: this.model.children.length - 1,
				});
			}
		}

		return textMetrics;
	}

	private createTextStyles() {
		return (
			this.styles?.map((value) => {
				const style = this.style.clone();
				style.fill = value.fillStyle ?? this.style.fill;
				style.fontSize = value.fontSize ?? this.style.fontSize;
				style.stroke = value.stroke ?? this.style.stroke;
				style.fontFamily = value.font?.name ?? this.style.fontFamily;
				return style;
			}) ?? []
		);
	}

	private drawBackground() {
		if (this.view.children.length > 1) {
			this.view.removeChildAt(0);
		}
		if (!this.background) return;

		const width = this.model.width;
		const height = this.model.height;
		const paddingX = this.background.padding?.x ?? 40;
		const paddingY = this.background.padding?.y ?? 10;

		const graphics = new Graphics();

		graphics.roundRect(
			0 - (paddingX / 2),
			2 - (paddingY / 2),
			width + paddingX,
			height + paddingY,
			this.background.borderRadius ?? 20,
		);
		graphics.fill(this.background.fill ?? '#000000');
		graphics.alpha = this.background.alpha ?? 1;

		this.view.addChildAt(graphics, 0);
	}

	protected reflectUpdate() {
		if (!this.transformedText) return;

		this.model.removeChildren();

		const splits = this.createRenderSplits(this.segments);
		const styles = this.createTextStyles();

		this.metrics = this.createTextMetrics(splits, styles);
		this.textAlign = this.textAlign;
		this.textBaseline = this.textBaseline;

		const width = this.view.width;
		const height = this.view.height;
		const offset = (this.style.dropShadow?.distance ?? 0) * SCALE_OFFSET;

		this.view.pivot = {
			x: (width - offset) * this._anchor.x,
			y: (height - offset) * this._anchor.y,
		};

		this.drawBackground();
	}
}
