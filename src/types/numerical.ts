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
