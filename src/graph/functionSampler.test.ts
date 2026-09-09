import { describe, it, expect } from 'vitest';
import { sampleFunction } from './functionSampler';

describe('functionSampler', () => {
    it('Case 1: generates correct number of samples and ranges (x^2 - 4 in [-3, 3])', () => {
        const samples = 100;
        const result = sampleFunction('x^2 - 4', -3, 3, samples);
        
        expect(result.x.length).toBe(samples);
        expect(result.y.length).toBe(samples);
        
        // Interval is 6. Margin is 0.25 * 6 = 1.5. 
        // xMin = -3 - 1.5 = -4.5
        // xMax = 3 + 1.5 = 4.5
        expect(result.x[0]).toBeCloseTo(-4.5);
        expect(result.x[samples - 1]).toBeCloseTo(4.5);
        
        // f(-4.5) = 20.25 - 4 = 16.25
        expect(result.y[0]).toBeCloseTo(16.25);
    });

    it('Case 2: correctly evaluates sin(x)', () => {
        const result = sampleFunction('sin(x)', 0, Math.PI, 3);
        // xMin = 0 - 0.25*PI = -0.25 PI
        // xMax = PI + 0.25*PI = 1.25 PI
        // Samples = 3 -> -0.25 PI, 0.5 PI, 1.25 PI
        expect(result.y[1]).toBeCloseTo(1); // sin(0.5 PI) = 1
    });

    it('Case 3: correctly evaluates exp(-x)', () => {
        const result = sampleFunction('exp(-x)', 0, 1, 10);
        // We know it shouldn't throw and y shouldn't have nulls for valid range
        expect(result.y.every(val => val !== null && val > 0)).toBe(true);
    });

    it('Case 6: handles functions partially out of domain (sqrt(x))', () => {
        // sqrt(x) in [-1, 1]
        // interval = 2 -> margin = 0.5 -> [-1.5, 1.5]
        // negative x values should yield null in our engine (real context)
        const result = sampleFunction('sqrt(x)', -1, 1, 11);
        
        // x values will go from -1.5 to 1.5
        const midIndex = 5; // x = 0
        expect(result.x[midIndex]).toBeCloseTo(0);
        expect(result.y[midIndex]).toBeCloseTo(0);
        
        // x = -1.5
        expect(result.y[0]).toBeNull();
    });

    it('Case 7: throws for invalid expression before sampling', () => {
        try {
            sampleFunction('x^2 +', 1, 2);
            expect.fail('Should throw');
        } catch (e: any) {
            expect(e.code).toBe('INVALID_EXPRESSION');
        }
    });

    it('Case 8: handles non-finite results safely', () => {
        // 1/x around 0 can result in Infinity
        const result = sampleFunction('1/x', -1, 1, 11);
        const midIndex = 5; // exactly 0
        expect(result.x[midIndex]).toBeCloseTo(0);
        expect(result.y[midIndex]).toBeNull(); // 1/0 is Infinity -> Engine throws -> sampler catches -> null
    });
});
