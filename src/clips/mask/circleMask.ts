import { Mask } from "./mask";
import { CircleMaskProps } from "./mask.types";

/**
 * A circular mask of a given radius
 */
export class CircleMask extends Mask {

    private _radius: number;

    public constructor(props: CircleMaskProps){
        super(props);

        this._radius = props.radius;

        this.circle(this.position.x, this.position.y, this._radius)
        this.fill({color: '#FFF'})
    }
}
