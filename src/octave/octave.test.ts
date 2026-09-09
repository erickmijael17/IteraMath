import { describe, it, expect } from 'vitest';
import { formatOctaveNumber, formatOctaveComplex, formatOctaveExpression } from './common';
import { generateOctaveCode } from './index';

describe('Octave Code Generator', () => {
    it('formatea números reales preservando precisión', () => {
        expect(formatOctaveNumber(1.3247181739990537)).toBe('1.3247181739990537');
        expect(formatOctaveNumber(2)).toBe('2');
    });

    it('formatea complejos para Octave', () => {
        expect(formatOctaveComplex({ re: 0, im: 1 })).toBe('1i');
        expect(formatOctaveComplex({ re: 0, im: -1 })).toBe('-1i');
        expect(formatOctaveComplex({ re: 2, im: 0 })).toBe('2');
        expect(formatOctaveComplex({ re: 1.25, im: -0.75 })).toBe('1.25 - 0.75i');
        expect(formatOctaveComplex({ re: -1, im: 1 })).toBe('-1 + 1i');
    });

    it('formatea expresiones de matemáticas a inline compatibles', () => {
        expect(formatOctaveExpression('x^3 - x - 1')).toBe('x^3-x-1');
        expect(formatOctaveExpression('sin(x) + exp(-x)')).toBe('sin(x)+exp(-x)');
    });

    it('genera código Bisección correctamente', () => {
        const input: any = { expression: 'x^3-x-1', a: 1, b: 2 };
        const result: any = {
            iterations: [
                { iteration: 0, a: 1, b: 2, m: 1.5, fm: 0.875, error: null },
                { iteration: 1, a: 1, b: 1.5, m: 1.25, fm: -0.296875, error: 0.25 }
            ],
            root: 1.25,
            stopReason: 'TOLERANCE_REACHED'
        };
        const code = generateOctaveCode('bisection', input, result);
        expect(code).toContain('f = inline(\'x^3-x-1\', \'x\');');
        expect(code).toContain('a0 = 1;');
        expect(code).toContain('b0 = 2;');
        expect(code).toContain('m0 = (a0 + b0) / 2;');
        expect(code).toContain('a1 = a0;');
        expect(code).toContain('b1 = m0;');
    });

    it('genera código Regla Falsa correctamente', () => {
        const input: any = { expression: 'x^2-4', a: 1, b: 3 };
        const result: any = {
            iterations: [
                { iteration: 0, a: 1, b: 3, w: 1.8, fw: -0.76, error: null }
            ],
            root: 1.8,
            stopReason: 'TOLERANCE_REACHED'
        };
        const code = generateOctaveCode('false-position', input, result);
        expect(code).toContain('w0 = b0 - ((feval(f,b0)*b0 - feval(f,b0)*a0)/(feval(f,b0)-feval(f,a0)));');
    });

    it('genera código Punto Fijo correctamente', () => {
        const input: any = { expression: 'x^2-2', iterationExpression: '2/x', x0: 1 };
        const result: any = {
            iterations: [
                { iteration: 0, xCurrent: 1, xNext: 2 }
            ],
            root: 2,
            stopReason: 'TOLERANCE_REACHED'
        };
        const code = generateOctaveCode('fixed-point', input, result);
        expect(code).toContain('g = inline(\'2/x\', \'x\');');
        expect(code).toContain('x1 = feval(g, x0);');
    });

    it('genera código Newton-Raphson correctamente', () => {
        const input: any = { expression: 'x^2-2', x0: 1 };
        const result: any = {
            iterations: [
                { iteration: 0, xCurrent: 1, xNext: 1.5 }
            ],
            root: 1.5,
            stopReason: 'TOLERANCE_REACHED'
        };
        const code = generateOctaveCode('newton-raphson', input, result);
        expect(code).toContain('pkg load symbolic');
        expect(code).toContain('df = diff(f, x);');
        expect(code).toContain('x1 = double(x0 - subs(f, x, x0) / subs(df, x, x0));');
    });

    it('genera código Secante correctamente', () => {
        const input: any = { expression: 'x^2-2', x0: 1, x1: 2 };
        const result: any = {
            iterations: [
                { iteration: 0, x0: 1, x1: 2, xNext: 1.333333333 }
            ],
            root: 1.333333333,
            stopReason: 'TOLERANCE_REACHED'
        };
        const code = generateOctaveCode('secant', input, result);
        expect(code).toContain('x2 = x1 - feval(f, x1) * (x1 - x0) / (feval(f, x1) - feval(f, x0));');
    });

    it('genera código Muller correctamente con soporte a MAX_ITERATIONS', () => {
        const input: any = { expression: 'x^2+1', x0: -1, x1: 0, x2: 1 };
        const result: any = {
            iterations: [
                { iteration: 0 }
            ],
            root: { re: 0, im: 1 },
            stopReason: 'MAX_ITERATIONS'
        };
        const code = generateOctaveCode('muller', input, result);
        expect(code).toContain('E1 = b + D;');
        expect(code).toContain('x_new = x2 + h;');
        expect(code).toContain('raiz = 1i;');
        expect(code).toContain('% El método alcanzó el máximo de iteraciones.');
    });
});
