import { ComplexValue } from '../matematicas/complex';

export type MethodId =
    | 'gauss'
    | 'gauss-jordan'
    | 'lu'
    | 'cholesky'
    | 'inverse'
    | 'cramer'
    | 'jacobi'
    | 'gauss-seidel'
    | 'newton-system'
    | 'fixed-point-system'
    | 'lagrange'
    | 'newton-divided'
    | 'regression-poly'
    | 'regression-multiple';

export type VectorNorm = 'inf' | '1' | '2';

export type ErrorCriterion = 'absolute' | 'relative' | 'percentage' | 'residual';

export interface BaseInput {
    formValues?: Record<string, string>;
}

export interface SystemInput extends BaseInput {
    A: number[][];
    b: number[];
    pivot: boolean;
}

export interface IterativeInput extends SystemInput {
    x0: number[];
    tolerance: number;
    maxIterations: number;
    norm: VectorNorm;
}

export interface NewtonSystemInput extends BaseInput {
    equations: string[];
    x0: number[];
    tolerance: number;
    maxIterations: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface LagrangeInput extends BaseInput {
    points: Point[];
    at: number;
    degree: number;
    mode: 'apropiados' | 'todos';
    expression: string;
}

export interface NewtonDividedInput extends BaseInput {
    points: Point[];
    at: number;
    degree: number;
    form: 'auto' | 'progresiva' | 'regresiva';
}

export interface PolyRegInput extends BaseInput {
    points: Point[];
    degree: number;
    at?: number;
}

export interface MultiRow {
    x1: number;
    x2: number;
    y: number;
}

export interface MultiRegInput extends BaseInput {
    rows: MultiRow[];
}

export type MethodInput =
    | SystemInput
    | IterativeInput
    | NewtonSystemInput
    | LagrangeInput
    | NewtonDividedInput
    | PolyRegInput
    | MultiRegInput;

export interface TableData {
    title: string;
    headers: string[];
    rows: (number | string)[][];
    markColumn?: number;
}

export interface DetailLine {
    label: string;
    value: string;
}

export interface IterationRow {
    iteration: number;
    x: number[];
    error: number | null;
}

export type GraphSpec =
    | { type: 'bars'; title: string; labels: string[]; values: number[] }
    | { type: 'convergence'; title: string; series: { name: string; iterations: number[]; errors: number[] }[] }
    | { type: 'curve'; title: string; nodes: Point[]; curves: { name: string; xs: number[]; ys: number[] }[]; marker?: Point }
    | { type: 'predobs'; title: string; observed: number[]; predicted: number[] }
    | { type: 'path'; title: string; xs: number[]; ys: number[] }
    | { type: 'none' };

export interface SolveResult {
    converged: boolean;
    status: string;
    headlineLabel: string;
    headline: string;
    secondaryLabel?: string;
    secondary?: string;
    details: DetailLine[];
    tables: TableData[];
    octave: string;
    graph: GraphSpec;
    note?: string;
    values: number[];
    extra: Record<string, number>;
    series?: IterationRow[];
}

/** Métodos de la unidad 1. Siguen en el proyecto, fuera de la lista visible. */
export type NumericalMethod =
    | 'bisection'
    | 'false-position'
    | 'fixed-point'
    | 'newton-raphson'
    | 'secant'
    | 'muller';

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
    | 'TOLERANCE_REACHED'
    | 'EXACT_ROOT'
    | 'MAX_ITERATIONS';

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

export interface BisectionResult {
    root: number;
    iterations: BisectionIteration[];
    finalError: number | null;
    residual: number;
    converged: boolean;
    stopReason: StopReason;
    totalIterations: number;
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
