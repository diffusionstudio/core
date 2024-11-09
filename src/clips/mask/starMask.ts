import { StarMaskProps } from "./mask.types";
import { Mask } from "./mask";

export class StarMask extends Mask {

    private _numberOfPoints: number;
    private _radius: number;
    private _innerRadius: number | undefined;
    public constructor(props: StarMaskProps){
        super(props);

        this._numberOfPoints = props.numberOfPoints;
        this._radius = props.radius;
        this._innerRadius = props.innerRadius;

        this.star(this.position.x, this.position.y, this._numberOfPoints, this._radius, this._innerRadius, this.rotation)
        this.fill({color: '#FFF'})
    }
}
