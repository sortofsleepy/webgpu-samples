


export function generateVertex(){

    return `
    #version 450
        layout(location = 0) in vec4 position;

  
        layout(set = 0, binding = 0) uniform Uniforms {
            mat4 projectionMatrix;
            mat4 viewMatrix;
        } uniforms;

        void main(){

            gl_Position = uniforms.projectionMatrix * uniforms.viewMatrix * vec4(position.xyz,1.);
        }
    `
   
}


export function generateFragment(){

    return `
        #version 450
        layout(location = 0) out vec4 glFragColor;
        void main(){
            glFragColor = vec4(1.0,1.0,0.0,1.0);
        }
    `
}

export function generateCompute(numParticles:number){
    return `
    #version 450
    layout(std140,set=0,binding=0) buffer PositionsIn {
        vec4 positionsIn[${numParticles}];
    };


    layout(std140,set=0,binding=0) buffer PositionsOut {
        vec4 positionsOut[${numParticles}];
    };



    void main(){

        uint index = gl_GlobalInvocationID.x;

        vec3 pos = positionsIn[index].xyz;
        


        // output new data. 
        positionsOut[index].xyz = pos;


    }
`
}