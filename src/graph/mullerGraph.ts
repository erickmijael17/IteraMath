import Plotly from 'plotly.js-dist-min';
import { MullerResult, MullerInput } from '../types/numerical';
import { sampleFunction } from './functionSampler';
import { formatComplex } from '../math/complex';

export function renderMullerGraph(
    containerId: string, 
    input: MullerInput, 
    result: MullerResult
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // Verificar si la raíz o iteraciones son muy complejas
        const isComplexRoot = Math.abs(result.root.im) > 1e-6;

        let minX = Math.min(input.x0, input.x1, input.x2);
        let maxX = Math.max(input.x0, input.x1, input.x2);
        
        result.iterations.forEach(it => {
            if (Math.abs(it.xNext.im) <= 1e-6) {
                if (it.xNext.re < minX) minX = it.xNext.re;
                if (it.xNext.re > maxX) maxX = it.xNext.re;
            }
        });

        const interval = maxX - minX === 0 ? 2 : maxX - minX;
        minX -= interval * 0.5;
        maxX += interval * 0.5;

        const sampledF = sampleFunction(input.expression, minX, maxX, 300);
        
        const data: Plotly.Data[] = [];

        const traceF: Plotly.Data = {
            x: sampledF.x,
            y: sampledF.y as number[],
            mode: 'lines',
            name: 'f(x)',
            line: { color: '#2563eb', width: 2 },
            hovertemplate: 'x: %{x:.4f}<br>f(x): %{y:.4f}<extra></extra>'
        };

        data.push(traceF);

        // Extraer iteraciones puramente reales para graficar como puntos naranjas
        const realIterX: number[] = [input.x0, input.x1, input.x2];
        const realIterY: number[] = [0, 0, 0];

        result.iterations.forEach(it => {
            if (Math.abs(it.xNext.im) <= 1e-6) {
                realIterX.push(it.xNext.re);
                realIterY.push(0);
            }
        });

        const traceApproximations: Plotly.Data = {
            x: realIterX,
            y: realIterX.map(() => 0), // Mostramos los puntos en el eje x para Muller dado que es complejo interpolar todo
            mode: 'markers',
            name: 'Aproximaciones Reales',
            marker: { color: '#d97706', size: 6 },
            hovertemplate: 'x: %{x:.4f}<extra></extra>'
        };
        data.push(traceApproximations);

        if (!isComplexRoot) {
            const traceRoot: Plotly.Data = {
                x: [result.root.re],
                y: [0],
                mode: 'markers',
                name: 'Raíz final',
                marker: { color: '#16a34a', size: 12, symbol: 'star' },
                hovertemplate: 'x: %{x:.6f}<extra></extra>'
            };
            data.push(traceRoot);
        }

        const layout: Partial<Plotly.Layout> = {
            title: `Müller: f(x) = ${input.expression}`,
            autosize: true,
            margin: { l: 50, r: 20, t: 40, b: 40 },
            xaxis: {
                title: 'Eje Real (x)',
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
            },
            annotations: isComplexRoot ? [{
                x: 0.5,
                y: 0.5,
                xref: 'paper',
                yref: 'paper',
                text: 'La raíz pertenece al plano complejo.<br>(' + formatComplex(result.root) + ')',
                showarrow: false,
                font: { size: 16, color: '#b91c1c' },
                bgcolor: '#fee2e2',
                bordercolor: '#b91c1c',
                borderwidth: 2,
                borderpad: 10
            }] : []
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
                <p class="error-text">No fue posible representar completamente esta función.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}
