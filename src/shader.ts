export var vertexShaderGLSL = `#version 450
layout(set = 0, binding = 0) uniform Uniforms {
  mat4 modelViewProjectionMatrix;
} uniforms;


//layout(location = 0) in vec4 position;
layout(location = 0) in vec2 position;
layout(location = 1) in vec3 iPosition;

layout(location = 0) out vec3 vColor;
void main() {
 // gl_Position = uniforms.modelViewProjectionMatrix * position;
 gl_Position = uniforms.modelViewProjectionMatrix * vec4(position + iPosition.xy,iPosition.z,1.);
vColor = iPosition;
}
`;

export var fragmentShaderGLSL = `#version 450

layout(location = 0) out vec4 outColor;
layout(location = 0) in vec3 vColor;
void main() {
  outColor = vec4(vColor,1.0);
}
`;
