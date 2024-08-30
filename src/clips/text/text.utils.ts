/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { SCALE_OFFSET } from './text.fixtures';
import type { CanvasTextMetrics } from 'pixi.js';

export function split(text: string) {
	const tokens = text.split(' ').map((t) => `${t} `);
	tokens[tokens.length - 1] = tokens[tokens.length - 1].replace(/ $/, '');

	return tokens;
}

const handler: ProxyHandler<CanvasTextMetrics> = {
	get(target, property) {
		const value = (target as any)[property];
		if (typeof value === 'number') {
			return value * SCALE_OFFSET;
		}
		if (Array.isArray(value) && typeof value[0] === 'number') {
			return value.map((v) => v * SCALE_OFFSET);
		}
		return value;
	},
};

export function createMetricsProxy(obj: CanvasTextMetrics): CanvasTextMetrics {
	return new Proxy(obj, handler);
}

export class TextMetricLine {
	public tokens: { metrics: CanvasTextMetrics; index: number }[] = [];

	public get width() {
		return this.tokens.reduce((prev, item) => prev + item.metrics.lineWidths[0], 0);
	}

	public get height() {
		return Math.max(...this.tokens.map((token) => token.metrics.lineHeight));
	}
}

export class TextMetrics {
	public lines: TextMetricLine[] = [];

	public get width() {
		return Math.max(...this.lines.map((token) => token.width));
	}

	public get height() {
		return this.lines.reduce((prev, item) => prev + item.height, 0);
	}
}
