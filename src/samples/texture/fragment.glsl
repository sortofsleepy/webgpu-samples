#version 450
  layout(set = 0, binding = 1) uniform sampler mySampler;
  layout(set = 0, binding = 2) uniform texture2D myTexture;
  layout(location = 0) in vec2 fragUV;
  layout(location = 1) in vec4 fragPosition;
  layout(location = 0) out vec4 outColor;
  void main() {
    outColor =  texture(sampler2D(myTexture, mySampler), fragUV) * fragPosition;
    //outColor =  vec4(fragUV,0.0,1.0);
    
  }