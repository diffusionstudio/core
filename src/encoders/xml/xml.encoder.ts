/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { create } from "xmlbuilder2";
import { Composition } from "../../composition/composition";
import { VideoTrack } from "../../tracks";
import { ImageSource, Source, VideoSource } from "../../sources";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { XMLVideoEncoder } from "./video/source.xml.encoder";
import { XMLVideoTrackEncoder } from "./video/track.xml.encode";

/**
 * Encode a composition to a XML string for exporting to an external application
 */
export class XMLEncoder {
    private videoFormatId30fps1080p: string;
    constructor() {
        this.videoFormatId30fps1080p = "r0";
    }

    /**
     * Setups the XML document and returns the root, resources and library elements
     *
     * @returns The root, resources and library elements
     *
     * resulting xml:
     * <?xml version="1.0" encoding="UTF-8"?>
     * <fcpxml version="1.10">
     *   <resources>
     *   </resources>
     *   <library>
     *     <event name="DiffusionStudio">
     *       <project name="DiffusionStudio">
     *       </project>
     *     </event>
     *   </library>
     * </fcpxml>
     */
    initializeXmlDocument() {
        const root = create({ encoding: "UTF-8" });
        const fcpxml = root.ele("fcpxml", { version: "1.10" });
        const resources = fcpxml.ele("resources");
        const library = fcpxml.ele("library");
        const event = library.ele("event", { name: "DiffusionStudio" });
        const project = event.ele("project", { name: "DiffusionStudio" });
        return { root, resources, project };
    }

    /**
     * Encode the sources to XML
     *
     * @param sources The sources to encode
     * @param resources The resources element
     */
    encodeSources(
        sources: Map<string, Source>,
        resources: XMLBuilder
    ): Map<string, string> {
        // Currently all videos are given the same format of 30 fps and 1080p
        const videoFormat = resources.ele("format", {
            id: this.videoFormatId30fps1080p,
            width: 1920,
            height: 1080,
            frameDuration: "1/30s",
            name: "FFVideoFormat1080p30",
        });

        let sourceNameIdMap: Map<string, string> = new Map();
        let assetIdCounter = 1;
        sources.forEach((source, id) => {
            switch (source.type) {
                case "video":
                    const videoSource = source as VideoSource;
                    console.log("videoSource", videoSource);
                    const assetId = XMLVideoEncoder.encode(
                        videoSource,
                        resources,
                        assetIdCounter,
                        this.videoFormatId30fps1080p
                    );
                    sourceNameIdMap.set(videoSource.name, assetId);
                    assetIdCounter++;
                    break;
                case "image":
                    const imageSource = source as ImageSource;
                    console.log("imageSource", imageSource);
                    break;
            }
        });
        return sourceNameIdMap;
    }

    /**
     * Encode the tracks to XML
     *
     * @param composition The composition to encode
     * @param sourceNameIdMap The source name to asset id map
     * @param sequence The sequence element
     */
    encodeTracks(
        composition: Composition,
        sourceNameIdMap: Map<string, string>,
        sequence: XMLBuilder
    ) {
        let lane = 0;
        composition.tracks.forEach((track) => {
            switch (track.type) {
                case "video":
                    const videoTrack = track as VideoTrack;
                    XMLVideoTrackEncoder.encode(
                        videoTrack,
                        sourceNameIdMap,
                        this.videoFormatId30fps1080p,
                        sequence,
                        lane
                    );
                    lane++;
                    break;
            }
        });
    }

    /**
     * Encode the composition to XML
     *
     * @param composition The composition to encode
     * @returns The XML string
     */
    encode(composition: Composition) {
        const { root, resources, project } = this.initializeXmlDocument();

        const sequence = project.ele("sequence", {
            format: this.videoFormatId30fps1080p,
            tcFormat: "NDF",
            tcStart: "0/1s",
            duration: `${composition.duration.millis}/1000s`,
        });

        const sources = new Map<string, Source>();

        composition.tracks.forEach((track) => {
            track.clips.forEach((clip) => {
                const source = clip.source;
                if (source !== undefined) {
                    sources.set(source.id, source);
                }
            });
        });
        const sourceNameIdMap = this.encodeSources(sources, resources);
        this.encodeTracks(composition, sourceNameIdMap, sequence);
        return root.end({ prettyPrint: true });
    }
}
