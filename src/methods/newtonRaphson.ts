import { NewtonRaphsonInput, NewtonRaphsonResult, NewtonRaphsonIteration } from '../types/numerical';
import { 
    createExpression, 
    createDerivative,
    validateTolerance, 
    validateMaxIterations, 
    validateFinite, 
    MathError,
    calculateApproximationError,
    calculateResidual,
    hasReachedTolerance
} from '../math';

export function newtonRaphson(input: NewtonRaphsonInput): NewtonRaphsonResult {
    validateTolerance(input.tolerance);
    validateMaxIterations(input.maxIterations);
    validateFinite(input.x0, 'x0');

    const fEvaluator = createExpression(input.expression);
    const { evaluator: dfEvaluator, expressionString: derivativeExpression } = createDerivative(input.expression);

    let currentX = input.x0;
    const iterations: NewtonRaphsonIteration[] = [];

    // Validar x0 inicialmente
    let fx = fEvaluator.evaluate(currentX);
    validateFinite(fx, 'f(x0)');

    if (fx === 0) {
        return {
            root: currentX,
            derivativeExpression,
            iterations: [],
            finalError: null,
            residual: 0,
            converged: true,
            stopReason: 'EXACT_ROOT',
            totalIterations: 0
        };
    }

    for (let k = 0; k < input.maxIterations; k++) {
        // En Newton-Raphson, ya tenemos fx de la iteración anterior o inicio
        const dfx = dfEvaluator.evaluate(currentX);
        
        validateFinite(dfx, `f'(${currentX})`);

        if (dfx === 0) {
            throw new MathError('ZERO_DERIVATIVE', 'La derivada es cero en la aproximación actual. Newton-Raphson no puede continuar.');
        }

        const nextX = currentX - fx / dfx;
        validateFinite(nextX, 'x_(k+1)');

        const fNext = fEvaluator.evaluate(nextX);
        validateFinite(fNext, `f(${nextX})`);

        let error: number | null = null;
        let residual: number = Math.abs(fNext);

        if (input.errorCriterion === 'residual') {
            error = calculateResidual(fEvaluator, nextX);
        } else {
            if (fNext === 0) {
                error = 0;
            } else {
                error = calculateApproximationError(currentX, nextX, input.errorCriterion, fEvaluator);
            }
        }

        iterations.push({
            iteration: k,
            xCurrent: currentX,
            fx: fx,
            dfx: dfx,
            xNext: nextX,
            fNext: fNext,
            error: error,
            residual: residual
        });

        if (fNext === 0) {
            return {
                root: nextX,
                derivativeExpression,
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
                derivativeExpression,
                iterations,
                finalError: error,
                residual: residual,
                converged: true,
                stopReason: 'TOLERANCE_REACHED',
                totalIterations: k + 1
            };
        }

        currentX = nextX;
        fx = fNext;
    }

    return {
        root: currentX,
        derivativeExpression,
        iterations,
        finalError: iterations.length > 0 ? iterations[iterations.length - 1].error : null,
        residual: Math.abs(fx),
        converged: false,
        stopReason: 'MAX_ITERATIONS',
        totalIterations: input.maxIterations
    };
}
