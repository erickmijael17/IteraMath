import {
    NumericalMethod,
    ErrorCriterion,
    BisectionInput,
    BisectionResult,
    FalsePositionInput,
    FalsePositionResult,
    FixedPointInput,
    FixedPointResult,
    NewtonRaphsonInput,
    NewtonRaphsonResult,
    SecantInput,
    SecantResult,
    MullerInput,
    MullerResult
} from '../types/numerical';
import { HistoryEntry } from '../types/history';
import { bisection, falsePosition, fixedPoint, newtonRaphson, secant, muller } from '../methods';
import { resolveTolerance } from '../math/tolerance';
import { OctaveGenerationRequest } from '../octave';
import { formatComplex } from '../math/complex';
import {
    renderBracketGraph,
    renderFixedPointGraph,
    renderNewtonGraph,
    renderSecantGraph,
    renderMullerGraph
} from '../graph';

export type MethodInput =
    | BisectionInput
    | FalsePositionInput
    | FixedPointInput
    | NewtonRaphsonInput
    | SecantInput
    | MullerInput;

export type MethodResult =
    | BisectionResult
    | FalsePositionResult
    | FixedPointResult
    | NewtonRaphsonResult
    | SecantResult
    | MullerResult;

const GRAPH_CANVAS_ID = 'plotly-canvas';

const formatNum = (num: number | null) => (num === null ? '—' : num.toExponential(6));

const buildTableShell = (headers: string[], rows: string) => `
    <h3>Tabla de Iteraciones</h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rows.length > 0 ? rows : `<tr><td colspan="${headers.length}">No hay iteraciones.</td></tr>`}
            </tbody>
        </table>
    </div>
`;

const readCommon = (formData: FormData) => {
    const criterion = formData.get('errorCriterion') as ErrorCriterion;

    return {
        expression: formData.get('fx') as string,
        tolerance: resolveTolerance(
            String(formData.get('tolerance') ?? ''),
            formData.get('toleranceUnit') === 'pct' ? 'pct' : 'val',
            criterion
        ),
        maxIterations: Number(formData.get('maxIterations')),
        errorCriterion: criterion
    };
};

const createEntryId = (): string =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

export interface MethodMeta {
    displayName: string;
    buildInput: (formData: FormData) => MethodInput;
    solve: (input: MethodInput) => MethodResult;
    renderTable: (result: MethodResult) => string;
    renderGraph: (input: MethodInput, result: MethodResult) => void;
    octaveRequest: (input: MethodInput, result: MethodResult) => OctaveGenerationRequest;
    historyEntry: (input: MethodInput, result: MethodResult) => HistoryEntry;
}

const bisectionMeta: MethodMeta = {
    displayName: 'Bisección',
    buildInput: (fd) => ({ ...readCommon(fd), a: Number(fd.get('a')), b: Number(fd.get('b')) } as BisectionInput),
    solve: (input) => bisection(input as BisectionInput),
    renderTable: (result) => {
        const brResult = result as BisectionResult;
        const rows = brResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.a.toFixed(6)}</td>
                <td>${it.b.toFixed(6)}</td>
                <td>${it.midpoint.toFixed(6)}</td>
                <td>${it.fa.toFixed(6)}</td>
                <td>${it.fb.toFixed(6)}</td>
                <td>${it.fm.toFixed(6)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
        `).join('');
        return buildTableShell(['k', 'a', 'b', 'm', 'f(a)', 'f(b)', 'f(m)', 'Error'], rows);
    },
    renderGraph: (input, result) =>
        renderBracketGraph(GRAPH_CANVAS_ID, input as BisectionInput, result as BisectionResult, 'm'),
    octaveRequest: (input, result) =>
        ({ method: 'bisection', input: input as BisectionInput, result: result as BisectionResult }),
    historyEntry: (input, result) => ({
        id: createEntryId(),
        createdAt: new Date().toISOString(),
        method: 'bisection' as const,
        input: input as BisectionInput,
        result: result as BisectionResult
    })
};

const falsePositionMeta: MethodMeta = {
    displayName: 'Regla Falsa',
    buildInput: (fd) => ({ ...readCommon(fd), a: Number(fd.get('a')), b: Number(fd.get('b')) } as FalsePositionInput),
    solve: (input) => falsePosition(input as FalsePositionInput),
    renderTable: (result) => {
        const fpResult = result as FalsePositionResult;
        const rows = fpResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.a.toFixed(6)}</td>
                <td>${it.b.toFixed(6)}</td>
                <td>${it.w.toFixed(6)}</td>
                <td>${it.fa.toFixed(6)}</td>
                <td>${it.fb.toFixed(6)}</td>
                <td>${it.fw.toFixed(6)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
        `).join('');
        return buildTableShell(['k', 'a', 'b', 'w', 'f(a)', 'f(b)', 'f(w)', 'Error'], rows);
    },
    renderGraph: (input, result) =>
        renderBracketGraph(GRAPH_CANVAS_ID, input as FalsePositionInput, result as FalsePositionResult, 'w'),
    octaveRequest: (input, result) =>
        ({ method: 'false-position', input: input as FalsePositionInput, result: result as FalsePositionResult }),
    historyEntry: (input, result) => ({
        id: createEntryId(),
        createdAt: new Date().toISOString(),
        method: 'false-position' as const,
        input: input as FalsePositionInput,
        result: result as FalsePositionResult
    })
};

const fixedPointMeta: MethodMeta = {
    displayName: 'Punto Fijo',
    buildInput: (fd) => ({
        ...readCommon(fd),
        iterationExpression: fd.get('gx') as string,
        x0: Number(fd.get('x0'))
    } as FixedPointInput),
    solve: (input) => fixedPoint(input as FixedPointInput),
    renderTable: (result) => {
        const fpResult = result as FixedPointResult;
        const rows = fpResult.iterations.map(it => {
            const gPrimeAbs = it.gPrime !== null ? Math.abs(it.gPrime) : null;
            const gPrimeClass = gPrimeAbs !== null && gPrimeAbs >= 1 ? 'error-text' : '';
            return `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.xCurrent.toFixed(6)}</td>
                <td>${it.xNext.toFixed(6)}</td>
                <td>${it.fNext.toFixed(6)}</td>
                <td class="${gPrimeClass}">${gPrimeAbs !== null ? gPrimeAbs.toFixed(6) : '—'}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
        `;
        }).join('');
        return buildTableShell(['k', 'x_k', 'x_{k+1}', 'f(x_{k+1})', "|g'(x_k)|", 'Error'], rows);
    },
    renderGraph: (input, result) =>
        renderFixedPointGraph(GRAPH_CANVAS_ID, input as FixedPointInput, result as FixedPointResult),
    octaveRequest: (input, result) =>
        ({ method: 'fixed-point', input: input as FixedPointInput, result: result as FixedPointResult }),
    historyEntry: (input, result) => ({
        id: createEntryId(),
        createdAt: new Date().toISOString(),
        method: 'fixed-point' as const,
        input: input as FixedPointInput,
        result: result as FixedPointResult
    })
};

const newtonRaphsonMeta: MethodMeta = {
    displayName: 'Newton-Raphson',
    buildInput: (fd) => ({ ...readCommon(fd), x0: Number(fd.get('x0')) } as NewtonRaphsonInput),
    solve: (input) => newtonRaphson(input as NewtonRaphsonInput),
    renderTable: (result) => {
        const nrResult = result as NewtonRaphsonResult;
        const rows = nrResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.xCurrent.toFixed(6)}</td>
                <td>${it.fx.toFixed(6)}</td>
                <td>${it.dfx.toFixed(6)}</td>
                <td>${it.xNext.toFixed(6)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
        `).join('');
        return buildTableShell(['k', 'x_k', 'f(x_k)', "f'(x_k)", 'x_{k+1}', 'Error'], rows);
    },
    renderGraph: (input, result) =>
        renderNewtonGraph(GRAPH_CANVAS_ID, input as NewtonRaphsonInput, result as NewtonRaphsonResult),
    octaveRequest: (input, result) =>
        ({ method: 'newton-raphson', input: input as NewtonRaphsonInput, result: result as NewtonRaphsonResult }),
    historyEntry: (input, result) => ({
        id: createEntryId(),
        createdAt: new Date().toISOString(),
        method: 'newton-raphson' as const,
        input: input as NewtonRaphsonInput,
        result: result as NewtonRaphsonResult
    })
};

const secantMeta: MethodMeta = {
    displayName: 'Secante',
    buildInput: (fd) => ({
        ...readCommon(fd),
        x0: Number(fd.get('x0')),
        x1: Number(fd.get('x1'))
    } as SecantInput),
    solve: (input) => secant(input as SecantInput),
    renderTable: (result) => {
        const secResult = result as SecantResult;
        const rows = secResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.xPrevious.toFixed(6)}</td>
                <td>${it.xCurrent.toFixed(6)}</td>
                <td>${it.fPrevious.toFixed(6)}</td>
                <td>${it.fCurrent.toFixed(6)}</td>
                <td>${it.xNext.toFixed(6)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
        `).join('');
        return buildTableShell(['k', 'x_{k-1}', 'x_k', 'f(x_{k-1})', 'f(x_k)', 'x_{k+1}', 'Error'], rows);
    },
    renderGraph: (input, result) =>
        renderSecantGraph(GRAPH_CANVAS_ID, input as SecantInput, result as SecantResult),
    octaveRequest: (input, result) =>
        ({ method: 'secant', input: input as SecantInput, result: result as SecantResult }),
    historyEntry: (input, result) => ({
        id: createEntryId(),
        createdAt: new Date().toISOString(),
        method: 'secant' as const,
        input: input as SecantInput,
        result: result as SecantResult
    })
};

const mullerMeta: MethodMeta = {
    displayName: 'Müller',
    buildInput: (fd) => ({
        ...readCommon(fd),
        x0: Number(fd.get('x0')),
        x1: Number(fd.get('x1')),
        x2: Number(fd.get('x2'))
    } as MullerInput),
    solve: (input) => muller(input as MullerInput),
    renderTable: (result) => {
        const mullerResult = result as MullerResult;
        const rows = mullerResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${formatComplex(it.x0, 4)}</td>
                <td>${formatComplex(it.x1, 4)}</td>
                <td>${formatComplex(it.x2, 4)}</td>
                <td>${formatComplex(it.a, 4)}</td>
                <td>${formatComplex(it.b, 4)}</td>
                <td>${formatComplex(it.c, 4)}</td>
                <td>${formatComplex(it.discriminant, 4)}</td>
                <td>${formatComplex(it.xNext, 4)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
        `).join('');
        return buildTableShell(
            ['k', 'x0', 'x1', 'x2', 'a', 'b', 'c', 'D', 'xNext', 'Error'],
            rows
        );
    },
    renderGraph: (input, result) =>
        renderMullerGraph(GRAPH_CANVAS_ID, input as MullerInput, result as MullerResult),
    octaveRequest: (input, result) =>
        ({ method: 'muller', input: input as MullerInput, result: result as MullerResult }),
    historyEntry: (input, result) => ({
        id: createEntryId(),
        createdAt: new Date().toISOString(),
        method: 'muller' as const,
        input: input as MullerInput,
        result: result as MullerResult
    })
};

export const METHOD_REGISTRY: Record<NumericalMethod, MethodMeta> = {
    'bisection': bisectionMeta,
    'false-position': falsePositionMeta,
    'fixed-point': fixedPointMeta,
    'newton-raphson': newtonRaphsonMeta,
    'secant': secantMeta,
    'muller': mullerMeta
};

export const isNumericalMethod = (value: string): value is NumericalMethod =>
    Object.prototype.hasOwnProperty.call(METHOD_REGISTRY, value);
