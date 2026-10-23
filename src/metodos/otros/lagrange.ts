/** Interpolación de Lagrange. Queda guardada, fuera de la lista de la aplicación. */
import * as math from 'mathjs';
import { MathError } from '../../matematicas/errors';
import { formatEs } from '../../matematicas/format';
import { octaveHeader } from '../../codigo-octave/text';
import { LagrangeInput, Point, SolveResult, TableData } from '../../tipos/numerical';

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

