export default function createPlane (sx, sy, nx, ny, options) {
    sx = sx || 1
    sy = sy || 1
    nx = nx || 1
    ny = ny || 1
    var quads = (options && options.quads) ? options.quads : false
  
    var positions = []
    var uvs = []
    var normals = []
    var cells = []
  
    for (var iy = 0; iy <= ny; iy++) {
      for (var ix = 0; ix <= nx; ix++) {
        var u = ix / nx
        var v = iy / ny
        var x = -sx / 2 + u * sx // starts on the left
        var y = sy / 2 - v * sy // starts at the top
        positions.push([x, y, 0])
        uvs.push([u, 1.0 - v])
        normals.push([0, 0, 1])
        if (iy < ny && ix < nx) {
          if (quads) {
            cells.push([iy * (nx + 1) + ix, (iy + 1) * (nx + 1) + ix, (iy + 1) * (nx + 1) + ix + 1, iy * (nx + 1) + ix + 1])
          } else {
            cells.push([iy * (nx + 1) + ix, (iy + 1) * (nx + 1) + ix + 1, iy * (nx + 1) + ix + 1])
            cells.push([(iy + 1) * (nx + 1) + ix + 1, iy * (nx + 1) + ix, (iy + 1) * (nx + 1) + ix])
          }
        }
      }
    }


    // flatten things 
    let finPos = []
    positions.forEach(pos => {
        finPos.push(
            pos[0],pos[1],pos[2]
        )
    })

    let finUvs = [];
    uvs.forEach(uv => {
        finUvs.push(uv[0],uv[1]);
    });

    let finCells = [];
    cells.forEach(cell => {
        finCells.push(cell[0],cell[1],cell[2]);
    })

  
    return {
      positions: new Float32Array(finPos),
      uvs: new Float32Array(finUvs),
      cells: new Uint32Array(finCells)
    }
  }