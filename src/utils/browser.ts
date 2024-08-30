/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

/**
 * This utility creates an anchor tag and clicks on it
 * @param source Blob url or base64 encoded svg
 * @param name File name suggestion
 */
export async function downloadObject(
	source: string | Blob,
	name: string = 'untitled',
): Promise<void> {
	const a = document.createElement('a');
	document.head.appendChild(a);
	a.download = name;

	if (typeof source == 'string' && source.startsWith('data:image/svg+xml;base64,')) {
		// Step 1: Extract the Base64 string from the src attribute
		const base64 = source.split(',')[1];

		// Step 2: Create a Blob object from the Base64 string
		const byteCharacters = atob(base64);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: 'image/svg+xml' });

		// Step 3: Set the href attribute to the Blob URL
		a.href = URL.createObjectURL(blob);
		a.download = name.split('.')[0] + '.svg';
	} else if (typeof source == 'string') {
		a.href = source;
	} else {
		a.href = URL.createObjectURL(source);
	}

	a.click();
	a.remove();
}

/**
 * This utility creates a file input element and clicks on it
 * @param accept comma separated mime types
 * @example audio/mp3, video/mp4
 * @param multiple enable multiselection
 * @default true
 */
export async function showFileDialog(accept: string, multiple = true): Promise<File[]> {
	return new Promise<File[]>((resolve) => {
		// setup input
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.multiple = multiple;
		// listen for changes
		input.onchange = (fileEvent: Event) => {
			const file = Array.from((<HTMLInputElement>fileEvent.target)?.files ?? []);
			resolve(file);
		};
		input.click();
	});
}
