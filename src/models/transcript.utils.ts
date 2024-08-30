/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

export type Time = {
	hours: number;
	minutes: number;
	seconds: number;
	milliseconds: number;
};

export function formatTime(time: Time) {
	return (
		'' +
		`${time.hours.toString().padStart(2, '0')}:` +
		`${time.minutes.toString().padStart(2, '0')}:` +
		`${time.seconds.toString().padStart(2, '0')},` +
		time.milliseconds.toString().padStart(3, '0')
	);
}

export function secondsToTime(seconds: number): Time {
	const time = new Date(1970, 0, 1); // Epoch
	time.setSeconds(seconds);
	time.setMilliseconds(Math.round((seconds % 1) * 1000));

	return {
		hours: time.getHours(),
		minutes: time.getMinutes(),
		seconds: time.getSeconds(),
		milliseconds: time.getMilliseconds(),
	};
}
