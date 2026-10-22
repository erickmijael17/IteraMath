import { formatEs } from '../math/format';
import { MathError } from '../math/errors';
import { renderChart } from '../graph/charts';
import { saveHistoryEntry } from '../storage';
import { MethodId, MethodInput, SolveResult } from '../types/numerical';
import { METHOD_REGISTRY } from './methodRegistry';

const showResults = () => {
    document.getElementById('preview-section')?.classList.add('hidden');
    document.getElementById('results-container')?.classList.remove('hidden');
};

const cell = (value: number | string): string =>
    typeof value === 'number' ? formatEs(value) : value;

const tableHtml = (result: SolveResult): string => result.tables.map((table, index) => {
    const headers = table.headers.map((header, column) => `<th class="${table.markColumn === column ? 'marca' : ''}">${header}</th>`).join('');
    const rows = table.rows.map((row) => `<tr>${row.map((value, column) => `<td class="${table.markColumn === column ? 'marca' : ''}">${cell(value)}</td>`).join('')}</tr>`).join('');
    return `<div class="result-block" data-table="${index}"><div class="table-toolbar"><h3>${table.title}</h3><button type="button" class="btn-secondary" data-copy-table="${index}">Copiar para Excel</button></div><div class="table-responsive"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
}).join('');

export function renderResults(input: MethodInput, result: SolveResult, method: MethodId): void {
    showResults();
    const summary = document.getElementById('tab-summary');
    const table = document.getElementById('tab-table');
    const code = document.getElementById('tab-code');
    const meta = METHOD_REGISTRY[method];
    if (summary) {
        summary.innerHTML = `
            <div class="hero-metric-card">
                <div>
                    <div class="hero-metric-label">${result.headlineLabel}</div>
                    <div class="hero-metric-value">${result.headline}</div>
                </div>
                ${result.secondary ? `<div style="text-align:right"><div class="hero-metric-label">${result.secondaryLabel ?? ''}</div><div class="hero-metric-value" style="font-size:1.25rem">${result.secondary}</div></div>` : ''}
            </div>
            <span class="badge ${result.converged ? 'badge-success' : 'badge-warning'}">${result.status}</span>
            <h3>Detalles</h3>
            <p><strong>Método:</strong> ${meta.displayName}</p>
            ${result.details.filter((detail) => detail.label !== 'Método').map((detail) => `<p><strong>${detail.label}:</strong> ${detail.value}</p>`).join('')}
            ${result.note ? `<p class="method-help">${result.note}</p>` : ''}
        `;
    }
    if (table) {
        table.innerHTML = `<h3>Procedimiento</h3>${tableHtml(result)}`;
        table.querySelectorAll<HTMLButtonElement>('[data-copy-table]').forEach((button) => {
            button.addEventListener('click', async () => {
                const block = table.querySelector(`[data-table="${button.dataset.copyTable}"] table`);
                if (!block) return;
                const text = [...block.querySelectorAll('tr')].map((row) => [...row.children].map((cell) => cell.textContent ?? '').join('\t')).join('\n');
                await navigator.clipboard.writeText(text);
                button.textContent = 'Copiado';
                setTimeout(() => { button.textContent = 'Copiar para Excel'; }, 1200);
            });
        });
    }
    renderChart('plotly-canvas', result.graph);
    if (code) {
        code.innerHTML = `<div class="table-toolbar"><h3>Código GNU Octave</h3><button type="button" id="copy-octave-btn" class="btn-secondary">Copiar código</button></div><pre><code>${escapeHtml(result.octave)}</code></pre>`;
        document.getElementById('copy-octave-btn')?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(result.octave);
            const button = document.getElementById('copy-octave-btn');
            if (!button) return;
            button.textContent = 'Copiado';
            setTimeout(() => { button.textContent = 'Copiar código'; }, 1200);
        });
    }
    const entry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        method,
        input,
        result
    };
    saveHistoryEntry(entry).catch(() => {
        summary?.insertAdjacentHTML('beforeend', '<p class="method-help">El ejercicio se resolvió, pero no se pudo guardar en el historial de este navegador.</p>');
    });
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function handleError(error: unknown): void {
    showResults();
    const message = error instanceof MathError || error instanceof Error
        ? error.message
        : 'No se pudo resolver el ejercicio.';
    const summary = document.getElementById('tab-summary');
    if (summary) {
        summary.innerHTML = `<span class="badge badge-error">No se pudo resolver</span><p>${message}</p>`;
    }
    const table = document.getElementById('tab-table');
    if (table) table.innerHTML = '<p class="method-help">Corrige los datos y vuelve a resolver.</p>';
    const code = document.getElementById('tab-code');
    if (code) code.innerHTML = '<p class="method-help">El código aparece cuando el ejercicio se puede resolver.</p>';
}

export function clearResults(): void {
    document.getElementById('results-container')?.classList.add('hidden');
    document.getElementById('preview-section')?.classList.remove('hidden');
}
