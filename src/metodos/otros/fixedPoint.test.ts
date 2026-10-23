import { describe, it, expect } from 'vitest';
import { fixedPoint } from './fixedPoint';

describe('Fixed Point Method', () => {
    it('Case 1: approximates root successfully (cos(x) - x)', () => {
        const result = fixedPoint({
            expression: 'cos(x) - x',
            iterationExpression: 'cos(x)',
            x0: 0.5,
            tolerance: 0.005,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(true);
        expect(result.stopReason).toBe('TOLERANCE_REACHED');
        expect(result.root).toBeCloseTo(0.739, 2);
    });

    it('Case 2: detects exact root rapidly if x0 is root', () => {
        const result = fixedPoint({
            expression: 'x - 2',
            iterationExpression: 'x',
            x0: 2,
            tolerance: 1e-6,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });
        expect(result.root).toBe(2);
        expect(result.stopReason).toBe('EXACT_ROOT');
        expect(result.converged).toBe(true);
        expect(result.totalIterations).toBe(0);
    });

    it('Case 3: stops at max iterations without converging (divergent case)', () => {
        // 2*x - 1 = 0 -> root is 0.5. iter: g(x) = 2*x. diverges smoothly
        const result = fixedPoint({
            expression: '2*x - 1',
            iterationExpression: '2*x',
            x0: 1,
            tolerance: 1e-6,
            maxIterations: 5,
            errorCriterion: 'absolute'
        });
        expect(result.converged).toBe(false);
        expect(result.stopReason).toBe('MAX_ITERATIONS');
        expect(result.totalIterations).toBe(5);
        expect(result.iterations.length).toBe(5);
    });

    it('Case 4: evaluates absolute error correctly from k=0', () => {
        const result = fixedPoint({
            expression: 'cos(x) - x',
            iterationExpression: 'cos(x)',
            x0: 0.5,
            tolerance: 0.0005,
            maxIterations: 2,
            errorCriterion: 'absolute'
        });
        expect(result.iterations[0].error).toBeCloseTo(0.37758, 4);
    });

    it('Case 5: evaluates relative error correctly from k=0', () => {
        const result = fixedPoint({
            expression: 'cos(x) - x',
            iterationExpression: 'cos(x)',
            x0: 0.5,
            tolerance: 0.5,
            maxIterations: 2,
            errorCriterion: 'relative'
        });
        expect(result.iterations[0].error).toBeCloseTo(0.43025, 4);
    });

    it('Case 6: evaluates percentage error correctly from k=0', () => {
        const result = fixedPoint({
            expression: 'cos(x) - x',
            iterationExpression: 'cos(x)',
            x0: 0.5,
            tolerance: 50,
            maxIterations: 2,
            errorCriterion: 'percentage'
        });
        expect(result.iterations[0].error).toBeCloseTo(43.025, 2);
    });

    it('Case 7: evaluates residual correctly', () => {
        const result = fixedPoint({
            expression: 'cos(x) - x',
            iterationExpression: 'cos(x)',
            x0: 0.5,
            tolerance: 1,
            maxIterations: 2,
            errorCriterion: 'residual'
        });
        expect(result.iterations[0].error).not.toBeNull();
        expect(result.iterations[0].error).toBe(result.iterations[0].residual);
    });

    it('Case 8: throws for invalid f(x)', () => {
        try {
            fixedPoint({
                expression: 'cos(x) + ',
                iterationExpression: 'cos(x)',
                x0: 0.5,
                tolerance: 1e-6,
                maxIterations: 100,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });

    it('Case 9: throws for invalid g(x)', () => {
        try {
            fixedPoint({
                expression: 'cos(x) - x',
                iterationExpression: 'cos(x) + ',
                x0: 0.5,
                tolerance: 1e-6,
                maxIterations: 100,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });

    it('Case 10: validates x0 finiteness', () => {
        try {
            fixedPoint({
                expression: 'cos(x) - x',
                iterationExpression: 'cos(x)',
                x0: Infinity,
                tolerance: 1e-6,
                maxIterations: 100,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 11: throws NON_FINITE_RESULT if g(x) produces NaN/Infinity', () => {
        try {
            // Un f(x) falso para evitar exact root.
            // g(x) = 1/x -> x0 = 0
            fixedPoint({
                expression: 'x - 5',
                iterationExpression: '1/x',
                x0: 0,
                tolerance: 1e-6,
                maxIterations: 10,
                errorCriterion: 'absolute'
            });
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('NON_FINITE_RESULT');
        }
    });

    it('Case 12: reporta g\'(x) y el criterio de convergencia en la raíz', () => {
        const result = fixedPoint({
            expression: 'cos(x) - x',
            iterationExpression: 'cos(x)',
            x0: 0.5,
            tolerance: 1e-10,
            maxIterations: 100,
            errorCriterion: 'absolute'
        });

        expect(result.gPrimeExpression).toBe('-sin(x)');
        expect(result.gPrimeAtRoot).not.toBeNull();
        expect(Math.abs(result.gPrimeAtRoot!)).toBeCloseTo(Math.sin(0.7391), 3);
        result.iterations.forEach(it => {
            expect(it.gPrime).not.toBeNull();
            expect(Math.abs(it.gPrime!)).toBeLessThan(1);
        });
    });

    it('Case 13: detecta |g\'(r)| >= 1 en el caso divergente', () => {
        const result = fixedPoint({
            expression: '2*x - 1',
            iterationExpression: '2*x',
            x0: 1,
            tolerance: 1e-6,
            maxIterations: 5,
            errorCriterion: 'absolute'
        });

        expect(result.gPrimeExpression).toBe('2');
        expect(Math.abs(result.gPrimeAtRoot!)).toBe(2);
        result.iterations.forEach(it => {
            expect(it.gPrime).toBe(2);
        });
    });
});
