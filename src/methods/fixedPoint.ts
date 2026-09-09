import { FixedPointInput, FixedPointResult, FixedPointIteration } from '../types/numerical';
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

export function fixedPoint(input: FixedPointInput): FixedPointResult {
    validateTolerance(input.tolerance);
    validateMaxIterations(input.maxIterations);
    validateFinite(input.x0, 'x0');

    const fEvaluator = createExpression(input.expression);
    const gEvaluator = createExpression(input.iterationExpression);

    let currentX = input.x0;
    const iterations: FixedPointIteration[] = [];

    // Validar inicialmente x0 en f(x)
    let fCurrent = fEvaluator.evaluate(currentX);
    validateFinite(fCurrent, 'f(x0)');

    if (fCurrent === 0) {
        return {
            root: currentX,
            iterations: [],
            finalError: null,
            residual: 0,
            converged: true,
            stopReason: 'EXACT_ROOT',
            totalIterations: 0
        };
    }

    for (let k = 0; k < input.maxIterations; k++) {
        const nextX = gEvaluator.evaluate(currentX);
        
        if (isNaN(nextX) || !isFinite(nextX)) {
            throw new MathError('NON_FINITE_RESULT', `La función de iteración g(x) generó un valor no numérico o infinito en x = ${currentX}.`);
        }

        const fNext = fEvaluator.evaluate(nextX);
        
        if (isNaN(fNext) || !isFinite(fNext)) {
            throw new MathError('OUT_OF_DOMAIN', `La función f(x) no está definida o diverge al infinito en x = ${nextX}.`);
        }

        let error: number | null = null;
        let residual: number | null = null;

        if (input.errorCriterion === 'residual') {
            residual = calculateResidual(fEvaluator, nextX);
            error = residual;
        } else {
            residual = Math.abs(fNext);
            if (fNext === 0) {
                error = 0;
            } else {
                error = calculateApproximationError(currentX, nextX, input.errorCriterion, fEvaluator);
            }
        }

        iterations.push({
            iteration: k,
            xCurrent: currentX,
            xNext: nextX,
            fNext: fNext,
            error: error,
            residual: residual
        });

        if (fNext === 0) {
            return {
                root: nextX,
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
                root: nextX,
                iterations,
                finalError: error,
                residual: Math.abs(fNext),
                converged: true,
                stopReason: 'TOLERANCE_REACHED',
                totalIterations: k + 1
            };
        }

        currentX = nextX;
    }

    const finalResidual = Math.abs(fEvaluator.evaluate(currentX));

    return {
        root: currentX,
        iterations,
        finalError: iterations.length > 0 ? iterations[iterations.length - 1].error : null,
        residual: finalResidual,
        converged: false,
        stopReason: 'MAX_ITERATIONS',
        totalIterations: input.maxIterations
    };
}
