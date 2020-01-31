# webgpu-samples
just different webgpu experiments - mostly derived from existing code linked below. Nothing really different but more re-organizing and poking at different things to see what happens. 

* [https://github.com/austinEng/webgpu-samples](https://github.com/austinEng/webgpu-samples)

To Run 
===== 
You need a browser with a WebGPU implmentation available. At the time of this writing the best is either the [Safari Technology Preview](https://developer.apple.com/safari/download/) or 
[Chrome canary](https://www.google.com/chrome/canary/)

That being said, these samples will probably only work with Chrome Canary as the implementation between Chrome and Safari is a little different.

After you download 
* In Chrome Canary you can find the setting behind chrome://flags


[Current Spec can be found here](https://gpuweb.github.io/gpuweb/)
====

Notes on differeneces between Chrome / Safari - and other random stuff. 
===
* In Safari, context string is just "gpu" 
```javascript 

 let canvas = document.createElement("canvas");
 let ctx = canvas.getContext("gpupresent") // chrome 
 let ctx = canvas.getContext("gpu") // safari


```
* In Safari `setSubData` on GPUBuffer is not defined, looks like you might need to run the map functions based on this Safari snippit. Chrome should support mapping functions.
```javascript 

// from Hello triangle sample here 
// https://webkit.org/demos/webgpu/hello-triangle.html
 const vertexArrayBuffer = await vertexBuffer.mapWriteAsync();
    const vertexWriteArray = new Float32Array(vertexArrayBuffer);
    vertexWriteArray.set([
        // x, y, z, w, r, g, b, a
        0, 0.8, 0, 1, 0, 1, 1, 1,
        -0.8, -0.8, 0, 1, 1, 1, 0, 1,
        0.8, -0.8, 0, 1, 1, 0, 1, 1
    ]);
    vertexBuffer.unmap();
    
```


* For vertex attributes while rendering, a stride is now required unlike previously in WebGL/OpenGL. It should usually be (num elements per vertex attribute) * (container type, ie Float32Array).byteLength

* buffer size should follow the same pattern as above.

* turning on instancing seems to be associated with setting the `stepMode` property on the attribute you would like to instance. 

* drawing indexed geometry requires setting the `indexFormat` property of the vertexState key in a renderpipeline. 

Textures
=====

Textures are a little more complicated in WebGPU API. 

You need 2 items per texture
* A "sampler" object binding that essentially describes out to read a texture and contains settings for things like min/mag filter, clamping, etc. 
* A texture binding in relation to the actual texture itself. 

In the shader, reading the texture looks something like this. 
```C
vec4 color = texture(sampler2D(myTexture, mySampler), fragUV);
````

Also it seems that it's no longer to possible to directly pass `Image` objects as texture data. Instead, you need to read the image information into a TypedArray, then convert that into a `GPUBuffer` object in order to send texture information. 
See `loadImage()` in `utils.ts` for an example of how to do this. Note that the functin is basically taken directly from the source sample, some things about how it works is currently unclear. 
