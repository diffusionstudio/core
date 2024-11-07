import { Graphics } from "pixi.js";
import type { MaskProps } from "./mask.types";

/**
 * A mask is used to mask another visual clip.
 */
export class Mask extends Graphics {
    constructor(props: MaskProps) {
        super();
        this.position = props.position ?? {x: 0, y: 0};
    }
}