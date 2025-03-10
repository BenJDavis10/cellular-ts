import CellGrid from "./cellGrid.ts";

/**
 * Stores the current state of a cell grid, including enough information to animate state transitions.
 *
 * @property grid - The grid being transitioned to.
 * @property oldGrid - The grid being transitioned from.
 * @property core - A grid containing only the "core" cells unchanged by the transition.
 */
export default class GridState {
    private constructor(
        public readonly grid: CellGrid,
        public readonly oldGrid: CellGrid,
        public readonly core: CellGrid,
    ) {}


    /**
     * @returns A new transitionless state from the given cell grid.
     */
    public static makeFromGrid = (grid: CellGrid): GridState =>
        new GridState(grid, grid, grid)


    /**
     * Computes the next transition.
     *
     * @param oldState - The state to update.
     * @param rules - The automata rules.
     * @returns The updated state.
     */
    public static makeUpdated(
        oldState: GridState,
        rules: (current: number, neighbours: number) => number,
    ): GridState {
        let oldGrid = oldState.grid;
        let dims = oldGrid.dims;

        let [X, Y, Z] = [oldGrid.dims.X, oldGrid.dims.Y, oldGrid.dims.Z];
        let newCells = Array<number>(8 * X * Y * Z);
        let newCore = Array<number>(8 * X * Y * Z);

        for (let coord of dims) {
            let [x, y, z] = coord;
            let index = dims.indexOf(x, y, z);
            newCells[index] = rules(oldGrid.getCell(x, y, z)!, oldGrid.neighbourPop(x, y, z));

            if (newCells[index] > 0 && oldGrid.isVisible(x, y, z)) {
                newCore[index] = 1;
            }
        }

        return new GridState(
            CellGrid.makeFromCells(dims, newCells, oldGrid.states)!,
            oldGrid,
            CellGrid.makeFromCells(dims, newCore)!,
        )
    }


    /**
     * Skips ahead multiple updates.
     *
     * @param initState - The state to update.
     * @param rules - The automata rules.
     * @param iterations - Number of updates to perform.
     * @returns The updated state.
     */
    public static skipUpdates(
        initState: GridState,
        rules: (current: number, neighbours: number) => number,
        iterations: number,
    ): GridState {
        let currentState = initState;
        for (let _ in { length: iterations }) {
            currentState = this.makeUpdated(currentState, rules);
        }

        return currentState;
    }
}