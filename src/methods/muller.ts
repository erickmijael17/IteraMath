import { MullerInput, MullerResult, MullerIteration } from '../types/numerical';
import { 
    createComplexExpression,
    validateTolerance, 
    validateMaxIterations, 
    validateFinite, 
    MathError,
    ComplexValue,
    toComplexValue,
    fromComplexValue,
    complexMagnitude
} from '../math';
import * as math from 'mathjs';

export function muller(input: MullerInput): MullerResult {
    validateTolerance(input.tolerance);
    validateMaxIterations(input.maxIterations);
    validateFinite(input.x0, 'x0');
    validateFinite(input.x1, 'x1');
    validateFinite(input.x2, 'x2');

    // Validación de puntos degenerados
    if (input.x0 === input.x1 || input.x0 === input.x2 || input.x1 === input.x2) {
        throw new MathError('DEGENERATE_MULLER_POINTS', 'Los tres puntos iniciales no permiten construir una parábola válida. Utiliza tres valores distintos.');
    }

    const evaluator = createComplexExpression(input.expression);
    const iterations: MullerIteration[] = [];

    let x0 = toComplexValue(input.x0);
    let x1 = toComplexValue(input.x1);
    let x2 = toComplexValue(input.x2);

    let f0 = evaluator.evaluate(x0);
    let f1 = evaluator.evaluate(x1);
    let f2 = evaluator.evaluate(x2);

    // Detección inicial
    if (complexMagnitude(f0) === 0) {
        return createExactResult(x0);
    }
    if (complexMagnitude(f1) === 0) {
        return createExactResult(x1);
    }
    if (complexMagnitude(f2) === 0) {
        return createExactResult(x2);
    }

    for (let k = 0; k < input.maxIterations; k++) {
        // Conversión a math.Complex para operaciones
        const mx0 = fromComplexValue(x0);
        const mx1 = fromComplexValue(x1);
        const mx2 = fromComplexValue(x2);
        const mf0 = fromComplexValue(f0);
        const mf1 = fromComplexValue(f1);
        const mf2 = fromComplexValue(f2);

        const d01 = math.subtract(mx0, mx1) as math.Complex;
        const d02 = math.subtract(mx0, mx2) as math.Complex;
        const d12 = math.subtract(mx1, mx2) as math.Complex;
        
        const df02 = math.subtract(mf0, mf2) as math.Complex;
        const df12 = math.subtract(mf1, mf2) as math.Complex;

        const d02_sq = math.pow(d02, 2) as math.Complex;
        const d12_sq = math.pow(d12, 2) as math.Complex;

        const denominator = math.multiply(math.multiply(d02, d12), d01) as math.Complex;
        
        if (complexMagnitude(toComplexValue(denominator)) === 0) {
            throw new MathError('DEGENERATE_MULLER_POINTS', 'Los tres puntos iniciales no permiten construir una parábola válida. Utiliza tres valores distintos.');
        }

        // a = [ (x1-x2)(f0-f2) - (x0-x2)(f1-f2) ] / den
        const aNum1 = math.multiply(d12, df02) as math.Complex;
        const aNum2 = math.multiply(d02, df12) as math.Complex;
        const aNum = math.subtract(aNum1, aNum2) as math.Complex;
        const a = math.divide(aNum, denominator) as math.Complex;

        // b = [ (x0-x2)^2 (f1-f2) - (x1-x2)^2 (f0-f2) ] / den
        const bNum1 = math.multiply(d02_sq, df12) as math.Complex;
        const bNum2 = math.multiply(d12_sq, df02) as math.Complex;
        const bNum = math.subtract(bNum1, bNum2) as math.Complex;
        const b = math.divide(bNum, denominator) as math.Complex;

        // c = f2
        const c = mf2;

        // D = sqrt(b^2 - 4ac)
        const b_sq = math.pow(b, 2) as math.Complex;
        const four_ac = math.multiply(math.multiply(4, a), c) as math.Complex;
        const disc_inner = math.subtract(b_sq, four_ac) as math.Complex;
        const D = math.sqrt(disc_inner) as math.Complex;

        // Elección de E
        const E1 = math.add(b, D) as math.Complex;
        const E2 = math.subtract(b, D) as math.Complex;

        const E = complexMagnitude(toComplexValue(E1)) >= complexMagnitude(toComplexValue(E2)) ? E1 : E2;

        if (complexMagnitude(toComplexValue(E)) === 0) {
            throw new MathError('ZERO_MULLER_DENOMINATOR', 'El denominador cuadrático evaluado es nulo. No es posible hallar el siguiente paso.');
        }

        // h = -2c / E
        const minus_2c = math.multiply(-2, c) as math.Complex;
        const h = math.divide(minus_2c, E) as math.Complex;

        // xNext = x2 + h
        const mxNext = math.add(mx2, h) as math.Complex;
        const xNext = toComplexValue(mxNext);

        const fNext = evaluator.evaluate(xNext);

        let error: number | null = null;
        const residual = complexMagnitude(fNext);
        const xNextMag = complexMagnitude(xNext);
        const diffMag = complexMagnitude(toComplexValue(h)); // |xNext - x2| = |h|

        if (input.errorCriterion === 'residual') {
            error = residual;
        } else if (input.errorCriterion === 'absolute') {
            error = diffMag;
        } else {
            if (xNextMag === 0) {
                if (residual === 0) {
                    error = 0;
                } else {
                    throw new MathError('DIVISION_BY_ZERO', 'No se puede calcular error relativo/porcentual porque la aproximación es cero.');
                }
            } else {
                error = diffMag / xNextMag;
                if (input.errorCriterion === 'percentage') {
                    error *= 100;
                }
            }
        }

        iterations.push({
            iteration: k,
            x0, x1, x2,
            a: toComplexValue(a),
            b: toComplexValue(b),
            c: toComplexValue(c),
            discriminant: toComplexValue(D),
            xNext,
            error,
            residual
        });

        if (error !== null && error <= input.tolerance) {
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

        if (residual === 0) {
            return {
                root: xNext,
                iterations,
                finalError: error,
                residual: residual,
                converged: true,
                stopReason: 'EXACT_ROOT',
                totalIterations: k + 1
            };
        }

        x0 = x1;
        x1 = x2;
        x2 = xNext;

        f0 = f1;
        f1 = f2;
        f2 = fNext;
    }

    return {
        root: x2,
        iterations,
        finalError: iterations.length > 0 ? iterations[iterations.length - 1].error : null,
        residual: complexMagnitude(f2),
        converged: false,
        stopReason: 'MAX_ITERATIONS',
        totalIterations: input.maxIterations
    };
}

function createExactResult(root: ComplexValue): MullerResult {
    return {
        root,
        iterations: [],
        finalError: null,
        residual: 0,
        converged: true,
        stopReason: 'EXACT_ROOT',
        totalIterations: 0
    };
}
