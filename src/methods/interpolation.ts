import * as math from 'mathjs';
import { MathError } from '../math/errors';
import { formatEs } from '../math/format';
import { octaveHeader } from '../octave/text';
import { LagrangeInput, NewtonDividedInput, Point, SolveResult, TableData } from '../types/numerical';

function assertPoints(points: Point[]): Point[] {
    if (points.length < 2) {
        throw new MathError('INVALID_POINTS', 'Hacen falta al menos dos nodos.');
    }
    const sorted = [...points].sort((a, b) => a.x - b.x);
    for (let index = 1; index < sorted.length; index++) {
        if (!Number.isFinite(sorted[index].x) || !Number.isFinite(sorted[index].y) || !Number.isFinite(sorted[0].y)) {
            throw new MathError('NON_FINITE_RESULT', 'Hay un nodo que no es un número finito.');
        }
        if (Math.abs(sorted[index].x - sorted[index - 1].x) < 1e-12) {
            throw new MathError('INVALID_POINTS', 'Hay dos nodos con la misma x.');
        }
    }
    return sorted;
}

function basis(points: Point[], index: number, at: number): number {
    let value = 1;
    for (let other = 0; other < points.length; other++) {
        if (other === index) continue;
        value *= (at - points[other].x) / (points[index].x - points[other].x);
    }
    return value;
}

function evaluateLagrange(points: Point[], at: number): { value: number; weights: number[] } {
    const weights = points.map((_, index) => basis(points, index, at));
    const value = weights.reduce((sum, weight, index) => sum + weight * points[index].y, 0);
    return { value, weights };
}

function closest(points: Point[], at: number, count: number): Point[] {
    return [...points]
        .sort((left, right) => {
            const distance = Math.abs(left.x - at) - Math.abs(right.x - at);
            if (Math.abs(distance) > 1e-12) return distance;
            return left.x - right.x;
        })
        .slice(0, count)
        .sort((left, right) => left.x - right.x);
}

function factorial(value: number): number {
    let result = 1;
    for (let factor = 2; factor <= value; factor++) result *= factor;
    return result;
}

function errorBound(expression: string, points: Point[], at: number): number {
    let derivative = math.parse(expression);
    for (let order = 0; order < points.length; order++) derivative = math.derivative(derivative, 'x');
    const compiled = derivative.compile();
    const xs = points.map((point) => point.x);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    let maxDerivative = 0;
    const steps = 600;
    for (let step = 0; step <= steps; step++) {
        const x = left + ((right - left) * step) / steps;
        const value = Math.abs(Number(compiled.evaluate({ x })));
        if (Number.isFinite(value) && value > maxDerivative) maxDerivative = value;
    }
    const product = xs.reduce((total, node) => total * (at - node), 1);
    return (maxDerivative * Math.abs(product)) / factorial(points.length);
}

function samplePolynomial(points: Point[], at: number): { xs: number[]; ys: number[] } {
    const left = Math.min(...points.map((point) => point.x), at);
    const right = Math.max(...points.map((point) => point.x), at);
    const span = Math.max(right - left, 1e-3);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let step = 0; step <= 80; step++) {
        const x = left - span * 0.05 + ((span * 1.1) * step) / 80;
        xs.push(x);
        ys.push(evaluateLagrange(points, x).value);
    }
    return { xs, ys };
}

export function solveLagrange(input: LagrangeInput): SolveResult {
    const points = assertPoints(input.points);
    const maxDegree = points.length - 1;
    const degree = Math.min(Math.max(1, Math.floor(input.degree)), maxDegree);
    const polynomials: { degree: number; points: Point[]; value: number; weights: number[] }[] = [];

    if (input.mode === 'todos') {
        const evaluated = evaluateLagrange(points, input.at);
        polynomials.push({ degree: maxDegree, points, ...evaluated });
    } else {
        for (let current = 1; current <= degree; current++) {
            const chosen = current === maxDegree ? points : closest(points, input.at, current + 1);
            const evaluated = evaluateLagrange(chosen, input.at);
            polynomials.push({ degree: current, points: chosen, ...evaluated });
        }
    }

    const tables: TableData[] = polynomials.map((polynomial) => ({
        title: `Grado ${polynomial.degree}`,
        headers: ['i', 'xi', 'f(xi)', 'Li', 'Li·f(xi)'],
        rows: polynomial.points.map((point, index) => [
            index,
            point.x,
            point.y,
            polynomial.weights[index],
            polynomial.weights[index] * point.y
        ]),
        markColumn: 4
    }));

    let bound: number | null = null;
    if (input.expression.trim()) {
        try {
            bound = errorBound(input.expression.trim(), points, input.at);
        } catch {
            throw new MathError('INVALID_EXPRESSION', 'No se pudo derivar f(x) para la cota de error.');
        }
    }

    const highest = polynomials[polynomials.length - 1];
    const octave = `${octaveHeader('Interpolación de Lagrange')}
X = [${points.map((point) => point.x).join(' ')}];
Y = [${points.map((point) => point.y).join(' ')}];
xq = ${input.at};
n = length(X);
L = zeros(1, n);
for i = 1:n
  L(i) = 1;
  for j = 1:n
    if i ~= j
      L(i) = L(i) * (xq - X(j)) / (X(i) - X(j));
    end
  end
end
P = sum(L .* Y);
disp(L);
disp(P);
`;

    return {
        converged: true,
        status: 'Polinomio construido',
        headlineLabel: highest ? `P${highest.degree}(${formatEs(input.at)})` : 'P(x)',
        headline: formatEs(highest?.value ?? Number.NaN),
        secondaryLabel: bound !== null ? 'Cota del error' : undefined,
        secondary: bound !== null ? formatEs(bound, 10) : undefined,
        details: polynomials.map((polynomial) => ({
            label: `P${polynomial.degree}`,
            value: formatEs(polynomial.value)
        })),
        tables,
        octave,
        graph: {
            type: 'curve',
            title: 'Polinomios de Lagrange',
            nodes: points,
            curves: polynomials.map((polynomial) => {
                const sampled = samplePolynomial(polynomial.points, input.at);
                return { name: `P${polynomial.degree}`, ...sampled };
            }),
            marker: { x: input.at, y: highest?.value ?? 0 }
        },
        note: input.mode === 'todos'
            ? 'Se usa un solo polinomio con todos los nodos.'
            : 'Cada grado usa los nodos más cercanos a x. Si la distancia empata, se queda el nodo de menor x. El último grado, si pide todos los datos, usa la tabla completa.',
        values: polynomials.map((polynomial) => polynomial.value),
        extra: bound !== null ? { bound } : {}
    };
}

function differences(points: Point[]): number[][] {
    const size = points.length;
    const table = Array.from({ length: size }, () => Array(size).fill(0));
    points.forEach((point, index) => {
        table[index][0] = point.y;
    });
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
    const degree = Math.min(Math.max(1, Math.floor(input.degree)), maxDegree);
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
