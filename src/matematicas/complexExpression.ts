import * as math from 'mathjs';
import { MathError } from './errors';
import { ComplexValue, toComplexValue, fromComplexValue } from './complex';

export interface ComplexEvaluator {
    evaluate(x: ComplexValue): ComplexValue;
}

export function createComplexExpression(expression: string): ComplexEvaluator {
    try {
        const node = math.parse(expression);
        const compiled = node.compile();

        return {
            evaluate: (x: ComplexValue): ComplexValue => {
                try {
                    const mathComplex = fromComplexValue(x);
                    const result = compiled.evaluate({ x: mathComplex });
                    
                    if (typeof result === 'number' && !isFinite(result)) {
                        throw new MathError('NON_FINITE_RESULT', 'La evaluación compleja produjo un valor no finito.');
                    }
                    if (result && typeof result === 'object' && result.isComplex) {
                        if (!isFinite(result.re) || !isFinite(result.im)) {
                            throw new MathError('NON_FINITE_RESULT', 'La evaluación compleja produjo un valor no finito.');
                        }
                    }

                    return toComplexValue(result);
                } catch (err: any) {
                    if (err instanceof MathError) throw err;
                    throw new MathError('NON_FINITE_RESULT', `Error al evaluar expresión compleja: ${err.message}`);
                }
            }
        };
    } catch (error: any) {
        throw new MathError('INVALID_EXPRESSION', `La función ingresada no tiene una sintaxis válida: ${error.message}`);
    }
}
