import Plotly from 'plotly.js-dist-min';
import { NewtonRaphsonResult, NewtonRaphsonInput } from '../types/numerical';
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

export function renderNewtonGraph(
    containerId: string,
    input: NewtonRaphsonInput,
    result: NewtonRaphsonResult
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const iterationPoints = result.iterations.flatMap(it => [it.xCurrent, it.xNext]);
        const xRange = computeFocusedRange([input.x0, ...iterationPoints]);
        const sampledF = sampleFunction(input.expression, xRange[0], xRange[1], 300);
        const colors = getGraphColors();

        const traceF = buildCurveTrace(sampledF, 'f(x)');

        const traceApproximations = buildApproximationsTrace(
            result.iterations.map(it => it.xCurrent),
            result.iterations.map(it => it.fx),
            'f(x)'
        );

        const data: Plotly.Data[] = [traceF, traceApproximations];

        const tangentIndices = new Set<number>();
        const n = result.iterations.length;
        if (n <= 6) {
            for (let i = 0; i < n; i++) tangentIndices.add(i);
        } else {
            [0, 1, 2, n - 2, n - 1].forEach(i => tangentIndices.add(i));
        }

        result.iterations.forEach((it, index) => {
            if (!tangentIndices.has(index)) return;

            const dx = it.xNext - it.xCurrent;
            const xExtended = it.xNext + dx * 0.1;
            const yExtended = it.fx + it.dfx * (xExtended - it.xCurrent);

            const traceTangent: Plotly.Data = {
                x: [it.xCurrent, it.xNext, xExtended],
                y: [it.fx, 0, yExtended],
                mode: 'lines',
                name: `Tangente k=${it.iteration}`,
                line: { color: colors.auxiliary, width: 1.5, dash: 'dot' },
                showlegend: index === 0,
                hoverinfo: 'none'
            };

            const traceVertical: Plotly.Data = {
                x: [it.xNext, it.xNext],
                y: [0, it.fNext],
                mode: 'lines',
                name: `Proyección k=${it.iteration}`,
                line: { color: colors.auxiliary, width: 1, dash: 'dash' },
                showlegend: false,
                hoverinfo: 'none'
            };

            data.push(traceTangent);
            data.push(traceVertical);
        });

        const rootY = result.iterations.length > 0
            ? result.iterations[result.iterations.length - 1].fNext
            : 0;
        data.push(buildRootTrace(result.root, rootY));

        const layout = buildGraphLayout({
            title: `Newton-Raphson: f(x) = ${input.expression}`,
            xRange
        });

        plotGraph(container, data, layout);
    } catch (error: any) {
        showGraphError(container, error.message);
    }
}
