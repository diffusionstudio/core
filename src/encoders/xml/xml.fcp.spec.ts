/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { describe, expect, it } from 'vitest';
import { XMLEncoder } from './xml.encoder';
import { Composition } from '../../composition/composition';
import { VideoSource } from '../../sources/video';

describe('The XML FCP Encoder', () => {
    it('should encode a composition to a XML string', () => {
        const composition = new Composition();
        const videoSource = VideoSource.from("../../../public/sample_aac_h264_yuv420p_1080p_30fps.mp4");
        const encoder = new XMLEncoder();
        const xml = encoder.encode(composition);
        expect(xml).toBe('<?xml version="1.0"?>\n<fcpxml version="1.10"/>');
    });
});
