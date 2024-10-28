/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { create } from "xmlbuilder2";
import { Composition } from "../../composition/composition";
import { Source } from "../../sources/source";

/**
 * Encode a composition to a XML string for exporting to an external application
 */
export class XMLEncoder {
  encode(composition: Composition) {
    const root = create();

    root.ele("fcpxml", {version: "1.10"});

    let sources: Source[] = [];
    composition.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
            const source = clip.source;
            if (source !== undefined) {
                sources.push(source);
            }
        });
    });

    return root.end({ prettyPrint: true });
  }
}
