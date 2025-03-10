namespace Utils {
    /**
     * Clamps a numbers between two bounds.
     *
     * @param val - The value to clamp
     * @param min - Lower bound.
     * @param max - Upper bound.
     * @returns The result of clamping val between min and max.
     */
    export const clamp = (val: number, min: number, max: number): number =>
        Math.min(Math.max(val, min), max);


    /**
     * Cubic smooth interpolation between (x, y) = (0, 0) and (1, 1)
     *
     * @param control - The x-coordinate to evaluate at.
     * @returns The smoothly-interpolated value of y when x = control.
     */
    export function smoothStep(control: number): number {
        let c = clamp(control, 0.0, 1.0);
        return clamp(c * c * (3.0 - 2.0 * c), 0.0, 1.0);
    }


    /**
     * Mixes two numbers.
     *
     * @param a - First number to mix.
     * @param b - Second number to mix.
     * @param control - Mixing ratio.
     * @returns Result of mixing. May have unintended results if control > 1 or control < 0.
     */
    export const mix = (a: number, b: number, control: number): number =>
        control * b + (1 - control) * a;


    /**
     * Mixes two triples.
     *
     * @param a - First triple to mix
     * @param b - Second triple to mix
     * @param control - Mixing ratio
     * @returns Result of mixing. May have unintended results if control > 1 or control < 0.
     */
    export const mix3 = (
        a: [number, number, number],
        b: [number, number, number],
        control: number,
    ): [number, number, number] => [
        mix(a[0], b[0], Utils.smoothStep(control)),
        mix(a[1], b[1], Utils.smoothStep(control)),
        mix(a[2], b[2], Utils.smoothStep(control)),
    ];


    /**
     * Mixes two 4-tuples.
     *
     * @param a - First tuple to mix
     * @param b - Second tuple to mix
     * @param control - Mixing ratio
     * @returns Result of mixing. May have unintended results if control > 1 or control < 0.
     */
    export const mix4 = (
        a: [number, number, number, number],
        b: [number, number, number, number],
        control: number,
    ): [number, number, number, number] => [
        mix(a[0], b[0], Utils.smoothStep(control)),
        mix(a[1], b[1], Utils.smoothStep(control)),
        mix(a[2], b[2], Utils.smoothStep(control)),
        mix(a[3], b[3], Utils.smoothStep(control)),
    ];
}

export default Utils;