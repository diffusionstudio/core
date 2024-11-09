import { RoundRectangleMaskProps } from "./mask.types";
import { Mask } from "./mask";

export class RoundRectangleMask extends Mask {
    private _rectangleWidth: number;
    private _rectangleHeight: number;
    private _borderRadius: number;


    public constructor(props: RoundRectangleMaskProps) {
        super(props);

        this._rectangleWidth = props.rectangleWidth;
        this._rectangleHeight = props.rectangleHeight;
        this._borderRadius = props.borderRadius;

        this.roundRect(this.position.x, this.position.y, this._rectangleWidth, this._rectangleHeight, this._borderRadius)
        this.fill({color: '#FFF'})
    }
}
