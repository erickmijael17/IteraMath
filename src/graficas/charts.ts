import Plotly from 'plotly.js-dist-min';
import { GraphSpec } from '../tipos/numerical';
import { buildGraphLayout, getGraphColors, plotGraph } from './graphTheme';

export function renderChart(containerId: string, spec: GraphSpec): void {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (spec.type === 'none') {
        container.innerHTML = '<div class="empty-state"><p>Este método se lee en la tabla.</p></div>';
        return;
    }

    const colors = getGraphColors();
    let data: Plotly.Data[] = [];
    let layout = buildGraphLayout({ title: spec.title, xAxisTitle: 'x', yAxisTitle: 'y' });

    if (spec.type === 'bars') {
        data = [{
            type: 'bar',
            x: spec.labels,
            y: spec.values,
            marker: { color: colors.curve },
            hovertemplate: '%{x}: %{y:.6g}<extra></extra>'
        }];
        layout = buildGraphLayout({ title: spec.title, xAxisTitle: 'Incógnita', yAxisTitle: 'Valor' });
    }

    if (spec.type === 'convergence') {
        data = spec.series.map((series, index) => ({
            type: 'scatter',
            mode: 'lines+markers',
            name: series.name,
            x: series.iterations,
            y: series.errors.map((error) => Math.max(error, 1e-16)),
            line: { color: colors.series[index % colors.series.length], width: 2.5 },
            marker: { size: 7 }
        }));
        layout = buildGraphLayout({
            title: spec.title,
            xAxisTitle: 'Iteración',
            yAxisTitle: 'Error',
            yLogScale: true
        });
    }

    if (spec.type === 'curve') {
        data = [
            ...spec.curves.map((curve, index) => ({
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: curve.name,
                x: curve.xs,
                y: curve.ys,
                line: { color: colors.series[index % colors.series.length], width: 2.5 }
            })),
            {
                type: 'scatter',
                mode: 'markers',
                name: 'Nodos',
                x: spec.nodes.map((node) => node.x),
                y: spec.nodes.map((node) => node.y),
                marker: { color: colors.approximations, size: 9 }
            }
        ];
        if (spec.marker) {
            data.push({
                type: 'scatter',
                mode: 'markers',
                name: 'Resultado',
                x: [spec.marker.x],
                y: [spec.marker.y],
                marker: { color: colors.root, size: 12, symbol: 'diamond' }
            });
        }
        layout = buildGraphLayout({ title: spec.title, xAxisTitle: 'x', yAxisTitle: 'y' });
    }

    if (spec.type === 'predobs') {
        const low = Math.min(...spec.observed, ...spec.predicted);
        const high = Math.max(...spec.observed, ...spec.predicted);
        data = [
            { type: 'scatter', mode: 'lines', name: 'Ideal', x: [low, high], y: [low, high], line: { color: colors.auxiliary, dash: 'dot' } },
            { type: 'scatter', mode: 'markers', name: 'Datos', x: spec.observed, y: spec.predicted, marker: { color: colors.curve, size: 9 } }
        ];
        layout = buildGraphLayout({ title: spec.title, xAxisTitle: 'Observado', yAxisTitle: 'Estimado' });
    }

    if (spec.type === 'path') {
        data = [{
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Iteraciones',
            x: spec.xs,
            y: spec.ys,
            line: { color: colors.curve, width: 2 },
            marker: { size: 8, color: colors.approximations }
        }];
        layout = buildGraphLayout({ title: spec.title, xAxisTitle: 'x', yAxisTitle: 'y' });
    }

    plotGraph(container, data, layout);
}
