/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { EventEmitterMixin } from '../../mixins';
import { serializable, Serializer } from '../../services';
import { WebFonts } from './font.fixtures';

import type * as types from './font.types';

type Events = {
	load: undefined;
};

export class Font extends EventEmitterMixin<Events, typeof Serializer>(Serializer) {
	/**
	 * Defines if the font has been loaded yet
	 */
	public loaded: boolean = false;

	public constructor(config?: types.FontSource) {
		super();

		if (config?.source.startsWith('https://')) {
			config.source = `url(${config.source})`;
		}

		this.family = config?.family ?? 'Arial';
		this.source = config?.source;
		this.style = config?.style;
		this.weight = config?.weight;
	}

	public get name(): string {
		return this.family + ' ' + (this.style ?? this.weight);
	}

	/**
	 * Defines the family of the font
	 * @example 'Montserrat'
	 */
	@serializable()
	public family: string;

	/**
	 * Defines the weight of the font
	 * @example '500'
	 */
	@serializable()
	public weight?: string;

	/**
	 * Defines the font face source
	 * @example 'url(https://mywebfont.ttf)'
	 */
	@serializable()
	public source: string | undefined;

	/**
	 * Defines the font style
	 * @example 'italic'
	 */
	@serializable()
	public style: string | undefined;

	/**
	 * Load the font that has been initiated via the constructor
	 */
	public async load(): Promise<this> {
		if (this.loaded || !this.source || !this.family) {
			return this;
		}

		const fontFace = new FontFace(this.name, this.source);
		if (this.weight) fontFace.weight = this.weight;

		await new Promise((resolve) => {
			fontFace.load().then((font) => {
				document.fonts.add(font);
				resolve(null);
			});
		});

		this.loaded = true;
		this.trigger('load', undefined);

		return this;
	}

	public copy(): Font {
		const font = Font.fromJSON(JSON.parse(JSON.stringify(this)));
		font.loaded = this.loaded;

		return font;
	}

	/**
	 * Get all available local fonts, requires the
	 * **Local Font Access API**
	 */
	public static async localFonts(): Promise<types.FontSources[]> {
		const localFonts: Record<string, any> = {};

		if (!('queryLocalFonts' in window)) {
			Object.assign(window, { queryLocalFonts: () => [] });
		}

		// group by font family
		for (const font of await window.queryLocalFonts()) {
			if (font.family in localFonts) {
				localFonts[font.family].push(font);
				continue;
			}
			localFonts[font.family] = [font];
		}

		return Object.keys(localFonts).map((family: any) => {
			return {
				family,
				variants: localFonts[family].map((font: any) => {
					return {
						family,
						style: font.style,
						source: `local('${font.fullName}'), local('${font.postscriptName}')`,
					};
				}),
			};
		});
	}

	/**
	 * Get common web fonts
	 */
	public static webFonts(): types.FontSources[] {
		return Object.keys(WebFonts).map((family) => {
			return {
				family,
				variants: WebFonts[family as keyof typeof WebFonts].weights.map((weight) => {
					return {
						family,
						source: `url(${WebFonts[family as keyof typeof WebFonts].url})`,
						weight,
					};
				}),
			};
		})
	}

	/**
	 * Create a font by font family
	 */
	public static fromFamily<T extends keyof typeof WebFonts>({
		family,
		weight,
	}: types.WebfontProperties<T>): Font {
		return new Font({
			family,
			source: `url(${WebFonts[family].url})`,
			weight: weight,
		})
	}
}
