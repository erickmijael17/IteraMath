import * as math from 'mathjs';
import { MathError } from '../../matematicas/errors';
import { formatEs, subscript, vectorText } from '../../matematicas/format';
import { validateMaxIterations, validateTolerance } from '../../matematicas/validation';
import { solveSystem, vectorNorm } from '../../matematicas/matrix';
import { octaveHeader } from '../../codigo-octave/text';
import { IterationRow, NewtonSystemInput, SolveResult } from '../../tipos/numerical';

const NAMES = ['x', 'y', 'z', 'u', 'v', 'w'];

interface Compiled {
    text: string;
    derivatives: string[];
    evaluate: (point: number[]) => number;
    gradient: (point: number[]) => number[];
}

function scopeOf(names: string[], point: number[]): Record<string, number> {
    const scope: Record<string, number> = {};
    names.forEach((name, index) => {
        scope[name] = point[index];
    });
    return scope;
}

function compileList(expressions: string[], names: string[]): Compiled[] {
    return expressions.map((expression) => {
        let node: math.MathNode;
        try {
            node = math.parse(expression);
        } catch (error) {
            throw new MathError('INVALID_EXPRESSION', `No se pudo leer «${expression}».`);
        }
        const compiled = node.compile();
        const derivatives = names.map((name) => math.derivative(node, name));
        const derivativeCode = derivatives.map((derivative) => derivative.compile());
        return {
            text: expression,
            derivatives: derivatives.map((derivative) => derivative.toString()),
            evaluate: (point) => {
                const value = Number(compiled.evaluate(scopeOf(names, point)));
                if (!Number.isFinite(value)) {
                    throw new MathError('NON_FINITE_RESULT', 'Una función produjo un valor no finito.');
                }
                return value;
            },
            gradient: (point) => derivativeCode.map((derivative) => Number(derivative.evaluate(scopeOf(names, point))))
        };
    });
}

function prepare(input: NewtonSystemInput) {
    validateTolerance(input.tolerance);
    validateMaxIterations(input.maxIterations);
    const equations = input.equations.map((equation) => equation.trim()).filter(Boolean);
    if (equations.length < 2 || equations.length > 6) {
        throw new MathError('INVALID_MATRIX', 'Escribe entre 2 y 6 ecuaciones.');
    }
    if (input.x0.length !== equations.length) {
        throw new MathError('INVALID_MATRIX', 'El punto inicial debe tener una coordenada por ecuación.');
    }
    const names = NAMES.slice(0, equations.length);
    return { equations, names, compiled: compileList(equations, names) };
}

function finish(
    title: string,
    current: number[],
    series: IterationRow[],
    converged: boolean,
    tables: SolveResult['tables'],
    octave: string,
    note: string,
    names: string[]
): SolveResult {
    const errors = series.filter((row) => row.error !== null && (row.error as number) > 0);
    return {
        converged,
        status: converged ? 'Tolerancia alcanzada' : 'Máximo de iteraciones alcanzado',
        headlineLabel: 'Solución',
        headline: names.map((name, index) => `${name} = ${formatEs(current[index])}`).join(', '),
        secondaryLabel: 'Iteraciones',
        secondary: String(series.length),
        details: [
            { label: 'Método', value: title },
            { label: 'Error final', value: series.length ? formatEs(series[series.length - 1].error ?? Number.NaN) : '—' }
        ],
        tables,
        octave,
        graph: names.length === 2
            ? { type: 'path', title: 'Trayectoria', xs: [series.length ? series[0].x[0] : current[0], ...series.map((row) => row.x[0])], ys: [series.length ? series[0].x[1] : current[1], ...series.map((row) => row.x[1])] }
            : {
                type: 'convergence',
                title: 'Error',
                series: [{ name: title, iterations: errors.map((row) => row.iteration), errors: errors.map((row) => row.error as number) }]
            },
        note,
        values: current,
        extra: { iterations: series.length },
        series
    };
}

export function solveNewtonSystem(input: NewtonSystemInput): SolveResult {
    const { names, compiled } = prepare(input);
    let current = input.x0.slice();
    const series: IterationRow[] = [];
    let converged = false;
    const jacobians: string[][] = compiled.map((equation) => equation.derivatives);

    for (let iteration = 1; iteration <= input.maxIterations; iteration++) {
        const values = compiled.map((equation) => equation.evaluate(current));
        const jacobian = compiled.map((equation) => equation.gradient(current));
        let step: number[];
        try {
            step = solveSystem(jacobian, values, true, false).solution;
        } catch {
            throw new MathError('SINGULAR', 'La jacobiana no se pudo invertir en este punto.');
        }
        const next = current.map((value, index) => value - step[index]);
        const error = vectorNorm(next.map((value, index) => value - current[index]), 'inf');
        series.push({ iteration, x: next.slice(), error });
        current = next;
        if (error < input.tolerance) {
            converged = true;
            break;
        }
    }

    const octaveFns = compiled.map((equation, index) => {
        const args = names.join(', ');
        const derivatives = equation.derivatives.map((derivative, column) =>
            `d${index + 1}${names[column]} = @(${args}) ${derivative.replace(/\s*\^\s*/g, '^').replace(/\s+/g, '')};`
        ).join('\n');
        return `f${index + 1} = @(${args}) ${equation.text.replace(/\s*\^\s*/g, '^')};\n${derivatives}`;
    }).join('\n');

    return finish(
        'Newton para sistemas',
        current,
        series,
        converged,
        [
            {
                title: 'Jacobiana simbólica',
                headers: ['f', ...names],
                rows: jacobians.map((row, index) => [`f${subscript(index + 1)}`, ...row])
            },
            {
                title: 'Iteraciones',
                headers: ['i', ...names, 'error'],
                rows: series.map((row) => [row.iteration, ...row.x, row.error ?? '']),
                markColumn: names.length
            }
        ],
        `${octaveHeader('Newton-Raphson para sistemas')}
${octaveFns}
X = [${input.x0.join('; ')}];
tol = ${input.tolerance};
for k = 1:${input.maxIterations}
  F = [${compiled.map((_, index) => `f${index + 1}(${names.join(',')})`).join('; ')}];
  J = [${compiled.map((equation, index) => equation.derivatives.map((_, column) => `d${index + 1}${names[column]}(${names.join(',')})`).join(' ')).join('; ')}];
  X = X - J \\ F;
end
disp(X);
`.replace(/X = X - J \\ F;/, `% Las funciones se evalúan con las coordenadas actuales.\n  ${names.map((name, index) => `${name} = X(${index + 1});`).join(' ')}
  F = [${compiled.map((_, index) => `f${index + 1}(${names.join(',')})`).join('; ')}];
  J = [${compiled.map((equation, index) => equation.derivatives.map((_, column) => `d${index + 1}${names[column]}(${names.join(',')})`).join(' ')).join('; ')}];
  X = X - J \\ F;`),
        'La jacobiana se calcula de forma simbólica y cada paso resuelve J·Δ = F.',
        names
    );
}

export function solveFixedSystem(input: NewtonSystemInput): SolveResult {
    const { names, compiled } = prepare(input);
    let current = input.x0.slice();
    const series: IterationRow[] = [];
    let converged = false;
    for (let iteration = 1; iteration <= input.maxIterations; iteration++) {
        const next = compiled.map((equation) => equation.evaluate(current));
        const error = vectorNorm(next.map((value, index) => value - current[index]), 'inf');
        series.push({ iteration, x: next.slice(), error });
        current = next;
        if (error < input.tolerance) {
            converged = true;
            break;
        }
    }
    return finish(
        'Punto fijo para sistemas',
        current,
        series,
        converged,
        [{
            title: 'Iteraciones',
            headers: ['i', ...names, 'error'],
            rows: series.map((row) => [row.iteration, ...row.x, row.error ?? '']),
            markColumn: names.length
        }],
        `${octaveHeader('Punto fijo para sistemas')}
${compiled.map((equation, index) => `g${index + 1} = @(${names.join(', ')}) ${equation.text};`).join('\n')}
X = [${input.x0.join('; ')}];
for k = 1:${input.maxIterations}
  ${names.map((name, index) => `${name} = X(${index + 1});`).join(' ')}
  X = [${compiled.map((_, index) => `g${index + 1}(${names.join(',')})`).join('; ')}];
end
disp(X);
`,
        vectorText(current, 'g') ? 'Cada coordenada se reemplaza por su función g usando los valores anteriores.' : '',
        names
    );
}
