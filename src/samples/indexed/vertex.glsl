#version 450 

layout(set = 0, binding = 0) uniform Uniforms {
  mat4 projectionMatrix;
  mat4 viewMatrix;
} uniforms;

layout(location=0) in vec3 position;
layout(location=1) in vec2 uv;


void main(){

    gl_Position = uniforms.projectionMatrix * uniforms.viewMatrix * vec4(position,1.);
}