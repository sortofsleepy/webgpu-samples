export const cubeVertexSize = 4 * 4// Byte size of one cube vertex.
export const cubePositionOffset = 0;
export const cubeColorOffset = 4 * 4; // Byte offset of cube vertex color attribute.
export const cubeUVOffset = 4 * 8;


export const cubeVertexArray = new Float32Array([
    // float4 position
     1, -1, 1, 1,  
    -1, -1, 1, 1,  
    -1, -1, -1, 1, 
    1, -1, -1, 1,  
    1, -1, 1, 1,  
    -1, -1, -1, 1,

    1, 1, 1, 1,   
    1, -1, 1, 1,  
    1, -1, -1, 1,  
    1, 1, -1, 1,  
    1, 1, 1, 1,    
    1, -1, -1, 1, 

    -1, 1, 1, 1,  
    1, 1, 1, 1,   
    1, 1, -1, 1,  
    -1, 1, -1, 1, 
    -1, 1, 1, 1,  
    1, 1, -1, 1,  

    -1, -1, 1, 1, 
    -1, 1, 1, 1,   
    -1, 1, -1, 1, 
    -1, -1, -1, 1, 
    -1, -1, 1, 1, 
    -1, 1, -1, 1, 

    1, 1, 1, 1,   
    -1, 1, 1, 1,  
    -1, -1, 1, 1,  
    -1, -1, 1, 1,  
    1, -1, 1, 1,   
    1, 1, 1, 1,    

    1, -1, -1, 1,  
    -1, -1, -1, 1, 
    -1, 1, -1, 1,  
    1, 1, -1, 1,   
    1, -1, -1, 1, 
    -1, 1, -1, 1,  
]);