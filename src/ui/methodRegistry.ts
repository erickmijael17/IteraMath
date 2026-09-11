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
import { ComplexValue } from '../math/complex';
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

function formatTableCell(val: number | ComplexValue | null | undefined, maxDecimals: number = 8): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
        if (Math.abs(val.im) < 1e-9) {
            return formatTableCell(val.re, maxDecimals);
        }
        const reStr = formatTableCell(val.re, 4);
        const imAbsStr = formatTableCell(Math.abs(val.im), 4);
        const sign = val.im > 0 ? '+' : '-';
        return `${reStr} ${sign} ${imAbsStr}i`;
    }
    if (typeof val === 'number') {
        if (Number.isNaN(val) || !Number.isFinite(val)) return '—';
        if (val === 0 || Math.abs(val) < 1e-12) return '0';
        const absVal = Math.abs(val);
        if (absVal < 1e-6) {
            const decStr = val.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
            if (decStr.indexOf('.') !== -1) {
                return decStr.replace('.', ',');
            }
            return val.toExponential(4).replace('.', ',');
        }
        const formatted = val.toFixed(maxDecimals).replace(/0+$/, '').replace(/\.$/, '');
        return formatted.replace('.', ',');
    }
    return String(val);
}

function formatErrorCell(err: number | null | undefined, isInitial: boolean = false): string {
    if (isInitial || err === null || err === undefined) return '';
    return formatTableCell(err, 8);
}

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
                <td>${formatTableCell(it.a)}</td>
                <td>${formatTableCell(it.b)}</td>
                <td>${formatTableCell(it.midpoint)}</td>
                <td>${formatTableCell(it.fa)}</td>
                <td>${formatTableCell(it.fb)}</td>
                <td>${formatTableCell(it.fm)}</td>
                <td>${formatErrorCell(it.error, it.iteration === 0)}</td>
            </tr>
        `).join('');
        return buildTableShell(['i', 'a', 'b', 'c', 'f(a)', 'f(b)', 'f(c)', 'Ei'], rows);
    },
    renderGraph: (input, result) =>
        renderBracketGraph(GRAPH_CANVAS_ID, input as BisectionInput, result as BisectionResult, 'c'),
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
                <td>${formatTableCell(it.a)}</td>
                <td>${formatTableCell(it.b)}</td>
                <td>${formatTableCell(it.w)}</td>
                <td>${formatTableCell(it.fa)}</td>
                <td>${formatTableCell(it.fb)}</td>
                <td>${formatTableCell(it.fw)}</td>
                <td>${formatErrorCell(it.error, it.iteration === 0)}</td>
            </tr>
        `).join('');
        return buildTableShell(['i', 'a', 'b', 'm', 'f(a)', 'f(b)', 'f(m)', 'Ei'], rows);
    },
    renderGraph: (input, result) =>
        renderBracketGraph(GRAPH_CANVAS_ID, input as FalsePositionInput, result as FalsePositionResult, 'm'),
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
        const rowList: string[] = [];
        if (fpResult.iterations.length > 0) {
            rowList.push(`
                <tr>
                    <td>0</td>
                    <td>${formatTableCell(fpResult.iterations[0].xCurrent)}</td>
                    <td></td>
                </tr>
            `);
            fpResult.iterations.forEach(it => {
                rowList.push(`
                    <tr>
                        <td>${it.iteration + 1}</td>
                        <td>${formatTableCell(it.xNext)}</td>
                        <td>${formatErrorCell(it.error, false)}</td>
                    </tr>
                `);
            });
        }
        return buildTableShell(['i', 'xi', 'Ei'], rowList.join(''));
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
                <td>${formatTableCell(it.xCurrent)}</td>
                <td>${formatTableCell(it.fx)}</td>
                <td>${formatTableCell(it.dfx)}</td>
                <td>${formatTableCell(it.xNext)}</td>
                <td>${formatErrorCell(it.error, it.iteration === 0)}</td>
            </tr>
        `).join('');
        return buildTableShell(['i', 'xi', 'f(xi)', "f'(xi)", 'x_{i+1}', 'Ei'], rows);
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
                <td>${formatTableCell(it.xPrevious)}</td>
                <td>${formatTableCell(it.xCurrent)}</td>
                <td>${formatTableCell(it.xNext)}</td>
                <td>${formatErrorCell(it.error, it.iteration === 0)}</td>
            </tr>
        `).join('');
        return buildTableShell(['i', 'X0', 'X1', 'X2', 'Ea'], rows);
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
                <td>${formatTableCell(it.x0)}</td>
                <td>${formatTableCell(it.x1)}</td>
                <td>${formatTableCell(it.x2)}</td>
                <td>${formatTableCell(it.xNext)}</td>
                <td>${formatErrorCell(it.error, it.iteration === 0)}</td>
            </tr>
        `).join('');
        return buildTableShell(
            ['i', 'X0', 'X1', 'X2', 'X3', 'Ea'],
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
