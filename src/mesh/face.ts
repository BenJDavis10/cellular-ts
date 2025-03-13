import CellGrid from "../grid/cellGrid.ts";

/**
 * Represents the three possible voxel face directions (we will only view from negative x, z and positive y).
 */
enum SIDE {
    // XPOS, XNEG,
    // YPOS, YNEG,
    // ZPOS, ZNEG,
    XNEG, YPOS, ZNEG,
}
const SIDES = Object.values(SIDE)       // To facilitate iteration
    .filter(side => typeof(side) !== "string");

const directions: [number, number, number][] = [    // Vector representation of each side
    // [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    // [0, -1, 0],
    // [0, 0, 1],
    [0, 0, -1]
];


/**
 * Represents a voxel face, bundled with vertex AO values.
 *
 * @property x - Voxel x-coord.
 * @property y - Voxel y-coord.
 * @property z - Voxel z-coord.
 * @property side - Direction of face.
 * @property aos - AO values.
 */
class Face {
    // private constructor(
    private constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly z: number,
        public readonly side: SIDE,
        public readonly aos: [number, number, number, number],
    ) {}


    /**
     * @returns An array of all faces for the given voxel position.
     */
    public static makeAllPos = (
        x: number, y: number, z: number,
        aos: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0]
    ): Face[] =>
        SIDES.map(side => new Face(x, y, z, side, aos));


    /**
     * Computes an array of all visible faces for the given cell.
     *
     * @param cellGrid - The cell grid to use for culling.
     * @param x - Voxel x-coord.
     * @param y - Voxel y-coord.
     * @param z - Voxel z-coord.
     * @param aoGrid - The cell grid to use for AO.
     *
     * @returns An array of visible faces.
     */
    public static makeFromCell(
        cellGrid: CellGrid,
        x: number, y: number, z: number,
        aoGrid: CellGrid = cellGrid
    ): Face[] {
        if (!cellGrid.isVisible(x, y, z)) return [];

        let visSides = SIDES.filter(side => {
            let dir = directions[side];
            return !cellGrid.isVisible(x + dir[0], y + dir[1], z + dir[2]);
        });

        return visSides.map(side => new Face(x, y, z, side, this.faceAOs(aoGrid, x, y, z, side)));
    }


    /**
     * @returns All faces for the given cell, with AO computed with `aoGrid`.
     */
    public static makeAllFromCell = (
        x: number, y: number, z: number,
        aoGrid: CellGrid,
    ): Face[] =>
        SIDES.map(side => new Face(x, y, z, side, this.faceAOs(aoGrid, x, y, z, side)))


    /**
     * @returns The occlusion value at a vertex with the specified neighbour values (we assume that the vertex is visible, so it has at most three neighbours).
     */
    private static vertexAO(side1: boolean | null, side2: boolean | null, corner: boolean | null): number {
        if (side1 && side2) {
            return 0.25;
        } else if (side1 && corner || side2 && corner) {
            return 0.5;
        } else if (side1 || side2 || corner) {
            return 0.75;
        } else {
            return 1.0;
        }
    }


    /**
     * @returns Vertex AO values, given a face's neighbourhood in clockwise order (facing towards voxel).
     */
    private static sideAOs(adj: (boolean | null)[]): [number, number, number, number] {
        if (adj.length !== 8) {
            return [1, 1, 1, 1];
        }

        return [
            this.vertexAO(adj[0], adj[2], adj[1]),
            this.vertexAO(adj[2], adj[4], adj[3]),
            this.vertexAO(adj[0], adj[6], adj[7]),
            this.vertexAO(adj[4], adj[6], adj[5])
        ];
    }

    /**
     * @returns All vertex AO values for the given face.
     */
    private static faceAOs(cellGrid: CellGrid, x: number,  y: number, z: number, side: SIDE): [number, number, number, number] {
        switch (side) {
            case SIDE.XNEG:
                return this.sideAOs([
                    cellGrid.isVisible(   x - 1,  y,      z + 1   ),
                    cellGrid.isVisible(   x - 1,  y - 1,  z + 1   ),
                    cellGrid.isVisible(   x - 1,  y - 1,  z       ),
                    cellGrid.isVisible(   x - 1,  y - 1,  z - 1   ),
                    cellGrid.isVisible(   x - 1,  y,      z - 1   ),
                    cellGrid.isVisible(   x - 1,  y + 1,  z - 1   ),
                    cellGrid.isVisible(   x - 1,  y + 1,  z       ),
                    cellGrid.isVisible(   x - 1,  y + 1,  z + 1   ),
                ]);
            case SIDE.YPOS:
                return this.sideAOs([
                    cellGrid.isVisible(   x,      y + 1,  z + 1    ),
                    cellGrid.isVisible(   x - 1,  y + 1,  z + 1    ),
                    cellGrid.isVisible(   x - 1,  y + 1,  z        ),
                    cellGrid.isVisible(   x - 1,  y + 1,  z - 1    ),
                    cellGrid.isVisible(   x,      y + 1,  z - 1    ),
                    cellGrid.isVisible(   x + 1,  y + 1,  z - 1    ),
                    cellGrid.isVisible(   x + 1,  y + 1,  z        ),
                    cellGrid.isVisible(   x + 1,  y + 1,  z + 1    ),
                ]);
            case SIDE.ZNEG:
                return this.sideAOs([
                    cellGrid.isVisible(   x - 1,  y,      z - 1   ),
                    cellGrid.isVisible(   x - 1,  y - 1,  z - 1   ),
                    cellGrid.isVisible(   x,      y - 1,  z - 1   ),
                    cellGrid.isVisible(   x + 1,  y - 1,  z - 1   ),
                    cellGrid.isVisible(   x + 1,  y,      z - 1   ),
                    cellGrid.isVisible(   x + 1,  y + 1,  z - 1   ),
                    cellGrid.isVisible(   x,      y + 1,  z - 1   ),
                    cellGrid.isVisible(   x - 1,  y + 1,  z - 1   ),
                ]);
        }
    }


    /**
     * @returns Face vertices.
     */
    public getVertices(scale = 1.0): [number, number, number][] {
        const relPositions = [
            // [   [1.0, 0.0, 1.0],    [1.0, 0.0, 0.0],    [1.0, 1.0, 1.0],    [1.0, 1.0, 0.0],    ],
            [   [0.0, 0.0, 1.0],    [0.0, 0.0, 0.0],    [0.0, 1.0, 1.0],    [0.0, 1.0, 0.0],    ],
            [   [0.0, 1.0, 1.0],    [0.0, 1.0, 0.0],    [1.0, 1.0, 1.0],    [1.0, 1.0, 0.0],    ],
            // [   [0.0, 0.0, 1.0],    [1.0, 0.0, 1.0],    [0.0, 0.0, 0.0],    [1.0, 0.0, 0.0],    ],
            // [   [1.0, 0.0, 1.0],    [0.0, 0.0, 1.0],    [1.0, 1.0, 1.0],    [0.0, 1.0, 1.0],    ],
            [   [0.0, 0.0, 0.0],    [1.0, 0.0, 0.0],    [0.0, 1.0, 0.0],    [1.0, 1.0, 0.0],    ],
        ] as [number, number, number][][];

        return relPositions[this.side].map(([x, y, z]) =>
            [scale * (x - 0.5) + this.x, scale * (y - 0.5) + this.y, scale * (z - 0.5) + this.z]
        );
    }


    /**
     * @returns Face vertex indices, starting at the given offset.
     */
    public getIndices(offset: number): number[] {
        if (this.aos[1] + this.aos[2] > this.aos[0] + this.aos[3]) {
            return [offset, offset + 1, offset + 2, offset + 1, offset + 2, offset + 3];
        } else {
            return [offset, offset + 3, offset + 1, offset, offset + 2, offset + 3];
        }
    }


    /**
     * @returns The face normal.
     */
    public getNorm = (): [number, number, number] =>
        directions[this.side]
}

export default Face;