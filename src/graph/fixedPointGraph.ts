import Plotly from 'plotly.js-dist-min';
import { FixedPointResult, FixedPointInput } from '../types/numerical';
import { sampleFunction } from './functionSampler';
import {
    getGraphColors,
    computeFocusedRange,
    buildGraphLayout,
    buildCurveTrace,
    buildRootTrace,
    plotGraph,
    showGraphError
} from './graphTheme';

export function renderFixedPointGraph(
    containerId: string,
    input: FixedPointInput,
    result: FixedPointResult
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const iterationPoints = result.iterations.flatMap(it => [it.xCurrent, it.xNext]);
        const xRange = computeFocusedRange([input.x0, ...iterationPoints]);
        const sampledG = sampleFunction(input.iterationExpression, xRange[0], xRange[1], 300);
        const colors = getGraphColors();

        const traceIdentity: Plotly.Data = {
            x: sampledG.x,
            y: sampledG.x,
            mode: 'lines',
            name: 'y = x',
            line: { color: colors.auxiliary, width: 2, dash: 'dash' },
            hovertemplate: 'x: %{x:.4f}<br>y=x: %{y:.4f}<extra></extra>'
        };

        const traceG = buildCurveTrace(sampledG, 'g(x)');

        const cobwebX: number[] = [input.x0];
        const cobwebY: number[] = [0];

        result.iterations.forEach(it => {
            cobwebX.push(it.xCurrent);
            cobwebY.push(it.xNext);

            cobwebX.push(it.xNext);
            cobwebY.push(it.xNext);
        });

        const traceCobweb: Plotly.Data = {
            x: cobwebX,
            y: cobwebY,
            mode: 'lines+markers',
            name: 'Trayectoria Cobweb',
            line: { color: colors.approximations, width: 2 },
            marker: {
                color: colors.approximations,
                size: 6,
                line: { width: 1.5, color: colors.surface }
            },
            hovertemplate: 'x: %{x:.4f}<br>y: %{y:.4f}<extra></extra>'
        };

        const traceX0: Plotly.Data = {
            x: [input.x0],
            y: [0],
            mode: 'text+markers',
            name: `Inicio x₀ = ${input.x0}`,
            text: ['x₀'],
            textposition: 'bottom center',
            textfont: { size: 12, color: colors.approximations },
            marker: {
                color: colors.approximations,
                size: 10,
                symbol: 'diamond',
                line: { width: 2, color: colors.surface }
            },
            hovertemplate: 'Punto inicial x₀: %{x:.4f}<extra></extra>'
        };

        const rootY = result.iterations.length > 0
            ? result.iterations[result.iterations.length - 1].xNext
            : input.x0;
        const traceRoot = buildRootTrace(result.root, rootY, 'Punto Fijo aproximado', 'g(x)');

        const data: Plotly.Data[] = [traceIdentity, traceG, traceCobweb, traceX0, traceRoot];

        const statusLabel = result.converged ? 'Convergente' : 'No convergente';
        const layout = buildGraphLayout({
            title: `Punto Fijo: g(x) = ${input.iterationExpression} (${statusLabel} · ${result.totalIterations} iter.)`,
            xAxisTitle: 'x',
            yAxisTitle: 'y',
            xRange,
            yRange: xRange
        });

        plotGraph(container, data, layout);
    } catch (error: any) {
        showGraphError(container, error.message);
    }
}
