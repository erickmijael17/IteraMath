import { formatEs, subscript } from '../matematicas/format';
import { MathError } from '../matematicas/errors';
import { renderChart } from '../graficas/charts';
import { saveHistoryEntry } from '../almacenamiento';
import { MethodId, MethodInput, SolveResult } from '../tipos/numerical';
import { METHOD_REGISTRY } from './methodRegistry';

const showResults = () => {
    document.getElementById('preview-section')?.classList.add('hidden');
    document.getElementById('results-container')?.classList.remove('hidden');
};

const graphTab = (visible: boolean) => {
    const button = document.querySelector<HTMLButtonElement>('[data-tab="tab-graph"]');
    button?.classList.toggle('hidden', !visible);
    if (!visible && button?.classList.contains('active')) {
        document.querySelector<HTMLButtonElement>('[data-tab="tab-summary"]')?.click();
    }
};

const cell = (value: number | string): string =>
    typeof value === 'number' ? formatEs(value) : value;

const tableHtml = (result: SolveResult): string => result.tables.map((table, index) => {
    const headers = table.headers.map((header, column) => `<th class="${table.markColumn === column ? 'marca' : ''}">${header}</th>`).join('');
    const rows = table.rows.map((row) => `<tr>${row.map((value, column) => `<td class="${table.markColumn === column ? 'marca' : ''}">${cell(value)}</td>`).join('')}</tr>`).join('');
    return `<div class="result-block" data-table="${index}"><div class="table-toolbar"><h3>${table.title}</h3><button type="button" class="btn-secondary" data-copy-table="${index}">Copiar para Excel</button></div><div class="table-responsive"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
}).join('');

function partes(value: string): { numero: string; ayuda: string } {
    const [numero, ...resto] = value.split(' · ');
    return { numero, ayuda: resto.join(' · ') };
}

function condicionDe(result: SolveResult): { numero: string; ayuda: string } | null {
    const detail = result.details.find((item) => item.label === 'Cond(A)');
    if (!detail) return null;
    return partes(detail.value);
}

function resumenHtml(result: SolveResult, methodName: string): string {
    const sistema = result.headlineLabel === 'Solución' && result.values.length > 1;
    const condicion = condicionDe(result);
    const detalles = result.details.filter((detail) => detail.label !== 'Método' && detail.label !== 'Cond(A)');
    const cortos = !sistema && detalles.length > 1 && detalles.every((detail) => !detail.value.includes(' · ') && detail.value.length < 28);
    const lista = cortos ? [] : detalles;
    const tono = condicion?.ayuda.includes('bien')
        ? 'badge-success'
        : condicion?.ayuda.includes('mal')
            ? 'badge-error'
            : 'badge-warning';
    const incognitas = sistema
        ? result.values.map((value, index) => `
            <article class="solucion-carta">
                <span class="solucion-nombre">Incógnita x${subscript(index + 1)}</span>
                <strong class="solucion-numero">${formatEs(value)}</strong>
            </article>`).join('')
        : `
            <article class="solucion-carta solucion-carta-ancha">
                <span class="solucion-nombre">${escapeHtml(result.headlineLabel)}</span>
                <strong class="solucion-numero ${result.headline.length > 18 ? 'solucion-formula' : ''}">${escapeHtml(result.headline)}</strong>
            </article>
            ${result.secondary ? `
            <article class="solucion-carta solucion-destacada">
                <span class="solucion-nombre">${escapeHtml(result.secondaryLabel ?? 'Resultado')}</span>
                <strong class="solucion-numero">${escapeHtml(result.secondary)}</strong>
            </article>` : ''}`;
    const grados = cortos
        ? `<div class="solucion-rejilla">${detalles.map((detail) => `
            <article class="solucion-carta">
                <span class="solucion-nombre">${escapeHtml(detail.label)}</span>
                <strong class="solucion-numero solucion-formula">${escapeHtml(detail.value)}</strong>
            </article>`).join('')}</div>`
        : '';
    const filas = lista.map((detail) => {
        const parte = partes(detail.value);
        return `<div class="dato-fila">
            <span class="dato-etiqueta">${escapeHtml(detail.label)}</span>
            <strong class="dato-valor">${escapeHtml(parte.numero)}</strong>
            ${parte.ayuda ? `<span class="dato-ayuda">${escapeHtml(parte.ayuda)}</span>` : ''}
        </div>`;
    }).join('');

    return `
        <section class="resumen">
            <header class="resumen-cabeza">
                <div>
                    <p class="resumen-metodo">${escapeHtml(methodName)}</p>
                    <h3>${escapeHtml(sistema ? 'Solución del sistema' : result.headlineLabel)}</h3>
                </div>
                <span class="badge ${result.converged ? 'badge-success' : 'badge-warning'}">${escapeHtml(result.status)}</span>
            </header>
            <div class="solucion-rejilla">${incognitas}</div>
            ${condicion ? `
            <div class="condicion">
                <div>
                    <span class="solucion-nombre">Condicionamiento de A</span>
                    <strong class="dato-valor">${escapeHtml(condicion.numero)}</strong>
                </div>
                <span class="badge ${tono}">${escapeHtml(condicion.ayuda || 'Cond(A)')}</span>
            </div>` : ''}
            ${grados}
            ${filas ? `<div class="datos-lista">${filas}</div>` : ''}
            ${result.note ? `<p class="resumen-nota">${escapeHtml(result.note)}</p>` : ''}
        </section>`;
}

export function renderResults(input: MethodInput, result: SolveResult, method: MethodId): void {
    showResults();
    const summary = document.getElementById('tab-summary');
    const table = document.getElementById('tab-table');
    const code = document.getElementById('tab-code');
    const meta = METHOD_REGISTRY[method];
    if (summary) summary.innerHTML = resumenHtml(result, meta.displayName);
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
    graphTab(result.graph.type !== 'none');
    if (result.graph.type !== 'none') renderChart('plotly-canvas', result.graph);
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
    graphTab(false);
    const summary = document.getElementById('tab-summary');
    if (summary) {
        summary.innerHTML = `<section class="resumen"><span class="badge badge-error">No se pudo resolver</span><p class="resumen-nota">${escapeHtml(message)}</p></section>`;
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
