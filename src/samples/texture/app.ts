import { cubeVertexArray, cubeVertexSize, cubeUVOffset, cubePositionOffset } from './geo'

import glsl from '../../glslang.js'
import mat4 from '../../mat4'
import vec3 from '../../vec3'
import { getContextType,loadImage } from '../../utils.js'


import vertex from './vertex.glsl'
import fragment from './fragment.glsl'


export default function(){

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
  const uniformBindGroup = null;


  const aspect = Math.abs(canvas.width / canvas.height);
  mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 1, 100.0);


  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

   
  // build swapchain 
  const swapChain = context.configureSwapChain({
      device,
      format: "bgra8unorm"
  });


  //======== LOAG IMAGE =========== //
  loadImage(device,"test.png", tex => {

      
      const verticesBuffer = device.createBuffer({
          size: cubeVertexArray.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        verticesBuffer.setSubData(0, cubeVertexArray);
      
        const bindGroupLayout = device.createBindGroupLayout({
          bindings: [{
            // Transform
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            type: "uniform-buffer"
          }, {
            // Sampler
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            type: "sampler"
          }, {
            // Texture view
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            type: "sampled-texture"
          }]
        });
      
        const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
        const pipeline = device.createRenderPipeline({
          layout: pipelineLayout,
      
          vertexStage: {
            module: device.createShaderModule({
              code: spirv.compileGLSL(vertex, "vertex"),
      
              // @ts-ignore
              source: vertex,
              transform: source => spirv.compileGLSL(source, "vertex"),
            }),
            entryPoint: "main"
          },
          fragmentStage: {
            module: device.createShaderModule({
              code: spirv.compileGLSL(fragment, "fragment"),

              // @ts-ignore
              source: fragment,
              transform: source => spirv.compileGLSL(source, "fragment"),
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
              arrayStride: cubeVertexSize,
              attributes: [{
                // position
                shaderLocation: 0,
                offset: cubePositionOffset,
                format: "float4"
              }, {
                // uv
                shaderLocation: 1,
                offset: cubeUVOffset,
                format: "float2"
              }]
            }],
          },
      
          rasterizationState: {
            cullMode: 'back',
          },
      
          colorStates: [{
            format: "bgra8unorm",
          }],
        });
      
        const depthTexture = device.createTexture({
          size: { width: canvas.width, height: canvas.height, depth: 1 },
          format: "depth24plus-stencil8",
          usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        });
      
        const renderPassDescriptor: GPURenderPassDescriptor = {
          colorAttachments: [{
            attachment: undefined, // Assigned later
      
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
      
        const uniformBufferSize = 4 * 16; // 4x4 matrix
        const uniformBuffer = device.createBuffer({
          size: uniformBufferSize,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
      
        const cubeTexture = tex;
      
        const sampler = device.createSampler({
          magFilter: "linear",
          minFilter: "linear",
        });
      
        const uniformBindGroup = device.createBindGroup({
          layout: bindGroupLayout,
          bindings: [{
            binding: 0,
            resource: {
              buffer: uniformBuffer,
            },
          }, {
            binding: 1,
            resource: sampler,
          }, {
            binding: 2,
            resource: cubeTexture.createView(),
          }],
        });

      
        function getTransformationMatrix() {
          let viewMatrix = mat4.create();
          mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -4));
          let now = Date.now() / 1000;
          mat4.rotate(viewMatrix, viewMatrix, 1, vec3.fromValues(Math.sin(now), Math.cos(now), 0));
      
          let modelViewProjectionMatrix = mat4.create();
          mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
      
          return modelViewProjectionMatrix;
        }
      
        let animate = () => {
            requestAnimationFrame(animate);
          renderPassDescriptor.colorAttachments[0].attachment = swapChain.getCurrentTexture().createView();

          const commandEncoder = device.createCommandEncoder({});
          const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
          passEncoder.setPipeline(pipeline);
          passEncoder.setBindGroup(0, uniformBindGroup);
          passEncoder.setVertexBuffer(0, verticesBuffer);
          passEncoder.draw(36, 1, 0, 0);
          passEncoder.endPass();
      
          device.defaultQueue.submit([commandEncoder.finish()]);
      
          uniformBuffer.setSubData(0, getTransformationMatrix());

        }

        animate();
  }) // end load iamge


} // end start

/*
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
      */
}