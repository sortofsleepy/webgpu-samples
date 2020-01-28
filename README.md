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


Notes on differeneces between Chrome / Safari - and other random stuff. 
===
* In Safari, context string is just "gpu" 
```javascript 

 let canvas = document.createElement("canvas");
 let ctx = canvas.getContext("gpupresent") // chrome 
 let ctx = canvas.getContext("gpu") // safari


```
* In Safari `setSubData` on GPUBuffer is not defined, looks like you might need to run the map functions based on this Safari snippit. 
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
 
