import cubeSample from './samples/cube/app'


import glsl from './glslang.js'
import mat4 from './mat4'
import vec3 from './vec3'
import {vertexShaderGLSL,fragmentShaderGLSL} from './shader'
import { getContextType } from './utils.js'
import createPlane from './geometry/plane'

import vertex from './samples/texture/vertex.glsl'
import fragment from './samples/texture/fragment.glsl'

if(!navigator.gpu){
    alert("Unable to start - your browser doesn't support WebGPU")
    throw new Error("Your browser does not support WebGPU");
}




navigator.gpu.requestAdapter().then(res => {
    res.requestDevice().then(device => {
        glsl().then(spirv => {
           

            start(device,spirv);
        
            

        })
    })
})


function start(device,spirv){

    //========== SETUP ============== //
  
    const canvas = document.createElement("canvas");
    const context = canvas.getContext(getContextType());

    const projectionMatrix = mat4.create();
    let viewMatrix = mat4.create();


    const aspect = Math.abs(canvas.width / canvas.height);
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, 1000000.0);


    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

     
    // build swapchain 
    const swapChain = context.configureSwapChain({
        device,
        format: "bgra8unorm"
    });

    // ==================== BUILD UNIFORM BUFFER ======================== //
    const uniformsBindGroupLayout = device.createBindGroupLayout({
        bindings: [{
            binding: 0,
            visibility: 1,
            type: "uniform-buffer"
        }]
    });

    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const uniformBindGroup = device.createBindGroup({
        layout: uniformsBindGroupLayout,
        bindings: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
            },
        }],
    });

    // ========= IMAGE TEXTURE ========== //

    let img = new Image();
    img.src = "test.png";
    img.decode();

    img.onload = () => {
  
    }

    let tex = device.createTexture({
        size:{
            width:img.width,
            height:img.height,
            depth:1
        },
        format:"rgba8unorm",
        usage:GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED
    })

    //=============== DEPTH SETTINGS  ================= //
      // build required depth texture
      const depthTexture = device.createTexture({
        size: {
            width: canvas.width,
            height: canvas.height,
            depth: 1
        },
        format: "depth24plus-stencil8",
        usage: GPUTextureUsage.OUTPUT_ATTACHMENT
    });

        
    const renderPassDescriptor= {
        colorAttachments: [{
            // attachment is acquired and set in render loop.
            attachment: undefined,

            loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
        }],
        depthStencilAttachment: {
            attachment: depthTexture.createView(),

            depthLoadValue: 1.0,
            depthStoreOp: "store",
            stencilLoadValue: 0,
            stencilStoreOp: "store",
        }
    };


    // ========== BUILD GEOMETRY ============== //
    let p = createPlane(500,500,2,2,);

    
    // build position buffer 

    let vertices = device.createBuffer({
        size:p.positions.byteLength,
        usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    vertices.setSubData(0,p.positions);
 

    // build uv buffer 
    let uvs = device.createBuffer({
        size:p.uvs.byteLength,
        usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })

    uvs.setSubData(0,p.uvs);


    // build index buffer 
    let indices = device.createBuffer({
        size:p.cells.byteLength,
        usage:GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    })
    indices.setSubData(0,p.cells);

    let indexCount = p.cells.length;
    // =============== BUILD SHADER ================== //
    let vertexStage = {
        module: device.createShaderModule({
            code: spirv.compileGLSL(vertex, "vertex"),
            source: vertex
        }),
        entryPoint: "main"
    };

    let fragmentStage = {
        module: device.createShaderModule({
            code: spirv.compileGLSL(fragment, "fragment"),
            source: fragment
        }),
        entryPoint: "main"
    }

    //============== BUILD RENDER PIPELINE ================ //
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [uniformsBindGroupLayout] });
    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,

        vertexStage:vertexStage,
        fragmentStage: fragmentStage,

        primitiveTopology: "triangle-list",
        depthStencilState: {
            depthWriteEnabled: true,
            depthCompare: "less",
            format: "depth24plus-stencil8",
        },

        vertexState: {
            indexFormat:"uint32",
            vertexBuffers: [{
                arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
                attributes: [{
                    // position
                    shaderLocation: 0,
                    offset: 0,
                    format: "float3"
                },
                    {
                        shaderLocation:1,
                        offset:0,
                        format:"float2"
                    }
                ]
            }],
        },    
        rasterizationState: {
            cullMode: 'none',
        },

        colorStates: [{
            format: "bgra8unorm",
        }],
    });

    // ============== ANIMATE ============ //
    let  getTransformationMatrix = ()=> {
        //let viewMatrix = mat4.create();
        viewMatrix = mat4.create();
        mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -1000));
        let now = Date.now() / 1000;


        mat4.rotate(viewMatrix, viewMatrix, 1, vec3.fromValues(Math.sin(now), Math.cos(now), 0));

        let modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);

        return modelViewProjectionMatrix;
    }


    let animate = () => {
        requestAnimationFrame(animate);
        uniformBuffer.setSubData(0, getTransformationMatrix());
        renderPassDescriptor.colorAttachments[0].attachment = swapChain.getCurrentTexture().createView();

        const commandEncoder = device.createCommandEncoder({});
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup);

        passEncoder.setVertexBuffer(0, vertices);
        passEncoder.setVertexBuffer(1,uvs);
        passEncoder.setIndexBuffer(indices);
     
        passEncoder.drawIndexed(p.positions.length ,1,0,0,0);
        passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);
    }

    animate();

} // end start