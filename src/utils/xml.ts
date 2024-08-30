/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export function escapeXml(unsafe: string) {
	return unsafe.replace(/[<>&'"]/g, function (entity) {
		switch (entity) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case "'":
				return '&apos;';
			case '"':
				return '&quot;';
			default:
				return entity;
		}
	});
}

export function unescapeXml(safe: string) {
	return safe.replace(/&lt;|&gt;|&amp;|&apos;|&quot;/g, function (entity) {
		switch (entity) {
			case '&lt;':
				return '<';
			case '&gt;':
				return '>';
			case '&amp;':
				return '&';
			case '&apos;':
				return "'";
			case '&quot;':
				return '"';
			default:
				return entity;
		}
	});
}
