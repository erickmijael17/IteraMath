import { ErrorCriterion } from '../types/numerical';
import { MathError } from './errors';

export type ToleranceUnit = 'val' | 'pct';

export function resolveTolerance(raw: string, unit: ToleranceUnit, criterion: ErrorCriterion): number {
    const value = Number(raw);

    if (!Number.isFinite(value) || value <= 0) {
        throw new MathError(
            'INVALID_TOLERANCE',
            'La tolerancia debe ser un número mayor que cero.'
        );
    }

    if (unit === 'pct' && criterion !== 'percentage') {
        return value / 100;
    }

    return value;
}
