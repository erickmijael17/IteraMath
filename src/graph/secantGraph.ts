import Plotly from 'plotly.js-dist-min';
import { SecantResult, SecantInput } from '../types/numerical';
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

export function renderSecantGraph(
    containerId: string,
    input: SecantInput,
    result: SecantResult
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const iterationPoints = result.iterations.flatMap(it => [it.xPrevious, it.xCurrent, it.xNext]);
        const xRange = computeFocusedRange([input.x0, input.x1, ...iterationPoints]);
        const sampledF = sampleFunction(input.expression, xRange[0], xRange[1], 300);
        const colors = getGraphColors();

        const traceF = buildCurveTrace(sampledF, 'f(x)');

        const traceApproximations = buildApproximationsTrace(
            [input.x0, ...result.iterations.map(it => it.xCurrent)],
            [
                result.iterations.length > 0 ? result.iterations[0].fPrevious : 0,
                ...result.iterations.map(it => it.fCurrent)
            ],
            'f(x)'
        );

        const data: Plotly.Data[] = [traceF, traceApproximations];

        const secantIndices = new Set<number>();
        const n = result.iterations.length;
        if (n <= 6) {
            for (let i = 0; i < n; i++) secantIndices.add(i);
        } else {
            [0, 1, 2, n - 2, n - 1].forEach(i => secantIndices.add(i));
        }

        result.iterations.forEach((it, index) => {
            if (!secantIndices.has(index)) return;

            const dx = it.xNext - it.xCurrent;
            const slope = (it.fCurrent - it.fPrevious) / (it.xCurrent - it.xPrevious);
            const xExtended = it.xNext + dx * 0.1;
            const yExtended = it.fCurrent + slope * (xExtended - it.xCurrent);

            const traceSecant: Plotly.Data = {
                x: [it.xPrevious, it.xCurrent, it.xNext, xExtended],
                y: [it.fPrevious, it.fCurrent, 0, yExtended],
                mode: 'lines',
                name: `Secante k=${it.iteration}`,
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

            data.push(traceSecant);
            data.push(traceVertical);
        });

        const rootY = result.iterations.length > 0
            ? result.iterations[result.iterations.length - 1].fNext
            : 0;
        data.push(buildRootTrace(result.root, rootY));

        const layout = buildGraphLayout({
            title: `Secante: f(x) = ${input.expression}`,
            xRange
        });

        plotGraph(container, data, layout);
    } catch (error: any) {
        showGraphError(container, error.message);
    }
}
