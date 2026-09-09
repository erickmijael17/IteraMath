export type MathErrorCode =
    | "INVALID_EXPRESSION"
    | "NON_FINITE_RESULT"
    | "DIVISION_BY_ZERO"
    | "INVALID_TOLERANCE"
    | "INVALID_MAX_ITERATIONS"
    | "OUT_OF_DOMAIN"
    | "INVALID_BRACKET"
    | "INVALID_INTERVAL"
    | "ZERO_DERIVATIVE"
    | "ZERO_SECANT_DENOMINATOR"
    | "DEGENERATE_MULLER_POINTS"
    | "ZERO_MULLER_DENOMINATOR";

export class MathError extends Error {
    public readonly code: MathErrorCode;

    constructor(code: MathErrorCode, message: string) {
        super(message);
        this.name = "MathError";
        this.code = code;
    }
}
