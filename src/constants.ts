export default function setConstants(){

    if(navigator.gpu !== undefined){
        let constants =  {

            // ============= SHADER STAGES ============ //
            VERTEX_STAGE:GPUShaderStage.VERTEX,
            FRAGMENT_STAGE:GPUShaderStage.FRAGMENT,
            COMPUTE_STAGE:GPUShaderStage.COMPUTE,

            // ============= BUFFER TYPES ================= //
            UBO:"uniform-buffer",
            SAMPLER:"sampler",
            STORAGE:"storage-buffer",
            TEXTURE:"sampled-texture",

            // ============= MISC / ORGANIZE LATER =============== //
       
            BACK_CULL:"back",
            NO_CULL:"none",
            FRONT_CULL:"front",

            // ============= PRIMITIVES ============== //
            TRIANGLE_LIST:"triangle-list",
            POINT_LIST:"point-list",
            LINE_LIST:"line-list",
            LINE_STRIP:"line-strip",
            TRIANGLE_TRIP:"triangle-strip",
        

            // ============= VALUE TYPES ============== //
            FLOAT4:"float4",
            FLOAT3:"float3",
            FLOAT2:"float2",

            // ============= OPERATIONS ============== //
            STORE_OP:"store",


            // ============= COLOR CONSTANTS ============== //
            BGRA_8_UNORM:"bgra8unorm",
            R8_UNORM:"r8unorm",
            R32_FLOAT:"r32float",
            RGBA8_UINT:"rgba8uint",
            RGBA16_UINT:"rgba16uint",


            BLEND_ZERO:"zero",
            BLEND_ONE:"one",
            SRC_COLOR:"src-color",
            ONE_MINUS_SRC_COLOR:"one-minus-src-color",
            SRC_ALPHA:"src-alpha",
            ONE_MINUS_SRC_ALPHA:"one-minus-src-alpha",
            DST_COLOR:"dst-color",

            // ============= TEXTURE CONSTANTS =============== //
            OUTPUT_ATTACHMENT:GPUTextureUsage.OUTPUT_ATTACHMENT,
            DEPTH24_S8:"depth24plus-stencil8",

            // ============= BUFFER CONSTANTS =============== //
            MAP_WRITE:GPUBufferUsage.MAP_WRITE,
            MAP_READ:GPUBufferUsage.MAP_READ,
            STORAGE:GPUBufferUsage.STORAGE,
            VERTEX:GPUBufferUsage.VERTEX,
            COPY_DST:GPUBufferUsage.COPY_DST,
            UNIFORM:GPUBufferUsage.UNIFORM
        }

        // apply constants onto the window variable.
        for(let i in constants){
            window[i] = constants[i];
        }
    }



}