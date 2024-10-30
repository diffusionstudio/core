import {Graphics} from "pixi.js";
import { int } from "../../types";


export interface roundRectangleMaskProps {
    _width?: number,
    _height?: number,
    radius?: number,
}

export class roundRectangleMask extends Graphics {

    public radius = 50

    public constructor(props: roundRectangleMaskProps) {
        super()

        Object.assign(this, props);

        this.roundRect(this.position.x, this.position.y, this._width, this._height, this.radius)
        this.fill({color: '#FFF'})
    }

    private _width = 100;
    private _height = 100;

    set width(val: int){
        this._width = val
    }

    get width(){
        return this._width;
    }

    set height(val: int){
        this._height = val
    }

    get height(){
        return this._height;
    }
}
