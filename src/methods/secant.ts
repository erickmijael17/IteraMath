import { SecantInput, SecantResult, SecantIteration } from '../types/numerical';
import { 
    createExpression, 
    validateTolerance, 
    validateMaxIterations, 
    validateFinite, 
    MathError,
    calculateApproximationError,
    calculateResidual,
    hasReachedTolerance
} from '../math';

export function secant(input: SecantInput): SecantResult {
    validateTolerance(input.tolerance);
    validateMaxIterations(input.maxIterations);
    validateFinite(input.x0, 'x0');
    validateFinite(input.x1, 'x1');

    const fEvaluator = createExpression(input.expression);
    const iterations: SecantIteration[] = [];

    let xPrevious = input.x0;
    let xCurrent = input.x1;

    let fPrevious = fEvaluator.evaluate(xPrevious);
    validateFinite(fPrevious, 'f(x0)');
    
    if (fPrevious === 0) {
        return {
            root: xPrevious,
            iterations: [],
            finalError: null,
            residual: 0,
            converged: true,
            stopReason: 'EXACT_ROOT',
            totalIterations: 0
        };
    }

    let fCurrent = fEvaluator.evaluate(xCurrent);
    validateFinite(fCurrent, 'f(x1)');

    if (fCurrent === 0) {
        return {
            root: xCurrent,
            iterations: [],
            finalError: null,
            residual: 0,
            converged: true,
            stopReason: 'EXACT_ROOT',
            totalIterations: 0
        };
    }

    for (let k = 0; k < input.maxIterations; k++) {
        const denominator = fCurrent - fPrevious;
        
        if (denominator === 0) {
            throw new MathError('ZERO_SECANT_DENOMINATOR', 'Los valores de la función producen una pendiente secante nula. El método no puede continuar.');
        }

        const xNext = xCurrent - (fCurrent * (xCurrent - xPrevious)) / denominator;
        validateFinite(xNext, 'x_(k+1)');

        const fNext = fEvaluator.evaluate(xNext);
        validateFinite(fNext, `f(${xNext})`);

        let error: number | null = null;
        let residual: number = Math.abs(fNext);

        if (input.errorCriterion === 'residual') {
            error = calculateResidual(fEvaluator, xNext);
        } else {
            if (fNext === 0) {
                error = 0;
            } else {
                error = calculateApproximationError(xCurrent, xNext, input.errorCriterion, fEvaluator);
            }
        }

        iterations.push({
            iteration: k,
            xPrevious: xPrevious,
            xCurrent: xCurrent,
            fPrevious: fPrevious,
            fCurrent: fCurrent,
            xNext: xNext,
            fNext: fNext,
            error: error,
            residual: residual
        });

        if (fNext === 0) {
            return {
                root: xNext,
                iterations,
                finalError: error,
                residual: 0,
                converged: true,
                stopReason: 'EXACT_ROOT',
                totalIterations: k + 1
            };
        }

        if (error !== null && hasReachedTolerance(error, input.tolerance)) {
            return {
                root: xNext,
                iterations,
                finalError: error,
                residual: residual,
                converged: true,
                stopReason: 'TOLERANCE_REACHED',
                totalIterations: k + 1
            };
        }

        xPrevious = xCurrent;
        fPrevious = fCurrent;
        
        xCurrent = xNext;
        fCurrent = fNext;
    }

    return {
        root: xCurrent,
        iterations,
        finalError: iterations.length > 0 ? iterations[iterations.length - 1].error : null,
        residual: Math.abs(fCurrent),
        converged: false,
        stopReason: 'MAX_ITERATIONS',
        totalIterations: input.maxIterations
    };
}
