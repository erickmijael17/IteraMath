export type NumericalMethod = 
    | "bisection" 
    | "false-position" 
    | "fixed-point" 
    | "newton-raphson" 
    | "secant" 
    | "muller";

import { ComplexValue } from '../math/complex';

export type ErrorCriterion = 
    | "absolute" 
    | "relative" 
    | "percentage" 
    | "residual";

export interface MethodConfig {
    method: NumericalMethod;
    fx: string;
    gx?: string;
    a?: number;
    b?: number;
    x0?: number;
    x1?: number;
    x2?: number;
    errorCriterion: ErrorCriterion;
    tolerance: number;
    maxIterations: number;
}

export type StopReason = 
    | "TOLERANCE_REACHED"
    | "EXACT_ROOT"
    | "MAX_ITERATIONS";

export interface BisectionInput {
    expression: string;
    a: number;
    b: number;
    tolerance: number;
    maxIterations: number;
    errorCriterion: ErrorCriterion;
}

export interface BisectionIteration {
    iteration: number;
    a: number;
    b: number;
    midpoint: number;
    fa: number;
    fb: number;
    fm: number;
    error: number | null;
}

export interface FalsePositionInput {
    expression: string;
    a: number;
    b: number;
    tolerance: number;
    maxIterations: number;
    errorCriterion: ErrorCriterion;
}

export interface FalsePositionIteration {
    iteration: number;
    a: number;
    b: number;
    w: number;
    fa: number;
    fb: number;
    fw: number;
    error: number | null;
}

export interface FalsePositionResult {
    root: number;
    iterations: FalsePositionIteration[];
    finalError: number | null;
    residual: number;
    converged: boolean;
    stopReason: StopReason;
    totalIterations: number;
}

export interface FixedPointInput {
    expression: string;
    iterationExpression: string;
    x0: number;
    tolerance: number;
    maxIterations: number;
    errorCriterion: ErrorCriterion;
}

export interface FixedPointIteration {
    iteration: number;
    xCurrent: number;
    xNext: number;
    fNext: number;
    error: number | null;
    residual: number | null;
    gPrime: number | null;
}

export interface FixedPointResult {
    root: number;
    iterations: FixedPointIteration[];
    finalError: number | null;
    residual: number;
    converged: boolean;
    stopReason: StopReason;
    totalIterations: number;
    gPrimeExpression: string | null;
    gPrimeAtRoot: number | null;
}

export interface NewtonRaphsonInput {
    expression: string;
    x0: number;
    tolerance: number;
    maxIterations: number;
    errorCriterion: ErrorCriterion;
}

export interface NewtonRaphsonIteration {
    iteration: number;
    xCurrent: number;
    fx: number;
    dfx: number;
    xNext: number;
    fNext: number;
    error: number | null;
    residual: number;
}

export interface NewtonRaphsonResult {
    root: number;
    derivativeExpression: string;
    iterations: NewtonRaphsonIteration[];
    finalError: number | null;
    residual: number;
    converged: boolean;
    stopReason: StopReason;
    totalIterations: number;
}

export interface SecantInput {
    expression: string;
    x0: number;
    x1: number;
    tolerance: number;
    maxIterations: number;
    errorCriterion: ErrorCriterion;
}

export interface SecantIteration {
    iteration: number;
    xPrevious: number;
    xCurrent: number;
    fPrevious: number;
    fCurrent: number;
    xNext: number;
    fNext: number;
    error: number | null;
    residual: number;
}

export interface SecantResult {
    root: number;
    iterations: SecantIteration[];
    finalError: number | null;
    residual: number;
    converged: boolean;
    stopReason: StopReason;
    totalIterations: number;
}

export interface MullerInput {
    expression: string;
    x0: number;
    x1: number;
    x2: number;
    tolerance: number;
    maxIterations: number;
    errorCriterion: ErrorCriterion;
}

export interface MullerIteration {
    iteration: number;
    x0: ComplexValue;
    x1: ComplexValue;
    x2: ComplexValue;
    a: ComplexValue;
    b: ComplexValue;
    c: ComplexValue;
    discriminant: ComplexValue;
    xNext: ComplexValue;
    error: number | null;
    residual: number;
}

export interface MullerResult {
    root: ComplexValue;
    iterations: MullerIteration[];
    finalError: number | null;
    residual: number;
    converged: boolean;
    stopReason: StopReason;
    totalIterations: number;
}

export interface BisectionResult {
    root: number;
    iterations: BisectionIteration[];
    finalError: number | null;
    residual: number;
    converged: boolean;
    stopReason: StopReason;
    totalIterations: number;
}
