import Plotly from 'plotly.js-dist-min';
import { NewtonRaphsonResult, NewtonRaphsonInput } from '../types/numerical';
import { sampleFunction } from './functionSampler';

export function renderNewtonGraph(
    containerId: string, 
    input: NewtonRaphsonInput, 
    result: NewtonRaphsonResult
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        let minX = input.x0;
        let maxX = input.x0;
        
        result.iterations.forEach(it => {
            if (it.xNext < minX) minX = it.xNext;
            if (it.xNext > maxX) maxX = it.xNext;
        });

        const interval = maxX - minX === 0 ? 2 : maxX - minX;
        minX -= interval * 0.5;
        maxX += interval * 0.5;

        const sampledF = sampleFunction(input.expression, minX, maxX, 300);
        
        const traceF: Plotly.Data = {
            x: sampledF.x,
            y: sampledF.y as number[],
            mode: 'lines',
            name: 'f(x)',
            line: { color: '#2563eb', width: 2 },
            hovertemplate: 'x: %{x:.4f}<br>f(x): %{y:.4f}<extra></extra>'
        };

        const traceApproximations: Plotly.Data = {
            x: result.iterations.map(it => it.xCurrent),
            y: result.iterations.map(it => it.fx),
            mode: 'markers',
            name: 'Aproximaciones',
            marker: { color: '#d97706', size: 6 },
            hovertemplate: 'k: %{text}<br>x: %{x:.4f}<br>f(x): %{y:.4f}<extra></extra>',
            text: result.iterations.map(it => it.iteration.toString())
        };

        const data: Plotly.Data[] = [traceF, traceApproximations];

        // Para evitar saturación visual, graficar solo un número razonable de tangentes (máximo 5 o 6)
        // Daremos prioridad a las primeras 3 y a las últimas 2
        const tangentIndices = new Set<number>();
        const n = result.iterations.length;
        if (n <= 6) {
            for (let i = 0; i < n; i++) tangentIndices.add(i);
        } else {
            tangentIndices.add(0);
            tangentIndices.add(1);
            tangentIndices.add(2);
            tangentIndices.add(n - 2);
            tangentIndices.add(n - 1);
        }

        result.iterations.forEach((it, index) => {
            if (tangentIndices.has(index)) {
                // Dibujar línea desde (x_k, f(x_k)) hasta (x_{k+1}, 0)
                // Y un poquito más allá para ilustrar la secante cruzando el eje X.
                // Calculamos un dx para extender la línea visualmente un 10% más allá del eje x.
                const dx = it.xNext - it.xCurrent;
                const xExtended = it.xNext + dx * 0.1;
                const yExtended = it.fx + it.dfx * (xExtended - it.xCurrent);

                const traceTangent: Plotly.Data = {
                    x: [it.xCurrent, it.xNext, xExtended],
                    y: [it.fx, 0, yExtended],
                    mode: 'lines',
                    name: `Tangente k=${it.iteration}`,
                    line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
                    showlegend: index === 0, // Solo mostramos una en leyenda para no saturar
                    hoverinfo: 'none'
                };

                // Línea vertical punteada desde (x_{k+1}, 0) hasta (x_{k+1}, f(x_{k+1}))
                const traceVertical: Plotly.Data = {
                    x: [it.xNext, it.xNext],
                    y: [0, it.fNext],
                    mode: 'lines',
                    name: `Proyección k=${it.iteration}`,
                    line: { color: '#cbd5e1', width: 1, dash: 'dash' },
                    showlegend: false,
                    hoverinfo: 'none'
                };

                data.push(traceTangent);
                data.push(traceVertical);
            }
        });

        const rootY = result.iterations.length > 0 ? result.iterations[result.iterations.length - 1].fNext : 0;
        
        const traceRoot: Plotly.Data = {
            x: [result.root],
            y: [rootY],
            mode: 'markers',
            name: 'Raíz final',
            marker: { color: '#16a34a', size: 12, symbol: 'star' },
            hovertemplate: 'x: %{x:.6f}<br>f(x): %{y:.6f}<extra></extra>'
        };

        data.push(traceRoot);

        const layout: Partial<Plotly.Layout> = {
            title: `Newton-Raphson: f(x) = ${input.expression}`,
            autosize: true,
            margin: { l: 50, r: 20, t: 40, b: 40 },
            xaxis: {
                title: 'x',
                zeroline: true,
                zerolinecolor: '#94a3b8',
                zerolinewidth: 2,
                gridcolor: '#e2e8f0',
                range: [sampledF.x[0], sampledF.x[sampledF.x.length - 1]]
            },
            yaxis: {
                title: 'f(x)',
                zeroline: true,
                zerolinecolor: '#94a3b8',
                zerolinewidth: 2,
                gridcolor: '#e2e8f0'
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            hovermode: 'closest',
            legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: 1.02,
                xanchor: 'right',
                x: 1
            }
        };

        const config: Partial<Plotly.Config> = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        };

        Plotly.newPlot(container, data, layout, config);

    } catch (error: any) {
        container.innerHTML = `
            <div class="empty-state">
                <p class="error-text">No fue posible representar completamente esta función o sus iteraciones.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}
