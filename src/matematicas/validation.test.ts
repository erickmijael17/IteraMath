import { describe, it, expect } from 'vitest';
import { hasReachedTolerance, validateTolerance, validateMaxIterations, validateFinite } from './validation';


describe('Validations', () => {
    describe('hasReachedTolerance', () => {
        it('returns true if value is less than or equal to tolerance', () => {
            expect(hasReachedTolerance(0.0005, 0.001)).toBe(true);
            expect(hasReachedTolerance(0.001, 0.001)).toBe(true);
        });

        it('returns false if value is greater than tolerance', () => {
            expect(hasReachedTolerance(0.002, 0.001)).toBe(false);
        });

        it('returns false for NaN or Infinity values', () => {
            expect(hasReachedTolerance(NaN, 0.001)).toBe(false);
            expect(hasReachedTolerance(Infinity, 0.001)).toBe(false);
        });
    });

    describe('validateTolerance', () => {
        it('throws for non-positive tolerance', () => {
            try { validateTolerance(0); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_TOLERANCE'); }
            try { validateTolerance(-1); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_TOLERANCE'); }
        });

        it('throws for invalid tolerance types', () => {
            try { validateTolerance(NaN); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_TOLERANCE'); }
            try { validateTolerance(Infinity); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_TOLERANCE'); }
        });

        it('passes for valid tolerance', () => {
            expect(() => validateTolerance(1e-6)).not.toThrow();
        });
    });

    describe('validateMaxIterations', () => {
        it('throws for non-positive or non-integer max iterations', () => {
            try { validateMaxIterations(0); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_MAX_ITERATIONS'); }
            try { validateMaxIterations(-10); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_MAX_ITERATIONS'); }
            try { validateMaxIterations(10.5); expect.fail(); } catch (e: any) { expect(e.code).toBe('INVALID_MAX_ITERATIONS'); }
        });

        it('passes for valid max iterations', () => {
            expect(() => validateMaxIterations(100)).not.toThrow();
        });
    });

    describe('validateFinite', () => {
        it('throws for NaN or Infinity', () => {
            try { validateFinite(NaN); expect.fail(); } catch (e: any) { expect(e.code).toBe('NON_FINITE_RESULT'); }
            try { validateFinite(Infinity); expect.fail(); } catch (e: any) { expect(e.code).toBe('NON_FINITE_RESULT'); }
            try { validateFinite(-Infinity); expect.fail(); } catch (e: any) { expect(e.code).toBe('NON_FINITE_RESULT'); }
        });

        it('passes for finite numbers', () => {
            expect(() => validateFinite(0)).not.toThrow();
            expect(() => validateFinite(3.1415)).not.toThrow();
        });
    });
});
