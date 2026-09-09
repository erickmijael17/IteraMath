import { ErrorCriterion } from '../types/numerical';
import { Evaluator } from './expression';
import { MathError } from './errors';

export function calculateApproximationError(
    previous: number,
    current: number,
    criterion: ErrorCriterion,
    evaluator?: Evaluator
): number {
    if (criterion === 'absolute') {
        return Math.abs(current - previous);
    }

    if (criterion === 'relative' || criterion === 'percentage') {
        if (current === 0) {
            throw new MathError(
                "DIVISION_BY_ZERO",
                "No es posible calcular el error relativo o porcentual porque la aproximación actual es cero."
            );
        }
        const relativeError = Math.abs((current - previous) / current);
        return criterion === 'percentage' ? relativeError * 100 : relativeError;
    }

    if (criterion === 'residual') {
        if (!evaluator) {
            throw new MathError(
                "INVALID_EXPRESSION", 
                "El cálculo del residuo requiere una función evaluadora."
            );
        }
        return calculateResidual(evaluator, current);
    }

    throw new MathError("INVALID_EXPRESSION", "Criterio de error desconocido.");
}

export function calculateResidual(evaluator: Evaluator, x: number): number {
    const fx = evaluator.evaluate(x);
    return Math.abs(fx);
}
