import Plotly from 'plotly.js-dist-min';
import { BisectionResult, FalsePositionResult, BisectionInput, FalsePositionInput } from '../types/numerical';
import { sampleFunction } from './functionSampler';
import {
    getGraphColors,
    computeFocusedRange,
    buildGraphLayout,
    buildCurveTrace,
    buildApproximationsTrace,
    buildRootTrace,
    plotGraph,
    showGraphError
} from './graphTheme';

type BracketResult = BisectionResult | FalsePositionResult;
type BracketInput = BisectionInput | FalsePositionInput;

export function renderBracketGraph(
    containerId: string,
    input: BracketInput,
    result: BracketResult,
    pointLabel: string = 'm'
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const iterationsX = result.iterations.map(it => {
            if ('midpoint' in it) return it.midpoint;
            if ('w' in it) return it.w;
            return 0;
        });

        const iterationsY = result.iterations.map(it => {
            if ('fm' in it) return it.fm;
            if ('fw' in it) return it.fw;
            return 0;
        });

        const xRange = computeFocusedRange([input.a, input.b, ...iterationsX]);
        const sampled = sampleFunction(input.expression, xRange[0], xRange[1], 300);
        const colors = getGraphColors();

        const traceCurve = buildCurveTrace(sampled, 'f(x)');

        const initialFa = result.iterations.length > 0 ? result.iterations[0].fa : 0;
        const initialFb = result.iterations.length > 0 ? result.iterations[0].fb : 0;

        const traceBounds: Plotly.Data = {
            x: [input.a, input.b],
            y: [initialFa, initialFb],
            mode: 'markers',
            name: 'Intervalo [a, b]',
            marker: {
                color: colors.approximations,
                size: 10,
                symbol: 'square',
                line: { width: 2, color: colors.surface }
            },
            hovertemplate: 'x: %{x:.4f}<br>f(x): %{y:.4f}<extra></extra>'
        };

        const traceIterations = buildApproximationsTrace(
            iterationsX,
            iterationsY,
            `f(${pointLabel})`,
            `Aproximaciones (${pointLabel})`
        );

        const rootY = iterationsY.length > 0 ? iterationsY[iterationsY.length - 1] : 0;
        const traceRoot = buildRootTrace(result.root, rootY);

        const data: Plotly.Data[] = [traceCurve, traceBounds, traceIterations, traceRoot];

        const layout = buildGraphLayout({
            title: `f(x) = ${input.expression}`,
            xRange
        });

        plotGraph(container, data, layout);
    } catch (error: any) {
        showGraphError(container, error.message);
    }
}
