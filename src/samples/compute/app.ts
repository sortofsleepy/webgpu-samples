
import glsl from '../../glslang.js'
import mat4 from '../../mat4'
import vec3 from '../../vec3'
import {generateVertex,generateFragment, generateCompute} from './shaders'
import {getContextType,setupCameraUniforms} from '../../utils'
import glslang from '../../glslang.js'


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

    let numParticles = 300;

    // build buffer data 
    let bufferDataA = new Float32Array(numParticles);
    let bufferDataB = new Float32Array(numParticles);

    for(let i = 0; i < numParticles; ++i){
        bufferDataA[i] = Math.random();
        bufferDataB[i] = Math.random();
    }

    const simDataA = device.createBuffer({
        size:bufferDataA.byteLength,
        usage:GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
    });
    simDataA.setSubData(0,bufferDataA);

    
    const simDataB = device.createBuffer({
        size:bufferDataB.byteLength,
        usage:GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
    });
    simDataB.setSubData(0,bufferDataB);
    

    // create bind group layout
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

    const computePipelineLayout = device.createPipelineLayout({
        bindGroupLayouts:[computeBindGroupLayout]
    })

    const computePipeline = device.createComputePipeline({

        layout:computePipelineLayout,
        computeStage:{
            module:device.createShaderModule({
                code:spirv.compileGLSL(generateCompute(numParticles),"compute")
            }),
            entryPoint:"main"
        }

    });

    // build the bind groups for the simulations. 
    const simulationBindGroups = [1,1];

    for(let i =0; i < 2; ++i){
        simulationBindGroups[i] = device.createBindGroup({
            layout:computeBindGroupLayout,
            bindings:[{
                binding:0,
                resource:{
                    buffer:simDataA,
                    offset:0,
                    size:simDataA.byteLength
                }
            },{
                binding:1,
                resource:{
                    buffer:simDataB,
                    offset:0,
                    size:simDataB.byteLength
                }
            }]
        })
    }

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
 
    let t = 0;
    let animate = () => {

        requestAnimationFrame(animate);

        const commandEncoder = device.createCommandEncoder();

        ubo.setProjection(projectionMatrix);
        ubo.setViewMatrix(viewMatrix);

        renderPassDescriptor.colorAttachments[0].attachment = swapChain.getCurrentTexture().createView();

        // ======= DO COMPUTE FIRST ========= //
     
        /*
           const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0,simulationBindGroups[t %2]);
        passEncoder.dispatch(numParticles);

        passEncoder.endPass();
        */


        //const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        //passEncoder.setPipeline(pipeline);

        //passEncoder.setBindGroup(0,ubo.bindGroup);
        //passEncoder.setVertexBuffer(0,positionBufferA);
        //passEncoder.draw(1,numParticles,0,0);
        //passEncoder.endPass();

        device.defaultQueue.submit([commandEncoder.finish()]);

        t += 1;
    };

    animate();




}// end start