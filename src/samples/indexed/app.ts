
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

        //========== SETUP ============== //
  
        const canvas = document.createElement("canvas");
        const context = canvas.getContext(getContextType());
    
        const projectionMatrix = mat4.create();
        let viewMatrix = mat4.create();
    
        viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, [0,0,0], [0, 0, 0], [0, 0, 0]);
        mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -800));
  
    
        const aspect = window.innerWidth / window.innerHeight;
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
            bindings: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    type: "uniform-buffer"
                }
            ]
        });
    

        const uniformBufferSize = 128 // 2 4x4 matrix, 16 elements each multiplied by byte size which should usually be 4  
        const uniformBuffer = device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

  
        const uniformBindGroup = device.createBindGroup({
            layout: uniformsBindGroupLayout,
            bindings: [
                {
                    binding: 0,
                    resource: {
                        buffer: uniformBuffer
                    },
                }
        ],
        });


        // ========= IMAGE TEXTURE ========== //
    
    
    
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
        let p = plane(500,500,2,2,{});
    

        let positions = new Float32Array(p.positions);
        let texCoords = new Float32Array(p.uvs);
        let cells = new Uint32Array(p.cells)

        
        // build position buffer 
    
        /*
         let vertices = device.createBuffer({
            size:positions.byteLength,
            usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    
        vertices.setSubData(0,positions);
        */
        const [vertices, positionBufferMap] = device.createBufferMapped({
            size:positions.byteLength,
            usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });

        const positionData = new Float32Array(positionBufferMap);
        for(let i = 0; i < positions.length; ++i){
            positionData[i] = positions[i];
        }
        


        vertices.unmap();
    
        // build uv buffer 
        let uvs = device.createBuffer({
            size:texCoords.byteLength,
            usage:GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        })
    
        uvs.setSubData(0,texCoords);
    
        // build index buffer 
        let indices = device.createBuffer({
            size:cells.byteLength,
            usage:GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        })
        indices.setSubData(0,cells);
    
        let indexCount = cells.length;
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

    
        let animate = () => {
            requestAnimationFrame(animate);
            uniformBuffer.setSubData(0, projectionMatrix);
            uniformBuffer.setSubData(64, viewMatrix);
  

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