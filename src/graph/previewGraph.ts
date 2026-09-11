import Plotly from 'plotly.js-dist-min';
import { RootCandidate } from '../math/rootCandidates';
import { isValidExpression } from '../math/expressionCorrection';
import { sampleFunction } from './functionSampler';
import {
    getGraphColors,
    computeFocusedRange,
    buildGraphLayout,
    buildCurveTrace,
    plotGraph
} from './graphTheme';

export interface PreviewOptions {
    gx?: string | null;
    typedPoints?: number[];
    onPointSelect?: (x: number) => void;
}

export function renderPreviewGraph(
    containerId: string,
    expression: string,
    candidates: RootCandidate[],
    options: PreviewOptions = {}
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const rootPoints = candidates.map(c => c.rootApprox);
        const userPoints = (options.typedPoints ?? []).filter(p => Number.isFinite(p));
        const allKeyPoints = [...rootPoints, ...userPoints];

        const xRange = allKeyPoints.length > 0
            ? computeFocusedRange(allKeyPoints, 0.35, 6)
            : ([-10, 10] as [number, number]);

        const sampledF = sampleFunction(expression, xRange[0], xRange[1], 400);
        const colors = getGraphColors();

        const data: Plotly.Data[] = [buildCurveTrace(sampledF, 'f(x)')];

        const hasValidGx = options.gx !== undefined && options.gx !== null
            && options.gx.trim() !== '' && isValidExpression(options.gx);

        if (hasValidGx) {
            const sampledG = sampleFunction(options.gx!, xRange[0], xRange[1], 400);

            data.push({
                x: sampledG.x,
                y: sampledG.x,
                mode: 'lines',
                name: 'y = x',
                line: { color: colors.auxiliary, width: 1.5, dash: 'dash' },
                hovertemplate: 'x: %{x:.4f}<br>y=x: %{y:.4f}<extra></extra>'
            });

            data.push({
                x: sampledG.x,
                y: sampledG.y as number[],
                mode: 'lines',
                name: 'g(x)',
                line: { color: colors.series[1], width: 2.2 },
                hovertemplate: 'x: %{x:.4f}<br>g(x): %{y:.4f}<extra></extra>'
            });
        }

        if (userPoints.length > 0) {
            data.push({
                x: userPoints,
                y: userPoints.map(() => 0),
                mode: 'markers',
                name: 'Puntos ingresados',
                marker: {
                    color: colors.approximations,
                    size: 9,
                    symbol: 'circle',
                    line: { width: 1.5, color: colors.surface }
                },
                hovertemplate: 'Punto ingresado: %{x:.4f}<extra></extra>'
            });
        }

        if (candidates.length > 0) {
            data.push({
                x: candidates.map(c => c.rootApprox),
                y: candidates.map(() => 0),
                mode: 'markers',
                name: 'Raíces detectadas',
                marker: {
                    color: colors.root,
                    size: 11,
                    symbol: 'diamond',
                    line: { width: 2, color: colors.surface }
                },
                hovertemplate: 'raíz ≈ %{x:.4f}<extra></extra>'
            });
        }

        const layout = buildGraphLayout({
            title: `f(x) = ${expression}`,
            xRange,
            yAxisTitle: hasValidGx ? 'y' : 'f(x)'
        });

        plotGraph(container, data, layout, options.onPointSelect);
    } catch {
        showPreviewMessage(containerId, 'No fue posible graficar esta función en la vista previa.');
    }
}

export function showPreviewMessage(containerId: string, message: string) {
    const container = document.getElementById(containerId);
    if (!container) return;
    Plotly.purge(container);
    container.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
}
