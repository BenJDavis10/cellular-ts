/**
 * Bundles 3-dimensional grid dimensions and provides some helpers for dealing with coordinates in grids of these dimensions.
 * These specify a grid with doubled dimensions, centered at (-0.5, -0.5, -0.5) (good enough) because I'm too lazy to translate it.
 */
export class GridDimensions implements Iterable<[number, number, number]> {
    public constructor(
        public readonly X: number,
        public readonly Y: number,
        public readonly Z: number,
    ) {}


    /**
     * @returns The index of the specified grid coordinates in the flat array encoding
     */
    public indexOf = (x: number, y: number, z: number): number =>
        (x + this.X) * 4 * this.Y * this.Z + (y + this.Y) * 2 * this.Z + (z + this.Z);


    /**
     * @returns `true` if the specified grid coordinates are valid and within the bounds of these grid dimensions, `false` otherwise.
     */
    public inBounds = (x: number, y: number, z: number): boolean =>
        x >= -this.X && x < this.X && y >= -this.Y && y < this.Y && z >= -this.Z && z <= this.Z;


    [Symbol.iterator](): Iterator<[number, number, number], any, any> {
        let [i, j, k] = [-this.X, -this.Y, -this.Z];
        return {
            next: () => {
                if (k >= this.Z) {
                    k = -this.Z;
                    j++;
                }
                if (j >= this.Y) {
                    j = -this.Y;
                    i++;
                }

                return {
                    done: i >= this.X,
                    value: [i, j, k++]
                }
            }
        }
    }
}


/**
 * Represents a grid of automaton cells
 *
 * @property dims - The dimensions of the grid.
 * @property cells - The contents of the grid, encoded in a flat array.
 * @property states - The number of states the cells may take.
 */
export class CellGrid {
    private constructor(
        public readonly dims: GridDimensions,
        public readonly cells: number[],
        public readonly states: number = 2,
    ) {}


    /**
     * @returns An empty grid with the specified dimensions.
     */
    public static makeEmpty = (dims: GridDimensions, states: number = 2): CellGrid =>
        new CellGrid(dims, Array<number>(8 * dims.X * dims.Y * dims.Z).fill(0), states);


    /**
     * @returns A full grid with the specified dimensions.
     */
    public static makeFull = (dims: GridDimensions, states: number = 2): CellGrid =>
        new CellGrid(dims, Array<number>(8 * dims.X * dims.Y * dims.Z).fill(1), states);


    /**
     * Makes a randomly-populated grid with the specified dimensions.
     *
     * @param dims - The dimensions of the grid.
     * @param [prob = 0.5] - The (independent) probability of a cell being live.
     * @param [states = 1] - The number of states.
     * @returns The randomly-generated grid.
     */
    public static makeRandom = (
        dims: GridDimensions,
        prob: number = 0.5,
        states: number = 2
    ): CellGrid =>
        new CellGrid(
            dims,
            Array.from({length: 8 * dims.X * dims.Y * dims.Z}, _ => (Math.random() < prob) ? states - 1 : 0)
        );


    /**
     * @returns A new grid with the given cell array.
     */
    public static makeFromCells = (
        dims: GridDimensions,
        cells: number[],
        states: number = 2,
    ): CellGrid | null =>
        (8 * dims.X * dims.Y * dims.Z == cells.length) ? new CellGrid(dims, cells, states) : null;


    /**
     * @returns The current state of the cell at (x, y, z), or `null` if the cell lies outside the grid.
     */
    public getCell = (x: number, y: number, z: number): number | null =>
        this.dims.inBounds(x, y, z) ? this.cells[this.dims.indexOf(x, y, z)] : null;


    /**
     * @returns Whether the cell at (x, y, z) is in this grid and should be visible.
     */
    public isVisible(x: number, y: number, z: number): boolean {
        let cell = this.getCell(x, y, z);
        return cell != null && cell > 0;
    }


    /**
     * @returns Whether the cell at (x, y, z) is in this grid and live.
     */
    public isLive(x: number, y: number, z: number): boolean {
        let cell = this.getCell(x, y, z);
        return cell != null && cell == this.states - 1;
    }


    /**
     * @returns The number of live neighbours (L1-distance 1) of the cell at (x, y, z).
     */
    public neighbourPop(x: number, y: number, z: number) : number {
        let count = 0;

        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                for (let k = z - 1; k <= z + 1; k++) {
                    if (this.isLive(i, j, k)) count++;
                }
            }
        }

        if (this.isLive(x, y, z)) count--;

        return count;
    }
}

export default CellGrid;