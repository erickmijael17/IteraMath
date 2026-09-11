import Plotly from 'plotly.js-dist-min';
import { ErrorCriterion } from '../types/numerical';
import { CompareMethodResult } from '../comparison/types';
import { getGraphColors, buildGraphLayout, plotGraph } from './graphTheme';

export function plotConvergence(
    containerId: string,
    results: CompareMethodResult[],
    criterion: ErrorCriterion
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const methodNames: Record<string, string> = {
        'bisection': 'Bisección',
        'false-position': 'Regla Falsa',
        'fixed-point': 'Punto Fijo',
        'newton-raphson': 'Newton-Raphson',
        'secant': 'Secante',
        'muller': 'Müller'
    };

    const colors = getGraphColors();
    const data: Plotly.Data[] = [];
    let seriesIndex = 0;

    results.forEach(res => {
        if (res.status !== 'success' || !res.result) return;

        const iterations = res.result.iterations;
        if (iterations.length === 0) return;

        const x: number[] = [];
        const y: number[] = [];

        iterations.forEach((it: any) => {
            const val = criterion === 'residual' ? Math.abs(it.residual ?? 0) : it.error;

            if (val !== null && val !== undefined && !isNaN(val)) {
                x.push(it.iteration);
                y.push(val);
            }
        });

        if (x.length === 0) return;

        data.push({
            x,
            y,
            type: 'scatter',
            mode: 'lines+markers',
            name: methodNames[res.method] || res.method,
            line: { color: colors.series[seriesIndex % colors.series.length], width: 2 },
            marker: {
                color: colors.series[seriesIndex % colors.series.length],
                size: 8,
                line: { width: 2, color: colors.surface }
            },
            hovertemplate: 'k: %{x}<br>valor: %{y:.4e}<extra></extra>'
        });
        seriesIndex++;
    });

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay datos válidos para graficar.</div>';
        return;
    }

    const titleY = criterion === 'residual' ? 'Magnitud del Residuo |f(x)|' : 'Error';

    const layout = buildGraphLayout({
        title: 'Gráfica de Convergencia',
        xAxisTitle: 'Iteración (k)',
        yAxisTitle: titleY,
        yLogScale: true
    });

    plotGraph(container, data, layout);
}
