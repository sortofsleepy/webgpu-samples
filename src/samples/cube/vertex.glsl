#version 450
layout(set = 0, binding = 0) uniform Uniforms {
  mat4 modelViewProjectionMatrix;
} uniforms;
layout(location = 0) in vec4 position;
layout(location = 0) out vec3 vColor;
void main() {
  gl_Position = uniforms.modelViewProjectionMatrix * position;
}