/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { create } from "xmlbuilder2";
import { Composition } from "../../composition/composition";
import { FcpAsset } from "./xml.fcp.types";

/**
 * Encode a composition to a XML string for exporting to an external application
 */
export class XMLEncoder {
  encode(composition: Composition) {
    const root = create();

    const fcpxml = root.ele("fcpxml", {version: "1.10"});
    const resources = fcpxml.ele("resources");

    let id_to_asset: Map<string, FcpAsset> = new Map();
    composition.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
            // clip

            const source = clip.source;
            console.log(source?.id);
            if (source !== undefined) {
                id_to_asset.set(source.id, FcpAsset.fromSource(source));
            }
        });
    });

    id_to_asset.forEach((asset) => {
        asset.toXML(resources);
    });

    return root.end({ prettyPrint: true });
  }
}
