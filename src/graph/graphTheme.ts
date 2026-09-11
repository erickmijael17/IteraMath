import Plotly from 'plotly.js-dist-min';
import { SampledFunction } from './functionSampler';

export interface GraphColors {
    curve: string;
    approximations: string;
    root: string;
    auxiliary: string;
    error: string;
    errorBg: string;
    series: string[];
    text: string;
    textMuted: string;
    grid: string;
    zeroline: string;
    hoverBg: string;
    hoverBorder: string;
    surface: string;
}

const LIGHT: GraphColors = {
    curve: '#4F46E5',
    approximations: '#D97706',
    root: '#047857',
    auxiliary: '#94A3B8',
    error: '#DC2626',
    errorBg: 'rgba(254, 226, 226, 0.92)',
    series: ['#4F46E5', '#D97706', '#047857', '#7C3AED', '#0284C7', '#DB2777'],
    text: '#334155',
    textMuted: '#64748B',
    grid: 'rgba(148, 163, 184, 0.18)',
    zeroline: 'rgba(148, 163, 184, 0.45)',
    hoverBg: 'rgba(255, 255, 255, 0.96)',
    hoverBorder: 'rgba(15, 23, 42, 0.08)',
    surface: '#FFFFFF'
};

const DARK: GraphColors = {
    curve: '#6366F1',
    approximations: '#D97706',
    root: '#047857',
    auxiliary: '#94A3B8',
    error: '#F87171',
    errorBg: 'rgba(127, 29, 29, 0.85)',
    series: ['#6366F1', '#D97706', '#047857', '#7C3AED', '#0284C7', '#E11D48'],
    text: '#CBD5E1',
    textMuted: '#94A3B8',
    grid: 'rgba(148, 163, 184, 0.14)',
    zeroline: 'rgba(148, 163, 184, 0.4)',
    hoverBg: 'rgba(19, 27, 46, 0.96)',
    hoverBorder: 'rgba(255, 255, 255, 0.1)',
    surface: '#131B2E'
};

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

export function isDarkMode(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getGraphColors(): GraphColors {
    return isDarkMode() ? DARK : LIGHT;
}

export function computeFocusedRange(
    points: number[],
    paddingRatio: number = 0.2,
    minSpan: number = 2
): [number, number] {
    const finite = points.filter(p => Number.isFinite(p));
    if (finite.length === 0) return [-10, 10];

    let min = Math.min(...finite);
    let max = Math.max(...finite);
    let span = max - min;

    if (span < minSpan) {
        const center = (min + max) / 2;
        min = center - minSpan / 2;
        max = center + minSpan / 2;
        span = minSpan;
    }

    const padding = span * paddingRatio;
    return [min - padding, max + padding];
}

export interface GraphLayoutOptions {
    title: string;
    xAxisTitle?: string;
    yAxisTitle?: string;
    xRange?: [number, number];
    yRange?: [number, number];
    yLogScale?: boolean;
    annotations?: Partial<Plotly.Annotations>[];
}

export function buildGraphLayout(options: GraphLayoutOptions): Partial<Plotly.Layout> {
    const colors = getGraphColors();

    return {
        title: {
            text: options.title,
            font: { family: FONT_FAMILY, size: 13, color: colors.text }
        },
        font: { family: FONT_FAMILY, color: colors.textMuted },
        autosize: true,
        margin: { l: 48, r: 16, t: 34, b: 34 },
        xaxis: {
            title: { text: options.xAxisTitle ?? 'x', font: { color: colors.textMuted, size: 12 } },
            zeroline: true,
            zerolinecolor: colors.zeroline,
            zerolinewidth: 1.5,
            gridcolor: colors.grid,
            gridwidth: 1,
            ...(options.xRange ? { range: options.xRange } : {})
        },
        yaxis: {
            title: { text: options.yAxisTitle ?? 'f(x)', font: { color: colors.textMuted, size: 12 } },
            zeroline: true,
            zerolinecolor: colors.zeroline,
            zerolinewidth: 1.5,
            gridcolor: colors.grid,
            gridwidth: 1,
            ...(options.yLogScale ? { type: 'log' as const, exponentformat: 'e' as const } : {}),
            ...(options.yRange ? { range: options.yRange } : {})
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        hovermode: 'x unified',
        hoverlabel: {
            bgcolor: colors.hoverBg,
            bordercolor: colors.hoverBorder,
            font: { family: FONT_FAMILY, size: 12, color: colors.text }
        },
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'right',
            x: 1,
            font: { color: colors.textMuted, size: 11 }
        },
        annotations: options.annotations ?? []
    };
}

export function buildGraphConfig(): Partial<Plotly.Config> {
    return {
        responsive: true,
        scrollZoom: true,
        displayModeBar: false,
        displaylogo: false
    };
}

export function buildCurveTrace(sampled: SampledFunction, name: string): Plotly.Data {
    const colors = getGraphColors();
    return {
        x: sampled.x,
        y: sampled.y as number[],
        mode: 'lines',
        name,
        line: { color: colors.curve, width: 2.5 },
        hovertemplate: `x: %{x:.4f}<br>${name}: %{y:.4f}<extra></extra>`
    };
}

export function buildApproximationsTrace(
    x: number[],
    y: number[],
    valueLabel: string,
    name: string = 'Aproximaciones'
): Plotly.Data {
    const colors = getGraphColors();
    return {
        x,
        y,
        mode: 'markers',
        name,
        marker: {
            color: colors.approximations,
            size: 8,
            line: { width: 1.5, color: colors.surface }
        },
        hovertemplate: `x: %{x:.4f}<br>${valueLabel}: %{y:.4f}<extra></extra>`
    };
}

export function buildRootTrace(
    x: number,
    y: number,
    name: string = 'Raíz final',
    valueLabel: string = 'f(x)'
): Plotly.Data {
    const colors = getGraphColors();
    return {
        x: [x],
        y: [y],
        mode: 'markers',
        name,
        marker: {
            color: colors.root,
            size: 11,
            symbol: 'diamond',
            line: { width: 2, color: colors.surface }
        },
        hovertemplate: `x: %{x:.6f}<br>${valueLabel}: %{y:.6f}<extra></extra>`
    };
}

const activeObservers = new WeakMap<HTMLElement, ResizeObserver>();

export function observeGraphResize(container: HTMLElement) {
    if (typeof ResizeObserver === 'undefined') return;
    if (activeObservers.has(container)) return;

    const ro = new ResizeObserver(() => {
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            Plotly.Plots.resize(container);
        }
    });

    ro.observe(container);
    activeObservers.set(container, ro);
}

export function zoomGraph(containerId: string, factor: number) {
    const container = document.getElementById(containerId) as any;
    if (!container || !container.layout || !container.layout.xaxis) return;

    const xRange = container.layout.xaxis.range;
    if (!Array.isArray(xRange) || xRange.length < 2) return;

    const center = (Number(xRange[0]) + Number(xRange[1])) / 2;
    const halfSpan = ((Number(xRange[1]) - Number(xRange[0])) * factor) / 2;

    const update: any = {
        'xaxis.range': [center - halfSpan, center + halfSpan]
    };

    const yRange = container.layout.yaxis?.range;
    if (Array.isArray(yRange) && yRange.length >= 2) {
        const yCenter = (Number(yRange[0]) + Number(yRange[1])) / 2;
        const yHalfSpan = ((Number(yRange[1]) - Number(yRange[0])) * factor) / 2;
        update['yaxis.range'] = [yCenter - yHalfSpan, yCenter + yHalfSpan];
    }

    Plotly.relayout(container, update);
}

export function resetGraphView(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) return;
    Plotly.relayout(container, {
        'xaxis.autorange': true,
        'yaxis.autorange': true
    });
}

export function focusGraphPoint(containerId: string, x: number, span: number = 4) {
    const container = document.getElementById(containerId);
    if (!container || !Number.isFinite(x)) return;

    Plotly.relayout(container, {
        'xaxis.range': [x - span / 2, x + span / 2],
        'yaxis.autorange': true
    });
}

export function exportGraphPng(containerId: string, filename: string = 'iteramath-grafica') {
    const container = document.getElementById(containerId);
    if (!container) return;
    Plotly.downloadImage(container, {
        format: 'png',
        width: 1200,
        height: 700,
        filename
    });
}

export function setupGraphInteractions(
    container: HTMLElement,
    onPointClick?: (x: number) => void
) {
    observeGraphResize(container);

    if (!onPointClick) return;

    (container as any).removeAllListeners?.('plotly_click');
    (container as any).on?.('plotly_click', (data: any) => {
        if (!data || !data.points || data.points.length === 0) return;
        const pt = data.points[0];
        if (typeof pt.x === 'number' && Number.isFinite(pt.x)) {
            onPointClick(pt.x);
        }
    });
}

export function plotGraph(
    container: HTMLElement,
    data: Plotly.Data[],
    layout: Partial<Plotly.Layout>,
    onPointClick?: (x: number) => void
) {
    Plotly.newPlot(container, data, layout, buildGraphConfig()).then(() => {
        setupGraphInteractions(container, onPointClick);
    });
}

export function showGraphError(container: HTMLElement, detail?: string) {
    container.innerHTML = `
        <div class="empty-state">
            <p class="error-text">No fue posible representar completamente esta función o sus iteraciones.</p>
            ${detail ? `<small>${detail}</small>` : ''}
        </div>
    `;
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

export function setupGraphToolbars() {
    document.addEventListener('click', (ev) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;

        const btn = target.closest('.graph-toolbar-btn') as HTMLElement | null;
        if (!btn) return;

        const toolbar = btn.closest('.graph-toolbar') as HTMLElement | null;
        if (!toolbar) return;

        const targetId = toolbar.getAttribute('data-target');
        if (!targetId) return;

        const action = btn.getAttribute('data-action');
        if (action === 'zoom-in') {
            zoomGraph(targetId, 0.75);
        } else if (action === 'zoom-out') {
            zoomGraph(targetId, 1.33);
        } else if (action === 'reset') {
            resetGraphView(targetId);
        } else if (action === 'download') {
            exportGraphPng(targetId, targetId === 'preview-canvas' ? 'vista-previa-funcion' : 'iteramath-grafica');
        }
    });
}
