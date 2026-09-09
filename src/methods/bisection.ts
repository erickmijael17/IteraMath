import { BisectionInput, BisectionResult, BisectionIteration } from '../types/numerical';
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

export function bisection(input: BisectionInput): BisectionResult {
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

    const iterations: BisectionIteration[] = [];
    let currentA = input.a;
    let currentB = input.b;
    let prevMidpoint = 0;

    for (let k = 0; k < input.maxIterations; k++) {
        const m = (currentA + currentB) / 2;
        const fm = evaluator.evaluate(m);
        validateFinite(fm, 'f(m)');

        let error: number | null = null;

        // Calcular error
        if (input.errorCriterion === 'residual') {
            error = calculateResidual(evaluator, m);
        } else if (k > 0) {
            // Evaluamos convergencia (o ceros absolutos validos en medio de biseccion que afectarian relativo)
            if (fm === 0) {
                // Exact root found, bypass calculation of relative error to prevent DIVISION_BY_ZERO
                error = 0; 
            } else {
                error = calculateApproximationError(prevMidpoint, m, input.errorCriterion, evaluator);
            }
        }

        iterations.push({
            iteration: k,
            a: currentA,
            b: currentB,
            midpoint: m,
            fa: currentFa,
            fb: currentFb,
            fm: fm,
            error: error
        });

        if (fm === 0) {
            return {
                root: m,
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
                root: m,
                iterations,
                finalError: error,
                residual: Math.abs(fm),
                converged: true,
                stopReason: 'TOLERANCE_REACHED',
                totalIterations: k + 1
            };
        }

        // Preparar siguiente iteración
        if (currentFa * fm < 0) {
            currentB = m;
            currentFb = fm;
        } else {
            currentA = m;
            currentFa = fm;
        }
        prevMidpoint = m;
    }

    const finalResidual = Math.abs(evaluator.evaluate(prevMidpoint));
    
    return {
        root: prevMidpoint,
        iterations,
        finalError: iterations[iterations.length - 1].error,
        residual: finalResidual,
        converged: false,
        stopReason: 'MAX_ITERATIONS',
        totalIterations: input.maxIterations
    };
}
