/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { create } from "xmlbuilder2";
import { Composition } from "../../composition/composition";
import { FcpAsset } from "./xml.fcp.types";
import { VideoClip } from "../../clips/video/video";
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
     *   </library>
     * </fcpxml>
     */
    initializeXmlDocument() {
        const root = create({ encoding: "UTF-8" });
        const fcpxml = root.ele("fcpxml", { version: "1.10" });
        const resources = fcpxml.ele("resources");
        const library = fcpxml.ele("library");
        return { root, resources, library };
    }

    /**
     * Encode the sources to XML
     *
     * @param sources The sources to encode
     * @param resources The resources element
     */
    encodeSources(sources: Map<string, Source>, resources: XMLBuilder): Map<string, string> {
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

    encodeTracks(composition: Composition, resources: XMLBuilder, sourceNameIdMap: Map<string, string>) {
        composition.tracks.forEach((track) => {
            switch (track.type) {
                case "video":
                    const videoTrack = track as VideoTrack;
                    XMLVideoTrackEncoder.encode(videoTrack, resources, sourceNameIdMap, this.videoFormatId30fps1080p);
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
        const { root, resources, library } = this.initializeXmlDocument();

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

        this.encodeTracks(composition, resources, sourceNameIdMap);
            

        // const videoFormatId = "r0";
        // // const audioFormatId = "r1";
        // // const imageFormatId = "r2";
        // const videoFormat = resources.ele("format", {
        //     id: videoFormatId,
        //     width: 1920,
        //     height: 1080,
        //     frameDuration: "1/60s", // TODO frame rate needs to be correct
        //     name: "FFVideoFormat1080p60",
        // });
        // // const audioFormat = resources.ele("format", {id: audioFormatId});
        // // const imageFormat = resources.ele("format", {id: imageFormatId});

        // const event = library.ele("event", { name: "DiffusionStudio" }); // TODO add project name
        // const project = event.ele("project", { name: "DiffusionStudio" });

        // let id_to_asset: Map<string, FcpAsset> = new Map();
        // let id_counter = 1;
        // let asset_id_to_ref: Map<string, string> = new Map();
        // composition.tracks.forEach((track) => {
        //     console.log("type", track.type);
        //     console.log("id", track.id);
        //     if (track.type === "video") {
        //         const videoTrack = track as VideoTrack;
        //     }

        //     track.clips.forEach((clip) => {
        //         const source = clip.source;
        //         console.log("source", source);

        //         if (clip.type === "video" && source !== undefined) {
        //             const videoClip = clip as VideoClip;
        //             let asset_id: string;
        //             if (asset_id_to_ref.has(source.id)) {
        //                 asset_id = asset_id_to_ref.get(source.id)!;
        //             } else {
        //                 asset_id = `r${id_counter}`;
        //                 id_counter++;
        //                 asset_id_to_ref.set(source.id, asset_id);
        //             }
        //             console.log(videoClip.type);
        //             console.log("video");
        //             console.log(source?.id);
        //             const asset = FcpAsset.fromSource(
        //                 source,
        //                 videoFormatId,
        //                 asset_id
        //             );
        //             id_to_asset.set(source.id, asset);

        //             const sequence = project.ele("sequence", {
        //                 format: videoFormatId,
        //                 tcFormat: "NDF",
        //                 tcStart: `${
        //                     videoClip.start.millis - videoClip.offset.millis
        //                 }/1000s`, // TODO this has to be in reference to the track
        //                 duration: `${
        //                     videoClip.stop.millis - videoClip.start.millis
        //                 }/1000s`, // same as above
        //             });
        //             const spine = sequence.ele("spine");
        //             spine.ele("asset-clip", {
        //                 format: videoFormatId,
        //                 tcFormat: "NDF",
        //                 start: `${
        //                     videoClip.start.millis - videoClip.offset.millis
        //                 }/1000s`,
        //                 ref: asset_id,
        //                 name: asset.name,
        //                 offset: `${-videoClip.offset.millis}/1000s`,
        //                 duration: `${
        //                     videoClip.stop.millis - videoClip.start.millis
        //                 }/1000s`,
        //             });
        //         } else if (clip.type === "image") {
        //             console.log(clip.type);
        //             console.log("image");
        //             console.log(source?.id);
        //         }

        //         // if (source !== undefined) {
        //         //     id_to_asset.set(source.id, FcpAsset.fromSource(source, formatId));
        //         // }
        //     });
        // });

        // id_to_asset.forEach((asset) => {
        //     asset.toXML(resources);
        // });

        // const sequence = project.ele("sequence", {name: "DiffusionStudio"});

        return root.end({ prettyPrint: true });
    }
}
