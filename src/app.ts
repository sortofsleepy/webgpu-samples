import glsl from './glslang.js'
import mat4 from './mat4'
import vec3 from './vec3'
import {triangle} from './geometry'
import {vertexShaderGLSL,fragmentShaderGLSL} from './shader'
import * as cube from './cube'

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

function getTransformationMatrix(projectionMatrix){
    let viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -5));
    let now = Date.now() / 1000;
    mat4.rotate(viewMatrix, viewMatrix, 1, vec3.fromValues(Math.sin(now), Math.cos(now), 0));

    let modelViewProjectionMatrix = mat4.create();
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);

    return modelViewProjectionMatrix;
}

function start(device,spirv){

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("gpupresent");
    const projectionMatrix = mat4.create();

    const aspect = Math.abs(canvas.width / canvas.height);
    mat4.perspective(projectionMatrix, (2* Math.PI) / 5, aspect, 1, 1000.0);


    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // ==================== BUILD CORE COMPONENTS  ======================== //
  
    // build swapchain 
    const swapChain = context.configureSwapChain({
        device,
        format: "bgra8unorm"
    });


    // ==================== BUILD VERTEX BUFFER ======================== //
    // build buffer for vertices 
  
   
    /*
     const verticesBuffer = device.createBuffer({
        size:cube.cubeVertexArray.byteLength,
        usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })


    verticesBuffer.setSubData(0,cube.cubeVertexArray);
    */
    const verticesBuffer = device.createBuffer({
        size:triangle.vertices.byteLength,
        usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })


    verticesBuffer.setSubData(0,triangle.vertices);

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
       // ==================== CALCULATE SEPARATE MATRICES PER-INSTANCE======================== //

       let numInstances = 1600;

       let instanceData = [];
       for(let i = 0; i < numInstances; ++i){
           instanceData.push(
               Math.random(),
               Math.random(),
               Math.random()
           )
       }
   
       let _instanceData = new Float32Array(instanceData);
   
       const instanceBuffer = device.createBuffer({
           size: _instanceData.byteLength,
           usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
       })
   
   
       instanceBuffer.setSubData(0,_instanceData);
    // ==================== BUILD GRAPHICS PIPELINE  ======================== //
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [uniformsBindGroupLayout] });
    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,

        vertexStage: {
            module: device.createShaderModule({
                code: spirv.compileGLSL(vertexShaderGLSL, "vertex"),
                source: vertexShaderGLSL
            }),
            entryPoint: "main"
        },
        fragmentStage: {
            module: device.createShaderModule({
                code: spirv.compileGLSL(fragmentShaderGLSL, "fragment"),
                source: fragmentShaderGLSL
            }),
            entryPoint: "main"
        },

        primitiveTopology: "triangle-list",
        depthStencilState: {
            depthWriteEnabled: true,
            depthCompare: "less",
            format: "depth24plus-stencil8",
        },
        vertexState: {
            vertexBuffers: [{
                arrayStride: triangle.vertexSize,
                attributes: [{
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: "float2"
                    }
                ]
            },{
                arrayStride: 3 * 4,
                attributes:[{
                        // position
                        shaderLocation: 1,
                        offset: 0,
                        format: "float3"
                }]
            }],
        },

        rasterizationState: {
            cullMode: 'none',
        },

        colorStates: [{
            format: "bgra8unorm",
        }],
    });

    // ==================== BUILD RENDERPASS ================= //
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
 

    // ==================== ANIMATE ======================== //
    function getTransformationMatrix() {
        let viewMatrix = mat4.create();
        mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -5));
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
        passEncoder.setVertexBuffer(0, verticesBuffer);
        passEncoder.setVertexBuffer(1, instanceBuffer);
        passEncoder.draw(3 * numInstances, numInstances, 0, 0);
        passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);

    }

    animate();
}