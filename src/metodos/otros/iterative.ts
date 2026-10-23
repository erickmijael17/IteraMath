import * as math from 'mathjs';
import { MathError } from '../../matematicas/errors';
import { formatEs, subscript, vectorText } from '../../matematicas/format';
import { validateMaxIterations, validateTolerance } from '../../matematicas/validation';
import {
    Arrangement,
    Matrix,
    Vector,
    arrangeDiagonalDominance,
    assertSystem,
    forwardSubstitution,
    infNorm,
    isStrictlyDiagonalDominant,
    vectorNorm,
    zeros
} from '../../matematicas/matrix';
import { octaveHeader, octaveMatrix, octaveVector } from '../../codigo-octave/text';
import { IterationRow, IterativeInput, SolveResult, TableData } from '../../tipos/numerical';

function spectralRadius(matrix: Matrix): number {
    const result = math.eigs(matrix) as { values?: unknown[] };
    const values = result.values ?? [];
    const magnitudes = values.map((value) => {
        if (typeof value === 'number') return Math.abs(value);
        if (value && typeof value === 'object' && 're' in value && 'im' in value) {
            const complex = value as { re: number; im: number };
            return Math.hypot(complex.re, complex.im);
        }
        return Math.abs(Number(value));
    });
    return magnitudes.length ? Math.max(...magnitudes) : Number.NaN;
}

function jacobiOperator(A: Matrix, b: Vector): { B: Matrix; c: Vector } {
    const n = A.length;
    const B = zeros(n);
    const c: Vector = [];
    for (let i = 0; i < n; i++) {
        if (Math.abs(A[i][i]) < 1e-14) {
            throw new MathError('SINGULAR', 'Hay un cero en la diagonal. Reordena el sistema antes de iterar.');
        }
        c.push(b[i] / A[i][i]);
        for (let j = 0; j < n; j++) B[i][j] = i === j ? 0 : -A[i][j] / A[i][i];
    }
    return { B, c };
}

function seidelOperator(A: Matrix): Matrix {
    const n = A.length;
    const lower = A.map((row, i) => row.map((value, j) => (j <= i ? value : 0)));
    const B = zeros(n);
    for (let column = 0; column < n; column++) {
        const rhs = A.map((row, i) => (column > i ? -row[column] : 0));
        const solved = forwardSubstitution(lower, rhs);
        solved.forEach((value, row) => {
            B[row][column] = value;
        });
    }
    return B;
}

function restore(order: number[], worked: Vector): Vector {
    const original = Array(worked.length).fill(0);
    worked.forEach((value, index) => {
        original[order[index]] = value;
    });
    return original;
}

function reorderNote(arrangement: Arrangement): string {
    if (!arrangement.changed) return 'El sistema ya es estrictamente diagonal dominante por filas.';
    const rows = arrangement.rows.map((index) => index + 1).join(', ');
    const cols = arrangement.cols.map((index) => `x${subscript(index + 1)}`).join(', ');
    return `Se reordenó para lograr dominancia diagonal. Filas usadas: ${rows}. Nuevo orden de incógnitas: ${cols}.`;
}

export function solveIterative(input: IterativeInput, kind: 'jacobi' | 'seidel'): SolveResult {
    assertSystem(input.A, input.b);
    validateTolerance(input.tolerance);
    validateMaxIterations(input.maxIterations);
    if (input.x0.length !== input.A.length) {
        throw new MathError('INVALID_MATRIX', 'La aproximación inicial debe tener una entrada por incógnita.');
    }

    const arranged = arrangeDiagonalDominance(input.A, input.b);
    const A = arranged ? arranged.A : input.A;
    const b = arranged ? arranged.b : input.b;
    const arrangement: Arrangement = arranged
        ? arranged.arrangement
        : {
            rows: input.A.map((_, index) => index),
            cols: input.A.map((_, index) => index),
            changed: false
        };
    const x0 = arrangement.cols.map((index) => input.x0[index]);
    const operator = kind === 'jacobi' ? jacobiOperator(A, b).B : seidelOperator(A);
    const radius = spectralRadius(operator);
    const dominant = isStrictlyDiagonalDominant(A);
    const names = arrangement.cols.map((index) => `x${subscript(index + 1)}`);

    let current = x0.slice();
    const series: IterationRow[] = [];
    let converged = false;

    for (let iteration = 1; iteration <= input.maxIterations; iteration++) {
        const next = current.slice();
        if (kind === 'jacobi') {
            for (let i = 0; i < A.length; i++) {
                let sum = b[i];
                for (let j = 0; j < A.length; j++) {
                    if (i !== j) sum -= A[i][j] * current[j];
                }
                next[i] = sum / A[i][i];
            }
        } else {
            for (let i = 0; i < A.length; i++) {
                let sum = b[i];
                for (let j = 0; j < A.length; j++) {
                    if (i !== j) sum -= A[i][j] * next[j];
                }
                next[i] = sum / A[i][i];
            }
        }
        const error = vectorNorm(next.map((value, index) => value - current[index]), input.norm);
        series.push({ iteration, x: next.slice(), error });
        current = next;
        if (error < input.tolerance) {
            converged = true;
            break;
        }
    }

    const solution = restore(arrangement.cols, current);
    const table: TableData = {
        title: 'Iteraciones',
        headers: ['i', ...names, 'error'],
        rows: series.map((row) => [row.iteration, ...row.x, row.error ?? '']),
        markColumn: names.length
    };
    const title = kind === 'jacobi' ? 'Jacobi' : 'Gauss-Seidel';
    const errors = series.filter((row) => row.error !== null && row.error > 0);
    const octaveName = kind === 'jacobi' ? 'Jacobi' : 'Gauss-Seidel';
    const update = kind === 'jacobi'
        ? `nuevo = b;\n  for i = 1:n\n    nuevo(i) = (b(i) - A(i, :) * actual + A(i, i) * actual(i)) / A(i, i);\n  end\n  actual = nuevo;`
        : `for i = 1:n\n    actual(i) = (b(i) - A(i, :) * actual + A(i, i) * actual(i)) / A(i, i);\n  end`;

    return {
        converged,
        status: converged ? 'Tolerancia alcanzada' : 'Máximo de iteraciones alcanzado',
        headlineLabel: 'Solución',
        headline: vectorText(solution),
        secondaryLabel: 'Iteraciones',
        secondary: String(series.length),
        details: [
            { label: 'Método', value: title },
            { label: 'Dominancia diagonal', value: dominant ? 'Sí, por filas' : 'No quedó garantizada' },
            { label: 'Norma infinito de B', value: formatEs(infNorm(operator)) },
            { label: 'Radio espectral', value: formatEs(radius, 6) },
            { label: 'Error final', value: series.length ? formatEs(series[series.length - 1].error ?? Number.NaN) : '—' }
        ],
        tables: [
            {
                title: 'Matriz de iteración B',
                headers: names,
                rows: operator
            },
            table
        ],
        octave: `${octaveHeader(octaveName)}
${octaveMatrix('A', A)}
${octaveVector('b', b)}
${octaveVector('actual', x0)}
tol = ${input.tolerance};
maxIter = ${input.maxIterations};
n = size(A, 1);
for k = 1:maxIter
  anterior = actual;
  ${update}
  error = norm(actual - anterior, ${input.norm === 'inf' ? 'inf' : input.norm === '1' ? '1' : '2'});
  if error < tol
    break;
  end
end
disp(actual);
disp(error);
`,
        graph: {
            type: 'convergence',
            title: `Error de ${title}`,
            series: [{
                name: title,
                iterations: errors.map((row) => row.iteration),
                errors: errors.map((row) => row.error as number)
            }]
        },
        note: reorderNote(arrangement),
        values: solution,
        extra: {
            radius,
            iterations: series.length,
            finalError: series.length ? series[series.length - 1].error ?? Number.NaN : Number.NaN
        },
        series
    };
}
