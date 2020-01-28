

/**
 * Filters things out so that we can get the right context string between Safari and Chrome 
 */
export function getContextType(){
    let browser = window.navigator.userAgent;
    if(browser.search("Chrome") !== -1){
        return "gpupresent"
    }else if(browser.search("Chrome") === -1 && browser.search("Safari") !== -1 ){
        return "gpu";
    }
}

export async function loadImage(device:GPUDevice,src:string,onload:Function){

    let img = new Image();
    img.src = src;

    return new Promise((res,rej) => {

        img.onload = () => {
            res(img);
        }

    }).then(img => {


        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = img.width;
        imageCanvas.height = img.height;

        const imageCanvasContext = imageCanvas.getContext('2d');
        imageCanvasContext.translate(0, img.height);
        imageCanvasContext.scale(1, -1);
        imageCanvasContext.drawImage(img, 0, 0, img.width, img.height);
        const imageData = imageCanvasContext.getImageData(0, 0, img.width, img.height);

        let data = null;

        const rowPitch = Math.ceil(img.width * 4 / 256) * 256;
        if (rowPitch == img.width * 4) {
            data = imageData.data;
        } else {
            data = new Uint8Array(rowPitch * img.height);
            let imagePixelIndex = 0;
            for (let y = 0; y < img.height; ++y) {
            for (let x = 0; x < img.width; ++x) {
                let i = x * 4 + y * rowPitch;
                data[i] = imageData.data[imagePixelIndex];
                data[i + 1] = imageData.data[imagePixelIndex + 1];
                data[i + 2] = imageData.data[imagePixelIndex + 2];
                data[i + 3] = imageData.data[imagePixelIndex + 3];
                imagePixelIndex += 4;
            }
            }
        }

        let tex = device.createTexture({
            size:{
                width:img.width,
                height:img.height,
                depth:1
            },
            format:"rgba8unorm",
            usage:GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED
        });

       

        let buffer= device.createBuffer({
            // TODO look this up again. 
            size:data.byteLength * 4,
            usage:GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
        buffer.setSubData(0,data);

        
        const rowPitch = Math.ceil(img.width * 4 / 256) * 256
        const commandEncoder = device.createCommandEncoder({});
        commandEncoder.copyBufferToTexture({
            buffer: buffer,
            rowPitch: rowPitch,
            imageHeight: img.height,
          }, {
            texture: tex,
          }, {
            width: img.width,
            height: img.height,
            depth: 1,
          });
      
        device.defaultQueue.submit([commandEncoder.finish()]);

        onload(tex);

    })
}