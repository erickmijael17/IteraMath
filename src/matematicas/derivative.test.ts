import { describe, it, expect } from 'vitest';
import { createDerivative } from './derivative';

describe('Symbolic Derivative', () => {
    it('Case 1: derives basic polynomial', () => {
        const result = createDerivative('x^3 - x - 1');
        expect(result.expressionString).toBeDefined();
        // math.js derivative format can vary, but we can evaluate it
        expect(result.evaluator.evaluate(1.5)).toBeCloseTo(5.75, 5); // 3*(1.5)^2 - 1 = 3*2.25 - 1 = 5.75
    });

    it('Case 2: derives trigonometric function', () => {
        const result = createDerivative('cos(x)');
        // deriv of cos(x) is -sin(x)
        expect(result.evaluator.evaluate(Math.PI / 2)).toBeCloseTo(-1, 5);
    });

    it('Case 3: throws MathError for invalid expression', () => {
        try {
            createDerivative('x^2 + ');
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });
});
