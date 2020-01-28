#version 450
  layout(set = 0, binding = 0) uniform Uniforms {
    mat4 modelViewProjectionMatrix;
  } uniforms;
  layout(location = 0) in vec4 position;
  layout(location = 1) in vec2 uv;
  layout(location = 0) out vec2 fragUV;
  layout(location = 1) out vec4 fragPosition;
  void main() {
    fragPosition = 0.5 * (position + vec4(1.0));
    gl_Position = uniforms.modelViewProjectionMatrix * position;
    fragUV = uv;
  }