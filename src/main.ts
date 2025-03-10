import * as GLM from 'ts-gl-matrix'

import { CellGrid, GridDimensions } from './cellGrid.ts'

import vertSource from '/src/shader/vert.glsl?raw'
import fragSource from '/src/shader/frag.glsl?raw'
import GridState from "./gridState.ts";
import AnimFace from "./mesh/animFace.ts";

const UPDATE_INTERVAL = 5000;
const ANIM_DURATION = 700;


const canvas = document.querySelector('#canvas')! as HTMLCanvasElement;
const root = document.querySelector('html')!;
canvas.width = root.scrollWidth;
canvas.height = root.scrollHeight;
const gl = canvas.getContext("webgl2")!;

// Configure viewport
gl.viewport(0, 0, canvas.width, canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.enable(gl.DEPTH_TEST);

// Compile shader program
const prog = gl.createProgram();

const vert = gl.createShader(gl.VERTEX_SHADER)!;
gl.shaderSource(vert, vertSource);
gl.compileShader(vert);
gl.attachShader(prog, vert);

const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(frag, fragSource);
gl.compileShader(frag);
gl.attachShader(prog, frag);

gl.linkProgram(prog);
gl.useProgram(prog);

// Bind and configure VBO
const VBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, VBO);

const posLoc = gl.getAttribLocation(prog, "aPos");
const normLoc = gl.getAttribLocation(prog, "aNorm");
const aoLoc = gl.getAttribLocation(prog, "aAO");
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 7 * 4, 0);
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 7 * 4, 3 * 4);
gl.enableVertexAttribArray(normLoc);
gl.vertexAttribPointer(aoLoc, 1, gl.FLOAT, false, 7 * 4, 6 * 4);
gl.enableVertexAttribArray(aoLoc);

// Bind index buffer
const EBO = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);


// Set up projection and view matrices
let height = 10;
let width = height * canvas.width/canvas.height;
let proj = GLM.Mat4.create();
GLM.Mat4.orthoNO(proj, -0.5 * width,  0.5 * width, -0.5 * height, 0.5 * height, -100, 100);
let view = GLM.Mat4.create();
GLM.Mat4.lookAt(
    view,
    GLM.Vec3.fromValues(-1.5, 1.0, -1.0),
    GLM.Vec3.fromValues(0.0, 0.0, 0.0),
    GLM.Vec3.fromValues(0.0, 1.0, 0.0)
);

const projLoc = gl.getUniformLocation(prog, "P");
gl.uniformMatrix4fv(projLoc, false, proj);
const viewLoc = gl.getUniformLocation(prog, "V");
gl.uniformMatrix4fv(viewLoc, false, view);

// Initialize grid state
let initGrid = CellGrid.makeRandom(new GridDimensions(5, 5, 5), 0.25);
let gridState = GridState.makeFromGrid(initGrid);
const rules = (current: number, neighbours: number) =>
    ( (current > 0 && neighbours >= 5 && neighbours <= 7) || (!current && (neighbours == 1)) ) ? 1 : 0;

// 445 Conway-like rules (doesn't work well on this scale)
// {
//     if (current == 0 && neighbours == 4) {
//         return 4;
//     } else if (current == 0 || (current == 4 && neighbours == 4)) {
//         return current;
//     } else {
//         return current - 1;
//     }
// }

// Render loop
let prev = Date.now();
let faces = AnimFace.makeFromGridState(gridState);
const render = () => {
    let now = Date.now();
    if (now - prev > UPDATE_INTERVAL) {                         // Update grid state
        gridState = GridState.makeUpdated(gridState, rules);
        faces = AnimFace.makeFromGridState(gridState);

        prev = now;
    }

    // Compute animated vertex data
    let progress = Math.min((now - prev) / ANIM_DURATION, 1.0);
    let vertices = faces.map(face => face.getVertices(progress)).flat(1);
    let normals = faces.map(face => Array<number[]>(4).fill(face.getNorm())).flat(1);
    let aos = faces.map(face => face.getAOs(progress)).flat(1);

    let vertData = new Float32Array(
        vertices.map((v, i) => [v, normals[i], aos[i]]).flat(3)
    );

    let indices = new Uint16Array(
        faces.map((face, i) => face.getIndices(i * 4)).flat()
    )

    // Draw
    gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.DYNAMIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(render);
}

render();




