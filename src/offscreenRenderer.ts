

export default class OffscreenRenderer {
    private canvas:OffscreenCanvas;
    private ctx:WebGL2RenderingContext;

    constructor(width:number,height:number){

        this.canvas = new OffscreenCanvas(width,height);
        this.ctx = this.canvas.getContext("webgl2");
       

        
    }

    getContext(){
        return this.ctx;
    }

    getBitmap(){
        return this.canvas.transferToImageBitmap();
    }
}