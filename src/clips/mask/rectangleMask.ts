import {Graphics} from "pixi.js";
import { int } from "../../types";


export interface rectangleMaskProps {
    _width?: number,
    _height?: number,
}

export class rectangleMask extends Graphics {

    public constructor(props: rectangleMaskProps) {
        super()

        Object.assign(this, props);

        this.rect(this.position.x, this.position.y, this._width, this._height)
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
