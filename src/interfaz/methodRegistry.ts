import { MathError } from '../matematicas/errors';
import { solveCramer } from '../metodos/cramer/cramer';
import { solveGauss } from '../metodos/eliminacion-gaussiana/gauss';
import { solveNewtonDivided } from '../metodos/interpolacion-newton/newton';
import { solvePolyReg } from '../metodos/regresion-polinomial/regresion';
import { solveCholesky, solveInverse, solveLu } from '../metodos/otros/sistemas-reservados';
import { solveIterative } from '../metodos/otros/iterative';
import { solveLagrange } from '../metodos/otros/lagrange';
import { solveFixedSystem, solveNewtonSystem } from '../metodos/otros/nonlinear';
import { solveMultiReg } from '../metodos/otros/regresion-multiple';
import {
    IterativeInput,
    LagrangeInput,
    MethodId,
    MethodInput,
    MultiRegInput,
    NewtonDividedInput,
    NewtonSystemInput,
    PolyRegInput,
    SolveResult,
    SystemInput,
    VectorNorm
} from '../tipos/numerical';

export interface MethodMeta {
    displayName: string;
    buildInput: (form: FormData) => MethodInput;
    solve: (input: MethodInput) => SolveResult;
}

const asNumber = (value: FormDataEntryValue | null, label: string): number => {
    const parsed = Number(String(value ?? '').trim().replace(',', '.'));
    if (!Number.isFinite(parsed)) {
        throw new MathError('NON_FINITE_RESULT', `Revisa el dato «${label}».`);
    }
    return parsed;
};

const readSystem = (form: FormData, max = 6): SystemInput => {
    const size = Math.min(max, Math.max(2, Math.floor(asNumber(form.get('size'), 'tamaño'))));
    const A = Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, column) => asNumber(form.get(`a_${row}_${column}`), `A${row + 1}${column + 1}`))
    );
    const b = Array.from({ length: size }, (_, row) => asNumber(form.get(`b_${row}`), `b${row + 1}`));
    return { A, b, pivot: form.get('pivot') === '1' };
};

const readIterative = (form: FormData): IterativeInput => {
    const system = readSystem(form);
    const norm = String(form.get('norm') ?? 'inf');
    return {
        ...system,
        x0: system.b.map((_, index) => asNumber(form.get(`x0_${index}`), `x0 ${index + 1}`)),
        tolerance: asNumber(form.get('tolerance'), 'tolerancia'),
        maxIterations: Math.floor(asNumber(form.get('maxIterations'), 'iteraciones')),
        norm: (norm === '1' || norm === '2' ? norm : 'inf') as VectorNorm
    };
};

const readEquations = (form: FormData): NewtonSystemInput => {
    const count = Math.min(6, Math.max(2, Math.floor(asNumber(form.get('eqCount'), 'ecuaciones'))));
    return {
        equations: Array.from({ length: count }, (_, index) => String(form.get(`eq_${index}`) ?? '')),
        x0: Array.from({ length: count }, (_, index) => asNumber(form.get(`x0_${index}`), `valor inicial ${index + 1}`)),
        tolerance: asNumber(form.get('tolerance'), 'tolerancia'),
        maxIterations: Math.floor(asNumber(form.get('maxIterations'), 'iteraciones'))
    };
};

const readPoints = (form: FormData) => {
    const rows = Math.max(2, Math.floor(asNumber(form.get('rows'), 'filas')));
    const points = [];
    for (let index = 0; index < rows; index++) {
        const xRaw = String(form.get(`px_${index}`) ?? '').trim();
        const yRaw = String(form.get(`py_${index}`) ?? '').trim();
        if (!xRaw && !yRaw) continue;
        points.push({ x: asNumber(xRaw, `x ${index + 1}`), y: asNumber(yRaw, `y ${index + 1}`) });
    }
    return points;
};

export const METHOD_REGISTRY: Record<MethodId, MethodMeta> = {
    gauss: {
        displayName: 'Eliminación gaussiana',
        buildInput: (form) => readSystem(form),
        solve: (input) => solveGauss(input as SystemInput, false)
    },
    'gauss-jordan': {
        displayName: 'Gauss-Jordan',
        buildInput: (form) => readSystem(form),
        solve: (input) => solveGauss(input as SystemInput, true)
    },
    lu: {
        displayName: 'Factorización LU',
        buildInput: (form) => readSystem(form),
        solve: (input) => solveLu(input as SystemInput)
    },
    cholesky: {
        displayName: 'Cholesky',
        buildInput: (form) => readSystem(form),
        solve: (input) => solveCholesky(input as SystemInput)
    },
    inverse: {
        displayName: 'Inversa',
        buildInput: (form) => readSystem(form),
        solve: (input) => solveInverse(input as SystemInput)
    },
    cramer: {
        displayName: 'Cramer',
        buildInput: (form) => readSystem(form, 4),
        solve: (input) => solveCramer(input as SystemInput)
    },
    jacobi: {
        displayName: 'Jacobi',
        buildInput: readIterative,
        solve: (input) => solveIterative(input as IterativeInput, 'jacobi')
    },
    'gauss-seidel': {
        displayName: 'Gauss-Seidel',
        buildInput: readIterative,
        solve: (input) => solveIterative(input as IterativeInput, 'seidel')
    },
    'newton-system': {
        displayName: 'Newton para sistemas',
        buildInput: readEquations,
        solve: (input) => solveNewtonSystem(input as NewtonSystemInput)
    },
    'fixed-point-system': {
        displayName: 'Punto fijo para sistemas',
        buildInput: readEquations,
        solve: (input) => solveFixedSystem(input as NewtonSystemInput)
    },
    lagrange: {
        displayName: 'Lagrange',
        buildInput: (form) => ({
            points: readPoints(form),
            at: asNumber(form.get('at'), 'x'),
            degree: asNumber(form.get('degree'), 'grado'),
            mode: form.get('mode') === 'todos' ? 'todos' : 'apropiados',
            expression: String(form.get('expression') ?? '')
        } as LagrangeInput),
        solve: (input) => solveLagrange(input as LagrangeInput)
    },
    'newton-divided': {
        displayName: 'Interpolación de Newton',
        buildInput: (form) => ({
            points: readPoints(form),
            at: asNumber(form.get('at'), 'x'),
            degree: asNumber(form.get('degree'), 'grado'),
            form: (['progresiva', 'regresiva'].includes(String(form.get('form'))) ? form.get('form') : 'auto')
        } as NewtonDividedInput),
        solve: (input) => solveNewtonDivided(input as NewtonDividedInput)
    },
    'regression-poly': {
        displayName: 'Regresión polinomial',
        buildInput: (form) => {
            const at = String(form.get('at') ?? '').trim();
            return {
                points: readPoints(form),
                degree: asNumber(form.get('degree'), 'grado'),
                ...(at ? { at: asNumber(at, 'aproximación') } : {})
            } as PolyRegInput;
        },
        solve: (input) => solvePolyReg(input as PolyRegInput)
    },
    'regression-multiple': {
        displayName: 'Regresión múltiple',
        buildInput: (form) => {
            const rows = Math.max(1, Math.floor(asNumber(form.get('rows'), 'filas')));
            const data = [];
            for (let index = 0; index < rows; index++) {
                const x1 = String(form.get(`x1_${index}`) ?? '').trim();
                const x2 = String(form.get(`x2_${index}`) ?? '').trim();
                const y = String(form.get(`y_${index}`) ?? '').trim();
                if (!x1 && !x2 && !y) continue;
                data.push({
                    x1: asNumber(x1, `x1 ${index + 1}`),
                    x2: asNumber(x2, `x2 ${index + 1}`),
                    y: asNumber(y, `y ${index + 1}`)
                });
            }
            return { rows: data } as MultiRegInput;
        },
        solve: (input) => solveMultiReg(input as MultiRegInput)
    }
};

export const isMethodId = (value: string): value is MethodId =>
    Object.prototype.hasOwnProperty.call(METHOD_REGISTRY, value);
