import Utils from "../utils.ts";

import Face from './face.ts';
import GridState from "../grid/gridState.ts";

/**
 * The supported face animations
 */
export type AnimType = "GROW" | "SHRINK" | "TRANSITION" | "AO_ONLY";


/**
 * Represents an animated face.
 *
 * @property start - The face to transition from, if any.
 * @property end - The face to transition to, if any.
 * @property type - The animation to use.
 */
export default class AnimFace {
    private constructor(
        public readonly start: Face | null,     // I miss Rust enums :(
        public readonly end: Face | null,
        public readonly type : AnimType,
    ) {}

    /**
     * @returns A growing version of the given face.
     */
    public static makeGrowing = (end : Face) =>
        new AnimFace(null, end, "GROW")


    /**
     * @returns A shrinking version of the given face.
     */
    public static makeShrinking = (start: Face) =>
        new AnimFace(start, null, "SHRINK")


    /**
     * @returns A transitioning face with given start and endpoints. Can specify `type = "AO_ONLY"` to simplify some computations.
     */
    public static makeTransition = (
        start: Face, end: Face,
        type: "TRANSITION" | "AO_ONLY" = "TRANSITION"
    )=>
        new AnimFace(start, end, type)


    /**
     * @returns All animated faces for the given cell, according to the given grid state.
     */
    public static makeFromCell(
        state: GridState,
        x: number, y: number, z:number,
    ): AnimFace[] {
        let [cellStart, cellEnd] = [state.oldGrid.isVisible(x, y, z), state.grid.isVisible(x, y, z)];

        if (!cellStart && !cellEnd) {
            return [];
        } else if (!cellStart) {
            let endFaces = Face.makeAllFromCell(x, y, z, state.grid);
            return endFaces.map((face) => this.makeGrowing(face));
        } else if (!cellEnd) {
            let startFaces = Face.makeAllFromCell(x, y, z, state.oldGrid);
            return startFaces.map((face) => this.makeShrinking(face));
        } else {
            let startFaces = Face.makeFromCell(state.core, x, y, z, state.oldGrid);
            let endFaces = Face.makeFromCell(state.core, x, y, z, state.grid);
            return startFaces.map((start, i) =>
                this.makeTransition(start, endFaces[i], "AO_ONLY")
            );
        }
    }


    /**
     * @returns All animated faces for the given grid state.
     */
    public static makeFromGridState(state: GridState): AnimFace[] {
        let faces = new Array<AnimFace>();

        for (let coord of state.grid.dims) {
            let [x, y, z] = coord;
            faces = faces.concat(this.makeFromCell(state, x, y, z));
        }

        return faces;
    }


    /**
     * Computes animated vertices.
     *
     * @param progress - Animation progress, between `0` and `1`.
     * @returns Vertices at specified stage of the animation.
     */
    public getVertices(progress: number = 0): [number, number, number][] {
        switch(this.type) {
            case "GROW":
                return this.end!.getVertices(Utils.mix(
                    (1 - Math.cos(10 * progress * progress)),
                    1,
                    Utils.smoothStep(progress),
                ));
            case "SHRINK":
                return this.start!.getVertices(1.0 - Utils.smoothStep(2 * progress));
            case "TRANSITION":
                let endVerts = this.end!.getVertices();
                return this.start!.getVertices().map((vert, i) =>
                    Utils.mix3(vert, endVerts[i], Utils.smoothStep(progress))
                );
            case "AO_ONLY":
                return this.start!.getVertices();
        }
    }


    /**
     * Computes animated normal.
     *
     * @param progress - Animation progress, between `0` and `1`.
     * @returns Normal at specified stage of the animation.
     */
    public getNorm(progress: number = 0): [number, number, number] {
        switch(this.type) {
            case "GROW":
                return this.end!.getNorm();
            case "SHRINK":
                return this.start!.getNorm();
            case "TRANSITION":
                return Utils.mix3(      // This is very wrong but probably won't use this one anyways
                    this.start!.getNorm(),
                    this.end!.getNorm(),
                    Utils.smoothStep(progress)
                );
            case "AO_ONLY":
                return this.start!.getNorm();
        }
    }


    /**
     * @returns Face vertex indices, starting at the given offset. Note that these should not change during the animation.
     */
    public getIndices(offset: number): number[] {
        if (this.type == "GROW") {
            return this.end!.getIndices(offset);
        } else {
            return this.start!.getIndices(offset);
        }
    }


    /**
     * Computes animated AO values.
     *
     * @param progress - Animation progress, between `0` and `1`.
     * @returns Vertex AO values at specified stage of the animation.
     */
    public getAOs(progress: number = 0): [number, number, number, number] {
        let control = Utils.smoothStep(progress);
        switch(this.type) {
            case "GROW":
                return Utils.mix4([1.0, 1.0, 1.0, 1.0], this.end!.aos, control);
            case "SHRINK":
                return Utils.mix4(this.start!.aos, [1.0, 1.0, 1.0, 1.0], control);
            case "TRANSITION":
            case "AO_ONLY":
                return Utils.mix4(this.start!.aos, this.end!.aos, control);
        }
    }
}