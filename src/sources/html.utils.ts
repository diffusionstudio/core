/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

const emptySvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E";

// Function to escape special characters
export function utf8ToBase64(str: string) {
	const utf8Bytes = new TextEncoder().encode(str);
	let binary = '';
	const len = utf8Bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(utf8Bytes[i]);
	}
	return btoa(binary);
}

export function documentToSvgImageUrl(doc?: Document) {
	if (!doc || !doc.body) return emptySvg;
	
	const width = doc.body.scrollWidth;
	const height = doc.body.scrollHeight;

	const document = doc.cloneNode(true) as Document;
	const style = document.getElementsByTagName('style').item(0);
	const body = document.getElementsByTagName('body').item(0);
	body?.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

	if (!body) return emptySvg;
	const xmlSerializer = new XMLSerializer();

	const styleString = style ? xmlSerializer.serializeToString(style) : '';
	const bodyString = xmlSerializer.serializeToString(body);

	const svgString = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
		body { padding: 0; }
    ${styleString}
    <foreignObject width="100%" height="100%">
      ${bodyString}
    </foreignObject>
  </svg>`;

	return 'data:image/svg+xml;base64,' + utf8ToBase64(svgString);
}

export async function fontToBas64Url(url: string): Promise<string> {
	const response = await fetch(url);
	const blob = await response.blob();

	const base64 = await new Promise<string | ArrayBuffer | null>((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});

	let format = 'woff2';
	if (url?.endsWith('woff')) format = 'woff';
	if (url?.endsWith('ttf')) format = 'truetype';

	return `url(${base64}) format('${format}')`;
}
