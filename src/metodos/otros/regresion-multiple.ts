/** Regresión con dos variables. Queda guardada, fuera de la lista de la aplicación. */
import { MathError } from '../../matematicas/errors';
import { formatEs } from '../../matematicas/format';
import { Matrix, Vector, solveSystem } from '../../matematicas/matrix';
import { octaveHeader } from '../../codigo-octave/text';
import { MultiRegInput, SolveResult } from '../../tipos/numerical';

function fitStats(observed: number[], predicted: number[], parameters: number): { Q: number; St: number; r2: number; syx: number } {
    const n = observed.length;
    const mean = observed.reduce((sum, value) => sum + value, 0) / n;
    const Q = observed.reduce((sum, value, index) => sum + (predicted[index] - value) ** 2, 0);
    const St = observed.reduce((sum, value) => sum + (value - mean) ** 2, 0);
    const r2 = St === 0 ? 1 : (St - Q) / St;
    const syx = Math.sqrt(Q / (n - parameters));
    return { Q, St, r2, syx };
}

function solveNormal(C: Matrix, rhs: Vector): Vector {
    try {
        return solveSystem(C, rhs, true, false).solution;
    } catch {
        throw new MathError('SINGULAR', 'Las ecuaciones normales no tienen solución única. Revisa los datos.');
    }
}


export function solveMultiReg(input: MultiRegInput): SolveResult {
    const rows = input.rows;
    if (rows.length < 4) {
        throw new MathError('INVALID_POINTS', 'La regresión con dos variables pide al menos cuatro datos.');
    }
    const n = rows.length;
    const sum = (pick: (row: MultiRegInput['rows'][number]) => number) => rows.reduce((total, row) => total + pick(row), 0);
    const C = [
        [n, sum((row) => row.x1), sum((row) => row.x2)],
        [sum((row) => row.x1), sum((row) => row.x1 ** 2), sum((row) => row.x1 * row.x2)],
        [sum((row) => row.x2), sum((row) => row.x1 * row.x2), sum((row) => row.x2 ** 2)]
    ];
    const rhs = [sum((row) => row.y), sum((row) => row.x1 * row.y), sum((row) => row.x2 * row.y)];
    const coefficients = solveNormal(C, rhs);
    const predicted = rows.map((row) => coefficients[0] + coefficients[1] * row.x1 + coefficients[2] * row.x2);
    const stats = fitStats(rows.map((row) => row.y), predicted, 3);
    return {
        converged: true,
        status: 'Ajuste calculado',
        headlineLabel: 'Modelo',
        headline: `${formatEs(coefficients[0])} + ${formatEs(coefficients[1])} x1 + ${formatEs(coefficients[2])} x2`.replace(/\+ -/g, '- '),
        secondaryLabel: 'r²',
        secondary: formatEs(stats.r2, 6),
        details: [
            { label: 'Q', value: formatEs(stats.Q) },
            { label: 'St', value: formatEs(stats.St) },
            { label: 'Sy/x', value: formatEs(stats.syx) }
        ],
        tables: [
            { title: 'Ecuaciones normales', headers: ['a0', 'a1', 'a2', 'b'], rows: C.map((row, index) => [...row, rhs[index]]), markColumn: 3 },
            { title: 'Observado y estimado', headers: ['x1', 'x2', 'y', 'estimado'], rows: rows.map((row, index) => [row.x1, row.x2, row.y, predicted[index]]), markColumn: 3 }
        ],
        octave: `${octaveHeader('Regresión lineal múltiple')}
x1 = [${rows.map((row) => row.x1).join(' ')}]';
x2 = [${rows.map((row) => row.x2).join(' ')}]';
y = [${rows.map((row) => row.y).join(' ')}]';
n = length(y);
C = [n sum(x1) sum(x2); sum(x1) sum(x1.^2) sum(x1.*x2); sum(x2) sum(x1.*x2) sum(x2.^2)];
b = [sum(y); sum(x1.*y); sum(x2.*y)];
a = inv(C) * b;
disp(a);
`,
        graph: { type: 'predobs', title: 'Observado contra estimado', observed: rows.map((row) => row.y), predicted },
        note: 'La primera casilla de la matriz normal es n, el número de datos.',
        values: coefficients,
        extra: { r2: stats.r2, syx: stats.syx, Q: stats.Q }
    };
}

