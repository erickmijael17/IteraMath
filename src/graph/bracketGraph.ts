import Plotly from 'plotly.js-dist-min';
import { BisectionResult, FalsePositionResult, BisectionInput, FalsePositionInput } from '../types/numerical';
import { sampleFunction } from './functionSampler';

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
        const sampled = sampleFunction(input.expression, input.a, input.b, 300);

        // 1. Curva principal f(x)
        const traceCurve: Plotly.Data = {
            x: sampled.x,
            y: sampled.y as number[],
            mode: 'lines',
            name: 'f(x)',
            line: { color: '#2563eb', width: 2 },
            hovertemplate: 'x: %{x:.4f}<br>f(x): %{y:.4f}<extra></extra>'
        };

        // 2. Extremos del intervalo original
        const initialFa = result.iterations.length > 0 ? result.iterations[0].fa : 0; 
        const initialFb = result.iterations.length > 0 ? result.iterations[0].fb : 0;
        
        const traceBounds: Plotly.Data = {
            x: [input.a, input.b],
            y: [initialFa, initialFb],
            mode: 'markers',
            name: 'Intervalo Inicial [a, b]',
            marker: { color: '#d97706', size: 8, symbol: 'square' },
            hovertemplate: 'x: %{x:.4f}<br>f(x): %{y:.4f}<extra></extra>'
        };

        // 3. Iteraciones (Puntos Medios o w)
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

        const traceIterations: Plotly.Data = {
            x: iterationsX,
            y: iterationsY,
            mode: 'markers',
            name: `Aproximaciones (${pointLabel})`,
            marker: { color: '#64748b', size: 6, opacity: 0.7 },
            hovertemplate: `k: %{text}<br>${pointLabel}: %{x:.4f}<br>f(${pointLabel}): %{y:.4f}<extra></extra>`,
            text: result.iterations.map(it => it.iteration.toString())
        };

        // 4. Raíz aproximada
        const rootY = result.iterations.length > 0 
            ? iterationsY[iterationsY.length - 1] 
            : 0;

        const traceRoot: Plotly.Data = {
            x: [result.root],
            y: [rootY], 
            mode: 'markers',
            name: 'Raíz aproximada',
            marker: { color: '#16a34a', size: 12, symbol: 'star' },
            hovertemplate: 'x: %{x:.6f}<br>f(x): %{y:.6f}<extra></extra>'
        };

        // Combinar datos
        const data: Plotly.Data[] = [traceCurve, traceBounds, traceIterations, traceRoot];

        // Layout responsive y estético
        const layout: Partial<Plotly.Layout> = {
            title: `f(x) = ${input.expression}`,
            autosize: true,
            margin: { l: 50, r: 20, t: 40, b: 40 },
            xaxis: {
                title: 'x',
                zeroline: true,
                zerolinecolor: '#94a3b8',
                zerolinewidth: 2,
                gridcolor: '#e2e8f0',
                range: [sampled.x[0], sampled.x[sampled.x.length - 1]]
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
                <p class="error-text">No fue posible representar completamente esta función en el intervalo seleccionado.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

export function clearGraph(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;
    Plotly.purge(container);
    container.innerHTML = `
        <div class="empty-state">
            <p>Resuelve un ejercicio para visualizar la función.</p>
        </div>
    `;
}
