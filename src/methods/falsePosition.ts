import { FalsePositionInput, FalsePositionResult, FalsePositionIteration } from '../types/numerical';
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

export function falsePosition(input: FalsePositionInput): FalsePositionResult {
    validateTolerance(input.tolerance);
    validateMaxIterations(input.maxIterations);
    validateFinite(input.a, 'a');
    validateFinite(input.b, 'b');

    if (input.a >= input.b) {
        throw new MathError('INVALID_INTERVAL', 'El límite inferior "a" debe ser menor que el límite superior "b".');
    }

    const evaluator = createExpression(input.expression);

    let currentFa = evaluator.evaluate(input.a);
    let currentFb = evaluator.evaluate(input.b);

    validateFinite(currentFa, 'f(a)');
    validateFinite(currentFb, 'f(b)');

    if (currentFa === 0) {
        return {
            root: input.a,
            iterations: [],
            finalError: null,
            residual: 0,
            converged: true,
            stopReason: 'EXACT_ROOT',
            totalIterations: 0
        };
    }

    if (currentFb === 0) {
        return {
            root: input.b,
            iterations: [],
            finalError: null,
            residual: 0,
            converged: true,
            stopReason: 'EXACT_ROOT',
            totalIterations: 0
        };
    }

    if (currentFa * currentFb > 0) {
        throw new MathError('INVALID_BRACKET', 'El intervalo seleccionado no presenta cambio de signo.');
    }

    const iterations: FalsePositionIteration[] = [];
    let currentA = input.a;
    let currentB = input.b;
    let prevW = 0;

    for (let k = 0; k < input.maxIterations; k++) {
        const denom = currentFb - currentFa;
        
        if (denom === 0) {
            throw new MathError('DIVISION_BY_ZERO', 'División por cero en el cálculo de la aproximación w (f(b) = f(a)).');
        }

        // w = b - [f(b)(b-a) / (f(b)-f(a))]
        const w = currentB - (currentFb * (currentB - currentA)) / denom;
        const fw = evaluator.evaluate(w);
        validateFinite(fw, 'f(w)');

        let error: number | null = null;

        // Calcular error
        if (input.errorCriterion === 'residual') {
            error = calculateResidual(evaluator, w);
        } else if (k > 0) {
            if (fw === 0) {
                // Exact root found, bypass calculation of relative error
                error = 0; 
            } else {
                error = calculateApproximationError(prevW, w, input.errorCriterion, evaluator);
            }
        }

        iterations.push({
            iteration: k,
            a: currentA,
            b: currentB,
            w: w,
            fa: currentFa,
            fb: currentFb,
            fw: fw,
            error: error
        });

        if (fw === 0) {
            return {
                root: w,
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
                root: w,
                iterations,
                finalError: error,
                residual: Math.abs(fw),
                converged: true,
                stopReason: 'TOLERANCE_REACHED',
                totalIterations: k + 1
            };
        }

        // Preparar siguiente iteración
        if (currentFa * fw < 0) {
            currentB = w;
            currentFb = fw;
        } else {
            currentA = w;
            currentFa = fw;
        }
        prevW = w;
    }

    const finalResidual = Math.abs(evaluator.evaluate(prevW));
    
    return {
        root: prevW,
        iterations,
        finalError: iterations[iterations.length - 1].error,
        residual: finalResidual,
        converged: false,
        stopReason: 'MAX_ITERATIONS',
        totalIterations: input.maxIterations
    };
}
