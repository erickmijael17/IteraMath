import { ErrorCriterion } from '../types/numerical';
import { CompareMethodResult } from '../comparison/types';

// Ocultar tipo exacto de plotly
declare const Plotly: any;

export function plotConvergence(containerId: string, results: CompareMethodResult[], criterion: ErrorCriterion) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (typeof Plotly === 'undefined') {
        container.innerHTML = '<div class="empty-state">Plotly.js no está cargado.</div>';
        return;
    }

    const data: any[] = [];
    
    // Nombres para mostrar
    const methodNames: Record<string, string> = {
        'bisection': 'Bisección',
        'false-position': 'Regla Falsa',
        'fixed-point': 'Punto Fijo',
        'newton-raphson': 'Newton-Raphson',
        'secant': 'Secante',
        'muller': 'Müller'
    };

    results.forEach(res => {
        if (res.status === 'success' && res.result) {
            const iterations = res.result.iterations;
            if (iterations.length === 0) return;

            const x: number[] = [];
            const y: number[] = [];

            iterations.forEach((it: any) => {
                let val: number | null = null;
                
                if (criterion === 'residual') {
                    val = Math.abs(it.residual ?? 0);
                } else {
                    val = it.error;
                }

                if (val !== null && val !== undefined && !isNaN(val)) {
                    x.push(it.iteration);
                    y.push(val);
                }
            });

            if (x.length > 0) {
                data.push({
                    x,
                    y,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: methodNames[res.method] || res.method,
                    line: { shape: 'linear' }
                });
            }
        }
    });

    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay datos válidos para graficar.</div>';
        return;
    }

    const titleY = criterion === 'residual' ? 'Magnitud del Residuo |f(x)|' : 'Error';

    const layout = {
        title: 'Gráfica de Convergencia',
        xaxis: {
            title: 'Iteración (k)',
            tick0: 0,
            dtick: 1
        },
        yaxis: {
            title: titleY,
            type: 'log', // Escala logarítmica sugerida
            exponentformat: 'e'
        },
        margin: { l: 60, r: 20, t: 40, b: 40 },
        legend: { orientation: 'h', y: -0.2 }
    };

    const config = { responsive: true, displayModeBar: false };

    Plotly.newPlot(containerId, data, layout, config);
}
