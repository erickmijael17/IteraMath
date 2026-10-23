import { describe, expect, it } from 'vitest';
import { MathError } from '../matematicas/errors';
import { solveCramer } from './cramer/cramer';
import { solveGauss } from './eliminacion-gaussiana/gauss';
import { solveNewtonDivided } from './interpolacion-newton/newton';
import { solvePolyReg } from './regresion-polinomial/regresion';
import { solveCholesky, solveInverse, solveLu } from './otros/sistemas-reservados';
import { solveIterative } from './otros/iterative';
import { solveLagrange } from './otros/lagrange';
import { solveFixedSystem, solveNewtonSystem } from './otros/nonlinear';
import { solveMultiReg } from './otros/regresion-multiple';
import { matVec } from '../matematicas/matrix';

const CLASS = { A: [[3, -0.1, -0.2], [0.1, 7, -0.3], [0.3, -0.2, 10]], b: [7.85, -19.3, 71.4], pivot: true };
const TALLER = { A: [[2, 1, 0], [1, -2, 4], [3, 1, -5]], b: [1, -3, 2], pivot: true };

describe('sistemas directos', () => {
    it('resuelve Gauss de la clase', () => {
        const result = solveGauss(CLASS, false);
        expect(result.values[0]).toBeCloseTo(3, 8);
        expect(result.values[1]).toBeCloseTo(-2.5, 8);
        expect(result.values[2]).toBeCloseTo(7, 8);
        expect(result.secondary ?? '').toContain('3,614');
        expect(result.graph.type).toBe('none');
        expect(result.octave).toContain('f1 = f1/f1(1)');
        expect(result.octave).toContain('f2 = -f2(1)*f1 + f2');
        expect(result.octave).toContain('f1 = -f1(2)*f2 + f1');
        expect(result.octave).toContain('x = [f1(4); f2(4); f3(4)]');
    });

    it('resuelve el taller y Cramer da lo mismo', () => {
        const gauss = solveGauss(TALLER, false);
        const cramer = solveCramer(TALLER);
        gauss.values.forEach((value, index) => expect(cramer.values[index]).toBeCloseTo(value, 8));
        expect(gauss.values[0]).toBeCloseTo(-0.034483, 5);
        expect(cramer.graph.type).toBe('none');
        expect(cramer.octave).toContain('DA = det(A)');
        expect(cramer.octave).toContain('x1 = DX1/DA');
        expect(cramer.values[1]).toBeCloseTo(1.068966, 5);
        expect(cramer.values[2]).toBeCloseTo(-0.206897, 5);
    });

    it('Cramer de la semana 6 da -14.9, -29.5, 19.8', () => {
        const result = solveCramer({
            A: [[0.3, 0.52, 1], [0.5, 1, 1.9], [0.1, 0.3, 0.5]],
            b: [-0.01, 0.67, -0.44],
            pivot: false
        });
        expect(result.values[0]).toBeCloseTo(-14.9, 6);
        expect(result.values[1]).toBeCloseTo(-29.5, 6);
        expect(result.values[2]).toBeCloseTo(19.8, 6);
        expect(result.octave).toContain('X1 = [-0.01 0.52 1; 0.67 1 1.9; -0.44 0.3 0.5]');
    });

    it('Gauss-Jordan coincide con Gauss', () => {
        const jordan = solveGauss(CLASS, true);
        expect(jordan.values[0]).toBeCloseTo(3, 8);
        expect(jordan.values[1]).toBeCloseTo(-2.5, 8);
        expect(jordan.values[2]).toBeCloseTo(7, 8);
    });

    it('LU de la clase da 1, 2, 1', () => {
        const result = solveLu({ A: [[-1, 1, -3], [3, -3, -1], [1, 1, 0]], b: [-2, -4, 3], pivot: true });
        expect(result.values.map((value) => Math.round(value * 1e9) / 1e9)).toEqual([1, 2, 1]);
        expect(result.note ?? '').toMatch(/pivoteo/i);
    });

    it('Cholesky de la clase', () => {
        const result = solveCholesky({ A: [[8, 20, 15], [20, 80, 50], [15, 50, 60]], b: [50, 250, 100], pivot: true });
        expect(result.values[0]).toBeCloseTo(-2.734375, 6);
        expect(result.values[1]).toBeCloseTo(4.8828125, 6);
        expect(result.values[2]).toBeCloseTo(-1.71875, 6);
    });

    it('la inversa recupera la solución de Gauss', () => {
        const inverse = solveInverse(CLASS);
        const product = matVec(CLASS.A, inverse.values);
        product.forEach((value, index) => expect(value).toBeCloseTo(CLASS.b[index], 6));
    });

    it('Cholesky rechaza una matriz que no es definida positiva', () => {
        expect(() => solveCholesky({ A: [[1, 2], [3, 4]], b: [1, 1], pivot: true })).toThrow(/simétrica|definida/i);
    });
});

describe('iterativos', () => {
    const input = {
        A: [[4, 1, 2], [1, 4, 1], [1, 2, 4]],
        b: [15, 9, 16],
        pivot: true,
        x0: [0, 0, 0],
        tolerance: 0.001,
        maxIterations: 25,
        norm: 'inf' as const
    };

    it('Jacobi se detiene en la iteración 21', () => {
        const result = solveIterative(input, 'jacobi');
        expect(result.extra.iterations).toBe(21);
        expect(result.extra.finalError).toBeLessThan(0.001);
        expect(result.extra.radius).toBeCloseTo(0.6568, 3);
        result.values.forEach((value, index) => expect(value).toBeCloseTo([2, 1, 3][index], 3));
    });

    it('Gauss-Seidel converge al mismo vector', () => {
        const result = solveIterative(input, 'seidel');
        expect(result.converged).toBe(true);
        result.values.forEach((value, index) => expect(value).toBeCloseTo([2, 1, 3][index], 3));
        expect(result.extra.iterations).toBeLessThan(21);
    });
});

describe('interpolación', () => {
    const nodes02 = [
        { x: -0.2, y: -0.163746 },
        { x: 0.1, y: 0.110517 },
        { x: 0.3, y: 0.404958 },
        { x: 0.7, y: 1.40963 }
    ];

    it('Lagrange en 0.2 usa los nodos más cercanos', () => {
        const result = solveLagrange({ points: nodes02, at: 0.2, degree: 3, mode: 'apropiados', expression: '' });
        expect(result.values[0]).toBeCloseTo(0.2577375, 6);
        expect(result.values[1]).toBeCloseTo(0.2465776, 6);
        expect(result.values[2]).toBeCloseTo(0.24383774, 6);
    });

    it('calcula P4 y la cota de f(1.25)', () => {
        const result = solveLagrange({
            points: [
                { x: 1, y: 1 },
                { x: 1.1, y: 1.23368 },
                { x: 1.2, y: 1.55271 },
                { x: 1.3, y: 1.99372 },
                { x: 1.4, y: 2.6117 }
            ],
            at: 1.25,
            degree: 4,
            mode: 'todos',
            expression: 'exp(x^2-1)'
        });
        expect(result.values[0]).toBeCloseTo(1.7549609375, 6);
        expect(result.extra.bound).toBeCloseTo(0.0002384633, 6);
    });

    it('Newton del ejemplo 4.4 aproxima en 2.1', () => {
        const result = solveNewtonDivided({
            points: [
                { x: 2, y: 0.5103757 },
                { x: 2.2, y: 0.5207843 },
                { x: 2.4, y: 0.5104147 },
                { x: 2.6, y: 0.4813306 },
                { x: 2.8, y: 0.435916 }
            ],
            at: 2.1,
            degree: 4,
            form: 'progresiva'
        });
        expect(result.values[0]).toBeCloseTo(0.51558, 5);
        expect(result.values[1]).toBeCloseTo(0.51817728, 6);
        expect(result.values[2]).toBeCloseTo(0.51830626, 6);
        expect(result.values[3]).toBeCloseTo(0.518293745, 8);
    });

    it('Newton de sen(0.34) es regresivo', () => {
        const result = solveNewtonDivided({
            points: [
                { x: 0.3, y: 0.29552 },
                { x: 0.32, y: 0.31457 },
                { x: 0.33, y: 0.32404 },
                { x: 0.35, y: 0.3429 }
            ],
            at: 0.34,
            degree: 3,
            form: 'auto'
        });
        expect(result.status).toMatch(/regresiva/i);
        expect(result.values[0]).toBeCloseTo(0.33347, 5);
        expect(result.values[2]).toBeCloseTo(0.33348133, 6);
    });
});

describe('ajuste y sistemas no lineales', () => {
    it('ajusta la recta de pérdida de peso', () => {
        const result = solvePolyReg({
            points: [{ x: 1, y: 9 }, { x: 2, y: 7.5 }, { x: 3, y: 4.2 }, { x: 4, y: 3 }, { x: 5, y: 2.1 }],
            degree: 1
        });
        expect(result.values[0]).toBeCloseTo(10.65, 8);
        expect(result.values[1]).toBeCloseTo(-1.83, 8);
    });

    it('ajusta la parábola de la sesión', () => {
        const result = solvePolyReg({
            points: [
                { x: 0, y: 2.1 }, { x: 1, y: 7.7 }, { x: 2, y: 13.6 },
                { x: 3, y: 27.2 }, { x: 4, y: 40.9 }, { x: 5, y: 61.1 }
            ],
            degree: 2
        });
        expect(result.values[0]).toBeCloseTo(2.48, 2);
        expect(result.values[1]).toBeCloseTo(2.36, 2);
        expect(result.values[2]).toBeCloseTo(1.86, 2);
        const atSeven = solvePolyReg({
            points: [
                { x: 0, y: 2.1 }, { x: 1, y: 7.7 }, { x: 2, y: 13.6 },
                { x: 3, y: 27.2 }, { x: 4, y: 40.9 }, { x: 5, y: 61.1 }
            ],
            degree: 2,
            at: 7
        });
        expect(atSeven.extra.prediction).toBeCloseTo(110.168571, 4);
        expect(atSeven.graph.type).toBe('curve');
    });

    it('la regresión múltiple cumple las ecuaciones normales', () => {
        const rows = [0, 1, 1, 2, 2, 3, 3, 4, 4].map((x1, index) => ({
            x1,
            x2: [0, 1, 2, 1, 2, 1, 2, 1, 2][index],
            y: [15.1, 17.9, 12.7, 25.6, 20.5, 35.1, 29.7, 45.4, 40.2][index]
        }));
        const result = solveMultiReg({ rows });
        const [a0, a1, a2] = result.values;
        const predicted = rows.map((row) => a0 + a1 * row.x1 + a2 * row.x2);
        const residual = [
            rows.reduce((sum, row, index) => sum + (predicted[index] - row.y), 0),
            rows.reduce((sum, row, index) => sum + row.x1 * (predicted[index] - row.y), 0),
            rows.reduce((sum, row, index) => sum + row.x2 * (predicted[index] - row.y), 0)
        ];
        residual.forEach((value) => expect(Math.abs(value)).toBeLessThan(1e-8));
        expect(result.extra.r2).toBeGreaterThan(0.9);
    });

    it('Newton de sistemas baja el residuo', () => {
        const result = solveNewtonSystem({
            equations: ['x^2 + y^2 - y', 'x^2 - x - y^2'],
            x0: [0.1, 0.1],
            tolerance: 1e-8,
            maxIterations: 20
        });
        expect(result.converged).toBe(true);
        const [x, y] = result.values;
        expect(Math.abs(x * x + y * y - y)).toBeLessThan(1e-8);
        expect(Math.abs(x * x - x - y * y)).toBeLessThan(1e-8);
    });

    it('avisa cuando el dato no cumple la condición del método', () => {
        expect(() => solveCramer({ A: [[1, 2], [2, 4]], b: [3, 6], pivot: false })).toThrow(MathError);
        expect(() => solveCramer({ A: [[1, 2], [2, 4]], b: [3, 6], pivot: false })).toThrow(/determinante es 0/);
        expect(() => solveGauss({ A: [[1, 2], [2, 4]], b: [3, 6], pivot: true }, false)).toThrow(/pivote es cero/);
        expect(() => solveGauss({ A: [[0, 1], [1, 0]], b: [1, 2], pivot: false }, false)).toThrow(/pivoteo parcial/);
        expect(() => solveNewtonDivided({
            points: [{ x: 1, y: 2 }, { x: 1, y: 3 }],
            at: 1,
            degree: 1,
            form: 'progresiva'
        })).toThrow(/misma x/);
        expect(() => solvePolyReg({
            points: [{ x: 0, y: 1 }, { x: 1, y: 2 }],
            degree: 2
        })).toThrow(/al menos 4 puntos/);
    });

    it('el punto fijo de la clase llega a (1, 1)', () => {
        const result = solveFixedSystem({
            equations: ['(x^2 + y^2 + 8)/10', '(x*y^2 + x + 8)/10'],
            x0: [0, 0],
            tolerance: 1e-6,
            maxIterations: 40
        });
        expect(result.values[0]).toBeCloseTo(1, 4);
        expect(result.values[1]).toBeCloseTo(1, 4);
    });
});
