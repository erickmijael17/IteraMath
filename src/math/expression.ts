import { parse, EvalFunction } from 'mathjs';
import { MathError } from './errors';

export interface Evaluator {
    evaluate: (x: number) => number;
}

export function createExpression(expression: string): Evaluator {
    if (!expression || expression.trim() === '') {
        throw new MathError("INVALID_EXPRESSION", "La expresión matemática no puede estar vacía.");
    }

    let compiledExpr: EvalFunction;

    try {
        const node = parse(expression);
        compiledExpr = node.compile();
    } catch (e: any) {
        throw new MathError("INVALID_EXPRESSION", `Sintaxis matemática inválida: ${e.message}`);
    }

    return {
        evaluate: (x: number): number => {
            let result: any;
            try {
                result = compiledExpr.evaluate({ x });
            } catch (e: any) {
                throw new MathError("INVALID_EXPRESSION", `Error al evaluar la expresión: ${e.message}`);
            }

            // Reject Complex numbers (e.g., from sqrt(-1) if mathjs returns it)
            if (result && typeof result === 'object' && result.isComplex) {
                throw new MathError("OUT_OF_DOMAIN", "El resultado está fuera del dominio de los números reales.");
            }

            // Convert to primitive number if needed
            const numericResult = Number(result);

            if (isNaN(numericResult)) {
                throw new MathError("NON_FINITE_RESULT", "El resultado de la evaluación no es un número (NaN).");
            }

            if (!isFinite(numericResult)) {
                throw new MathError("NON_FINITE_RESULT", "El resultado de la evaluación es infinito.");
            }

            return numericResult;
        }
    };
}
