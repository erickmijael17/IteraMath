import { MathError } from '../math/errors';
import { formatEs } from '../math/format';
import { Matrix, Vector, inverse, solveSystem, zeros } from '../math/matrix';
import { octaveHeader } from '../octave/text';
import { MultiRegInput, PolyRegInput, SolveResult } from '../types/numerical';

function evalPoly(coefficients: number[], x: number): number {
    return coefficients.reduce((sum, coefficient, power) => sum + coefficient * x ** power, 0);
}

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

export function solvePolyReg(input: PolyRegInput): SolveResult {
    const points = [...input.points].sort((left, right) => left.x - right.x);
    const degree = Math.floor(input.degree);
    if (degree < 1) throw new MathError('INVALID_POINTS', 'El grado debe ser al menos 1.');
    if (points.length <= degree + 1) {
        throw new MathError('INVALID_POINTS', 'Hacen falta más puntos que coeficientes para calcular Sy/x.');
    }
    const size = degree + 1;
    const C = zeros(size);
    const rhs = Array(size).fill(0);
    for (let row = 0; row < size; row++) {
        for (let column = 0; column < size; column++) {
            C[row][column] = points.reduce((sum, point) => sum + point.x ** (row + column), 0);
        }
        rhs[row] = points.reduce((sum, point) => sum + point.y * point.x ** row, 0);
    }
    const coefficients = solveNormal(C, rhs);
    const observed = points.map((point) => point.y);
    const predicted = points.map((point) => evalPoly(coefficients, point.x));
    const stats = fitStats(observed, predicted, size);
    const mean = observed.reduce((sum, value) => sum + value, 0) / observed.length;
    const invC = inverse(C);
    const hasAt = input.at !== undefined && Number.isFinite(input.at);
    const prediction = hasAt ? evalPoly(coefficients, input.at as number) : undefined;
    const left = Math.min(points[0].x, hasAt ? input.at as number : points[0].x);
    const right = Math.max(points[points.length - 1].x, hasAt ? input.at as number : points[points.length - 1].x);
    const span = right - left || 1;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let step = 0; step <= 80; step++) {
        const x = left + (span * step) / 80;
        xs.push(x);
        ys.push(evalPoly(coefficients, x));
    }
    const formula = coefficients.map((coefficient, power) => {
        if (power === 0) return formatEs(coefficient);
        return `${formatEs(coefficient)} x^${power}`;
    }).join(' + ').replace(/\+ -/g, '- ');
    const power = (exponent: number) => exponent <= 1 ? 'xi' : `xi^${exponent}`;
    const headers = ['i', 'xi', 'yi'];
    for (let exponent = 2; exponent <= degree * 2; exponent++) headers.push(power(exponent));
    for (let exponent = 1; exponent <= degree; exponent++) headers.push(exponent === 1 ? 'xi·yi' : `xi^${exponent}·yi`);
    headers.push('(P-y)^2', '(y-media)^2');
    const dataRows = points.map((point, index) => {
        const row: (number | string)[] = [index + 1, point.x, point.y];
        for (let exponent = 2; exponent <= degree * 2; exponent++) row.push(point.x ** exponent);
        for (let exponent = 1; exponent <= degree; exponent++) row.push(point.y * point.x ** exponent);
        row.push((predicted[index] - point.y) ** 2, (point.y - mean) ** 2);
        return row;
    });
    const totals = dataRows[0].map((_, column) => {
        if (column === 0) return 'Σ';
        return dataRows.reduce((sum, row) => sum + Number(row[column]), 0);
    });
    const relation = Math.sqrt(Math.max(stats.r2, 0));
    const slope = coefficients[1] ?? 0;
    const direction = slope < 0 ? 'inversa' : 'directa';
    const strength = relation >= 0.9 ? 'alta' : relation >= 0.7 ? 'moderada' : 'baja';
    const percent = formatEs(stats.r2 * 100, 2);
    const evaluate = hasAt
        ? `xq = ${input.at};
Px = 0;
for k = 0:m
  Px = Px + a(k + 1) * xq ^ k;
end
disp('Aproximación');
disp(Px);
`
        : '';

    return {
        converged: true,
        status: 'Ajuste calculado',
        headlineLabel: degree === 1 ? 'Recta' : 'Polinomio',
        headline: formula,
        secondaryLabel: prediction !== undefined ? `P(${formatEs(input.at as number)})` : 'r²',
        secondary: prediction !== undefined ? formatEs(prediction) : formatEs(stats.r2, 6),
        details: [
            { label: 'n, número de datos', value: String(points.length) },
            { label: 'Grado del polinomio', value: String(degree) },
            { label: 'Media de y', value: formatEs(mean) },
            { label: 'Q, suma de cuadrados del error', value: formatEs(stats.Q) },
            { label: 'St, variación total de y', value: formatEs(stats.St) },
            { label: 'r², coeficiente de determinación', value: `${formatEs(stats.r2, 8)} · explica el ${percent}% de la variación de y` },
            { label: 'r, coeficiente de correlación', value: `${formatEs(relation, 8)} · relación ${direction} y ${strength}` },
            { label: 'Sy/x, error estándar de la estimación', value: formatEs(stats.syx) },
            ...(prediction !== undefined ? [{ label: `Valor estimado en x = ${formatEs(input.at as number)}`, value: formatEs(prediction) }] : [])
        ],
        tables: [
            { title: 'Sumas para las ecuaciones normales', headers, rows: [...dataRows, totals] },
            { title: 'Matriz C y vector b', headers: [...coefficients.map((_, index) => `a${index}`), 'b'], rows: C.map((row, index) => [...row, rhs[index]]), markColumn: size },
            { title: 'Inversa de C', headers: coefficients.map((_, index) => `c${index}`), rows: invC },
            { title: 'Coeficientes', headers: ['k', 'ak'], rows: coefficients.map((coefficient, index) => [index, coefficient]), markColumn: 1 }
        ],
        octave: `${octaveHeader(degree === 1 ? 'Regresión lineal' : 'Regresión polinomial')}
x = [${points.map((point) => point.x).join(' ')}]';
y = [${points.map((point) => point.y).join(' ')}]';
n = length(x);
m = ${degree};
C = zeros(m + 1);
b = zeros(m + 1, 1);
for i = 0:m
  for j = 0:m
    C(i + 1, j + 1) = sum(x .^ (i + j));
  end
  b(i + 1) = sum(y .* x .^ i);
end
disp('C'); disp(C);
disp('b'); disp(b);
a = inv(C) * b;
disp('Coeficientes');
disp(a);
Q = sum((polyval(a(end:-1:1)', x) - y) .^ 2);
media = sum(y) / n;
St = sum((y - media) .^ 2);
r2 = (St - Q) / St;
Syx = sqrt(Q / (n - (m + 1)));
disp('r2'); disp(r2);
disp('Syx'); disp(Syx);
${evaluate}`,
        graph: {
            type: 'curve',
            title: degree === 1 ? 'Regresión lineal' : 'Regresión polinomial',
            nodes: points,
            curves: [{ name: degree === 1 ? 'recta' : `grado ${degree}`, xs, ys }],
            ...(prediction !== undefined ? { marker: { x: input.at as number, y: prediction } } : {})
        },
        note: `El ${percent}% de la variabilidad de y en función de x está expresada en el modelo. La relación es ${direction} y es ${strength}.`,
        values: coefficients,
        extra: { r2: stats.r2, syx: stats.syx, Q: stats.Q, ...(prediction !== undefined ? { prediction } : {}) }
    };
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
