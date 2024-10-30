/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { XMLEncoder } from './xml.encoder';
import { Composition } from '../../composition/composition';
import { VideoClip } from '../../clips';

const file = new File([], 'video.mp4', { type: 'video/mp4' });

describe('The XML FCP Encoder', () => {
    it('should encode a composition to a XML string', async () => {
        const composition = new Composition();
        const encoder = new XMLEncoder();
        const videoClip = new VideoClip(file).subclip(0, 10);
        composition.add(videoClip);
        const xml = encoder.encode(composition);
        expect(xml).toBe('<?xml version="1.0"?>\n<fcpxml version="1.10"/>');
    });
});
