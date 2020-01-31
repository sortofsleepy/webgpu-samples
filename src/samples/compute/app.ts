
import glsl from '../../glslang.js'
import mat4 from '../../mat4'
import vec3 from '../../vec3'
import {generateVertex,generateFragment, generateCompute} from './shaders'
import {getContextType,setupCameraUniforms} from '../../utils'


// attempt to re-create this via compute shaders
// https://github.com/hughsk/particle-excess-demo/blob/master/shaders/logic.frag


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
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -300));


    const aspect = window.innerWidth / window.innerHeight;
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, 1000000.0);

    // setup UBO for camera stuff. 
    let ubo = setupCameraUniforms(device);


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
    
    // =========== BUILD POSITION VERTEX DATA ============= //

    // BUilding double buffer backed data bufferes. 
    let numParticles = 400;
   
    const [positionBufferA, positionBufferMap] = device.createBufferMapped({
        size:16 * numParticles,
        usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    });

    const positionData = new Float32Array(positionBufferMap);
    for(let i = 0; i < numParticles; i += 4){
        
        positionData[i]     = Math.floor(Math.random() * 25);
        positionData[i + 1] = Math.floor(Math.random() * 25);
        positionData[i + 2] = Math.floor(Math.random() * 25);
        positionData[i + 3] = 128;

    }
    positionBufferA.unmap();

    // bundle second position buffer. 
    const [positionBufferB, positionBufferMapB] = device.createBufferMapped({
        size:16 * numParticles,
        usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE
    });

    const positionDataB = new Float32Array(positionBufferMapB);
    for(let i = 0; i < numParticles; i += 4){
        
        positionDataB[i] = Math.random() + 0.4;
        positionDataB[i + 1] = Math.random() + 0.5;
        positionDataB[i + 2] = Math.random() + 0.5;
        positionDataB[i + 3] = 0;

    }
    positionBufferB.unmap();

   

    // =============== BUILD COMPUTE PIPELINE =================== 
    const computeBindGroupLayout = device.createBindGroupLayout({
        bindings:[
            {
                binding:0,
                visibility:GPUShaderStage.COMPUTE,
                type:"storage-buffer"
            },
            {
                binding:1,
                visibility:GPUShaderStage.COMPUTE,
                type:"storage-buffer"
            }
        ]
    });

    const computeBindGroupA2B = device.createBindGroup({
        layout:computeBindGroupLayout,
        bindings:[
            {
                binding:0,
                resource:{
                    buffer:positionBufferA
                }
            },
            {
                binding:1,
                resource:{
                    buffer:positionBufferB
                }
            }
        ]
    });

    const computeBindGroupB2A = device.createBindGroup({
        layout:computeBindGroupLayout,
        bindings:[
            {
                binding:0,
                resource:{
                    buffer:positionBufferB
                }
            },
            {
                binding:1,
                resource:{
                    buffer:positionBufferA
                }
            }
        ]
    })

    const computePipeline = device.createComputePipeline({
        layout:device.createPipelineLayout({
            bindGroupLayouts:[computeBindGroupLayout]
        }),
        computeStage:{
            module:device.createShaderModule({
                code:spirv.compileGLSL(generateCompute(numParticles),"compute")
            }),
            entryPoint:"main"
        }
    })




    // ============= BUILD RENDER PIPELINE ==================== //
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [
        ubo.bindGroupLayout
    ] });
    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,

        vertexStage:{
            module:device.createShaderModule({
                code:spirv.compileGLSL(generateVertex(),"vertex")
            }),
            entryPoint:"main"
        },

        fragmentStage:{
            module:device.createShaderModule({
                code:spirv.compileGLSL(generateFragment(),"fragment")
            }),
            entryPoint:"main"
        },

        primitiveTopology: "point-list",
        depthStencilState: {
            depthWriteEnabled: true,
            depthCompare: "less",
            format: "depth24plus-stencil8",
        },

        vertexState: {
        
            vertexBuffers: [{
                arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
                stepMode:"instance",
                attributes: [
                    {
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: "float4"
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
    
 
    let currentPositionBuffer = positionBufferB;

    // ========== ANIMATE THINGS =============== //
 
    let animate = () => {

        requestAnimationFrame(animate);

        const commandEncoder = device.createCommandEncoder();

        ubo.setProjection(projectionMatrix);
        ubo.setViewMatrix(viewMatrix);

        renderPassDescriptor.colorAttachments[0].attachment = swapChain.getCurrentTexture().createView();

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);

        passEncoder.setBindGroup(0,ubo.bindGroup);
        passEncoder.setVertexBuffer(0,positionBufferA);
        passEncoder.draw(1,numParticles,0,0);
        passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);

    };

    animate();




}// end start