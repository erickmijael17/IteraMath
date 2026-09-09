import Plotly from 'plotly.js-dist-min';
import { FixedPointResult, FixedPointInput } from '../types/numerical';
import { sampleFunction } from './functionSampler';

export function renderFixedPointGraph(
    containerId: string, 
    input: FixedPointInput, 
    result: FixedPointResult
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // Encontrar un intervalo representativo para la gráfica
        let minX = input.x0;
        let maxX = input.x0;
        
        result.iterations.forEach(it => {
            if (it.xNext < minX) minX = it.xNext;
            if (it.xNext > maxX) maxX = it.xNext;
        });

        // Dar un margen del 25% extra para visualizar mejor
        const interval = maxX - minX === 0 ? 2 : maxX - minX;
        minX -= interval * 0.25;
        maxX += interval * 0.25;

        // Muestrear g(x) y y=x
        const sampledG = sampleFunction(input.iterationExpression, minX, maxX, 300);
        
        // y = x es trivial, pasamos el mismo array
        const sampledId: Plotly.Data = {
            x: sampledG.x,
            y: sampledG.x, // y = x
            mode: 'lines',
            name: 'y = x',
            line: { color: '#94a3b8', width: 2, dash: 'dash' },
            hovertemplate: 'x: %{x:.4f}<br>y=x: %{y:.4f}<extra></extra>'
        };

        const traceG: Plotly.Data = {
            x: sampledG.x,
            y: sampledG.y as number[],
            mode: 'lines',
            name: 'g(x)',
            line: { color: '#2563eb', width: 2 },
            hovertemplate: 'x: %{x:.4f}<br>g(x): %{y:.4f}<extra></extra>'
        };

        // Construir telaraña (Cobweb)
        const cobwebX: number[] = [input.x0];
        const cobwebY: number[] = [0]; // Empezamos en el eje x (o podríamos empezar en (x0, x0))

        result.iterations.forEach(it => {
            // Subir verticalmente hasta g(x)
            cobwebX.push(it.xCurrent);
            cobwebY.push(it.xNext);

            // Mover horizontalmente hasta y=x
            cobwebX.push(it.xNext);
            cobwebY.push(it.xNext);
        });

        const traceCobweb: Plotly.Data = {
            x: cobwebX,
            y: cobwebY,
            mode: 'lines+markers',
            name: 'Iteraciones (Cobweb)',
            line: { color: '#f59e0b', width: 1.5 },
            marker: { color: '#d97706', size: 4 },
            opacity: 0.8,
            hovertemplate: 'x: %{x:.4f}<br>y: %{y:.4f}<extra></extra>'
        };

        const rootY = result.iterations.length > 0 ? result.iterations[result.iterations.length - 1].xNext : input.x0;
        
        const traceRoot: Plotly.Data = {
            x: [result.root],
            y: [rootY], // y = x = g(x) en la raíz
            mode: 'markers',
            name: 'Punto Fijo aproximado',
            marker: { color: '#16a34a', size: 12, symbol: 'star' },
            hovertemplate: 'x: %{x:.6f}<br>g(x): %{y:.6f}<extra></extra>'
        };

        const data: Plotly.Data[] = [sampledId, traceG, traceCobweb, traceRoot];

        const layout: Partial<Plotly.Layout> = {
            title: `Punto Fijo: g(x) = ${input.iterationExpression}`,
            autosize: true,
            margin: { l: 50, r: 20, t: 40, b: 40 },
            xaxis: {
                title: 'x',
                zeroline: true,
                zerolinecolor: '#94a3b8',
                zerolinewidth: 2,
                gridcolor: '#e2e8f0',
                range: [sampledG.x[0], sampledG.x[sampledG.x.length - 1]]
            },
            yaxis: {
                title: 'y',
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
