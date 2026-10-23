/**
 * Interpolación de Newton por diferencias divididas.
 * La tabla guarda f[xk], f[xk,xk+1], f[xk,xk+1,xk+2]...
 * Si x está más cerca del primer nodo, el polinomio es progresivo y usa el inicio de la tabla.
 * Si está más cerca del último, es regresivo y usa el final.
 * Se calculan P1, P2, ... hasta el grado pedido. La gráfica muestra los nodos y las curvas.
 */
import { formatEs } from '../../matematicas/format';
import { MathError } from '../../matematicas/errors';
import { octaveHeader } from '../../codigo-octave/text';
import { NewtonDividedInput, Point, SolveResult, TableData } from '../../tipos/numerical';

function assertPoints(points: Point[]): Point[] {
    if (points.length < 2) {
        throw new MathError('INVALID_POINTS', 'No se puede resolver porque hacen falta al menos dos puntos.');
    }
    const sorted = [...points].sort((a, b) => a.x - b.x);
    for (let index = 1; index < sorted.length; index++) {
        if (!Number.isFinite(sorted[index].x) || !Number.isFinite(sorted[index].y) || !Number.isFinite(sorted[0].y)) {
            throw new MathError('NON_FINITE_RESULT', 'No se puede resolver porque hay un dato que no es un número finito.');
        }
        if (Math.abs(sorted[index].x - sorted[index - 1].x) < 1e-12) {
            throw new MathError('INVALID_POINTS', 'No se puede resolver porque hay dos puntos con la misma x.');
        }
    }
    return sorted;
}

function differences(points: Point[]): number[][] {
    const size = points.length;
    const table = Array.from({ length: size }, () => Array(size).fill(0));
    points.forEach((point, index) => {
        table[index][0] = point.y;
    });
    // Cada columna nueva es (diferencia anterior) / (x del extremo derecho - x del izquierdo).
    for (let order = 1; order < size; order++) {
        for (let row = 0; row < size - order; row++) {
            const span = points[row + order].x - points[row].x;
            table[row][order] = (table[row + 1][order - 1] - table[row][order - 1]) / span;
        }
    }
    return table;
}

function progressive(points: Point[], degree: number, at: number): number {
    const subset = points.slice(0, degree + 1);
    const table = differences(subset);
    let value = table[0][degree];
    for (let order = degree - 1; order >= 0; order--) value = table[0][order] + (at - subset[order].x) * value;
    return value;
}

function regressive(points: Point[], degree: number, at: number): number {
    const subset = points.slice(points.length - (degree + 1));
    const table = differences(subset);
    const size = subset.length;
    const coefficients = Array.from({ length: degree + 1 }, (_, order) => table[size - 1 - order][order]);
    let value = coefficients[degree];
    for (let step = 1; step <= degree; step++) {
        const anchor = subset[size - degree + step - 1].x;
        value = coefficients[degree - step] + (at - anchor) * value;
    }
    return value;
}

function termProduct(anchors: number[]): string {
    return anchors.map((anchor) => `(x-${formatEs(anchor)})`).join('');
}

function progressiveFormula(points: Point[], degree: number): string {
    const subset = points.slice(0, degree + 1);
    const table = differences(subset);
    let text = formatEs(table[0][0]);
    for (let order = 1; order <= degree; order++) {
        text += ` + ${formatEs(table[0][order])}${termProduct(subset.slice(0, order).map((point) => point.x))}`;
    }
    return text.replace(/\+ -/g, '- ');
}

function regressiveFormula(points: Point[], degree: number): string {
    const subset = points.slice(points.length - (degree + 1));
    const table = differences(subset);
    const size = subset.length;
    let text = formatEs(table[size - 1][0]);
    for (let order = 1; order <= degree; order++) {
        const coefficient = table[size - 1 - order][order];
        const anchors = subset.slice(size - order).map((point) => point.x).reverse();
        text += ` + ${formatEs(coefficient)}${termProduct(anchors)}`;
    }
    return text.replace(/\+ -/g, '- ');
}

export function solveNewtonDivided(input: NewtonDividedInput): SolveResult {
    const points = assertPoints(input.points);
    const maxDegree = points.length - 1;
    const degree = Math.floor(input.degree);
    if (degree < 1 || degree > maxDegree) {
        throw new MathError('INVALID_POINTS', `No se puede resolver porque el grado debe estar entre 1 y ${maxDegree}.`);
    }
    const distanceStart = Math.abs(input.at - points[0].x);
    const distanceEnd = Math.abs(input.at - points[points.length - 1].x);
    const form = input.form === 'auto'
        ? (distanceEnd < distanceStart ? 'regresiva' : 'progresiva')
        : input.form;
    const evaluate = form === 'regresiva' ? regressive : progressive;
    const formulaOf = form === 'regresiva' ? regressiveFormula : progressiveFormula;
    const values: number[] = [];
    for (let current = 1; current <= degree; current++) values.push(evaluate(points, current, input.at));
    const table = differences(points);
    const differenceHeaders = ['i', 'xi', 'f[xk]', ...Array.from({ length: maxDegree }, (_, order) => {
        const indexes = Array.from({ length: order + 2 }, (_, step) => (step === 0 ? 'xk' : `xk+${step}`)).join(',');
        return `f[${indexes}]`;
    })];
    const differenceTable: TableData = {
        title: 'Diferencias divididas',
        headers: differenceHeaders,
        rows: points.map((point, row) => [
            row,
            point.x,
            ...table[row].map((value, order) => (row + order < points.length ? value : ''))
        ])
    };
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const polynomialRows: (number | string)[][] = values.map((value, index) => {
        const current = index + 1;
        const label = current === maxDegree ? 'todos los datos' : String(current);
        return [letters[index] ?? String(current), label, formulaOf(points, current), value];
    });
    const highest = values[values.length - 1];
    const forward = form === 'progresiva';
    return {
        converged: true,
        status: form === 'regresiva' ? 'Forma regresiva' : 'Forma progresiva',
        headlineLabel: `P${degree}(${formatEs(input.at)})`,
        headline: formatEs(highest),
        details: values.map((value, index) => ({ label: `P${index + 1}(${formatEs(input.at)})`, value: formatEs(value) })),
        tables: [
            differenceTable,
            {
                title: `Aproximar en x = ${formatEs(input.at)}`,
                headers: ['', 'Grado', 'Polinomio', 'P(x)'],
                rows: polynomialRows,
                markColumn: 3
            }
        ],
        octave: `${octaveHeader('Newton por diferencias divididas')}
X = [${points.map((point) => point.x).join(' ')}];
Y = [${points.map((point) => point.y).join(' ')}];
xq = ${input.at};
n = length(X);
T = zeros(n);
T(:, 1) = Y(:);
for j = 2:n
  for i = 1:n-j+1
    T(i, j) = (T(i+1, j-1) - T(i, j-1)) / (X(i+j-1) - X(i));
  end
end
disp(T);

% Forma ${form}
grado = ${degree};
for m = 1:grado
  ${forward
        ? `P = T(1, m+1);
  for k = m:-1:1
    P = T(1, k) + (xq - X(k)) * P;
  end`
        : `P = T(n-m, m+1);
  for k = 1:m
    P = T(n-m+k, m-k+1) + (xq - X(n-m+k)) * P;
  end`}
  fprintf('P%d(%g) = %.10f\\n', m, xq, P);
end
`,
        graph: {
            type: 'curve',
            title: `Newton ${form}`,
            nodes: points,
            curves: values.map((_, index) => {
                const current = index + 1;
                const left = Math.min(...points.map((point) => point.x));
                const right = Math.max(...points.map((point) => point.x));
                const xs: number[] = [];
                const ys: number[] = [];
                for (let step = 0; step <= 80; step++) {
                    const x = left + ((right - left) * step) / 80;
                    xs.push(x);
                    ys.push(evaluate(points, current, x));
                }
                return { name: `P${current}`, xs, ys };
            }),
            marker: { x: input.at, y: highest }
        },
        note: form === 'regresiva'
            ? 'x está más cerca del último nodo, así que la forma apropiada es la regresiva.'
            : 'x está más cerca del primer nodo, o se forzó la forma progresiva.',
        values,
        extra: {}
    };
}

