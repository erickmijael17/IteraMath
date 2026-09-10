import { 
    NumericalMethod, 
    ErrorCriterion, 
    BisectionResult, 
    FalsePositionResult, 
    FixedPointResult, 
    NewtonRaphsonResult, 
    SecantResult, 
    MullerResult 
} from '../types/numerical';

export interface CommonCompareConfig {
    expression: string;
    errorCriterion: ErrorCriterion;
    tolerance: number;
    maxIterations: number;
}

export type CompareMethodSelection = {
    'bisection'?: { a: number; b: number };
    'false-position'?: { a: number; b: number };
    'fixed-point'?: { iterationExpression: string; x0: number };
    'newton-raphson'?: { x0: number };
    'secant'?: { x0: number; x1: number };
    'muller'?: { x0: number; x1: number; x2: number };
};

export interface CompareRequest {
    common: CommonCompareConfig;
    methods: CompareMethodSelection;
}

export type AnyMethodResult = 
    | BisectionResult 
    | FalsePositionResult 
    | FixedPointResult 
    | NewtonRaphsonResult 
    | SecantResult 
    | MullerResult;

export interface CompareMethodResult {
    method: NumericalMethod;
    status: 'success' | 'error';
    result?: AnyMethodResult;
    errorMessage?: string;
}

export interface CompareMetrics {
    leastIterationsMethod: NumericalMethod | null;
    lowestErrorMethod: NumericalMethod | null;
    lowestResidualMethod: NumericalMethod | null;
}

export interface CompareResult {
    results: CompareMethodResult[];
    metrics: CompareMetrics;
}
