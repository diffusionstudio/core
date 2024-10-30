import {Graphics} from "pixi.js";


export interface ellipseMaskProps {
    radius: {
        x?: number,
        y?: number,
    }
}

export class ellipseMask extends Graphics {

    public radius = {
        x: 30,
        y: 30
    }

    public constructor(props: ellipseMaskProps){
        super()

        Object.assign(this, props);

        this.ellipse(this.position.x + (this.radius.x /2),  this.position.y + (this.radius.y /2), this.radius.x /2, this.radius.y /2 )
        this.fill({color: '#FFF'})
    }
}
