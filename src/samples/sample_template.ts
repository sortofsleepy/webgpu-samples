
import glsl from '../../glslang.js'
import mat4 from '../../mat4'
import vec3 from '../../vec3'
import vertex from './vertex.glsl'
import fragment from './fragment.glsl'
import plane from './geo'
import {getContextType} from '../../utils'

export default function(){
    if(!navigator.gpu){
        alert("Your browser doesn't currently support webgpu.");
    }

    navigator.gpu.requestAdapter().then(res => {
        res.requestDevice().then(device => {
            glsl().then(spirv => {
            
                start(device,spirv);
            })
        })
    })
}

function start(device,spirv){


    let canvas = document.createElement("canvas");
    let context = canvas.getContext(getContextType());

    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const swapChain = context.configureSwapChain({
        device,
        format: "bgra8unorm"
    });

    const projectionMatrix = mat4.create();
    let viewMatrix = mat4.create();

    viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0,0,0], [0, 0, 0], [0, 0, 0]);
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -800));


    const aspect = window.innerWidth / window.innerHeight;
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, 1000000.0);

    // =============== 



}// end start