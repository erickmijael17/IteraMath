import { NumericalMethod, FixedPointInput, FixedPointResult } from '../types/numerical';
import { MathError } from '../math/errors';
import { formatComplex } from '../math/complex';
import { generateOctaveCode } from '../octave';
import { saveHistoryEntry } from '../storage';
import { METHOD_REGISTRY, MethodInput, MethodResult } from './methodRegistry';

const getStopReasonText = (reason: string) => {
    switch (reason) {
        case 'TOLERANCE_REACHED': return 'Tolerancia alcanzada';
        case 'EXACT_ROOT': return 'Raíz exacta encontrada';
        case 'MAX_ITERATIONS': return 'Máximo de iteraciones alcanzado';
        default: return reason;
    }
};

const showResultsView = () => {
    const previewSection = document.getElementById('preview-section');
    const resultsContainer = document.getElementById('results-container');
    const globalStatusPanel = document.getElementById('global-status-panel');
    const tabsContainer = document.querySelector('.tabs');

    if (previewSection && resultsContainer) {
        previewSection.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    }

    if (globalStatusPanel) globalStatusPanel.classList.add('hidden');
    if (tabsContainer) tabsContainer.classList.remove('hidden');
};

const saveToHistory = (method: NumericalMethod, input: MethodInput, result: MethodResult) => {
    if (!result.converged && result.stopReason !== 'MAX_ITERATIONS') return;

    const meta = METHOD_REGISTRY[method];
    const entry = meta.historyEntry(input, result);

    saveHistoryEntry(entry).catch(() => {
        const summaryContainer = document.getElementById('tab-summary');
        if (!summaryContainer) return;
        const warning = document.createElement('p');
        warning.className = 'history-warning';
        warning.textContent = 'El ejercicio se resolvió correctamente, pero no fue posible guardarlo en el historial.';
        summaryContainer.appendChild(warning);
    });
};

const renderSummary = (
    method: NumericalMethod,
    input: MethodInput,
    result: MethodResult
) => {
    const summaryContainer = document.getElementById('tab-summary');
    if (!summaryContainer) return;

    const meta = METHOD_REGISTRY[method];
    const statusClass = result.converged ? 'badge-success' : 'badge-error';
    const statusText = result.converged ? 'Convergió' : 'No convergió';

    let extraInfo = '';
    let convergenceBadge = '';
    if (method === 'newton-raphson') {
        const nrResult = result as MethodResult & { derivativeExpression: string };
        extraInfo = `
            <p><strong>Función f(x):</strong> ${input.expression}</p>
            <p><strong>Derivada f'(x):</strong> ${nrResult.derivativeExpression}</p>
        `;
    }
    if (method === 'fixed-point') {
        const fpInput = input as FixedPointInput;
        const fpResult = result as FixedPointResult;
        extraInfo = `
            <p><strong>Función f(x):</strong> ${fpInput.expression}</p>
            <p><strong>Función g(x):</strong> ${fpInput.iterationExpression}</p>
            ${fpResult.gPrimeExpression ? `<p><strong>Derivada g'(x):</strong> ${fpResult.gPrimeExpression}</p>` : ''}
        `;
        if (fpResult.gPrimeAtRoot !== null) {
            const magnitude = Math.abs(fpResult.gPrimeAtRoot);
            const meets = magnitude < 1;
            convergenceBadge = `
                <span class="badge ${meets ? 'badge-success' : 'badge-warning'}" style="margin-left: 8px;">
                    |g'(x_r)| = ${magnitude.toFixed(4)} ${meets ? '&lt; 1 · Convergente' : '≥ 1 · Divergente'}
                </span>
            `;
        }
    }

    const rootStr = typeof result.root === 'number'
        ? result.root.toString()
        : formatComplex(result.root);

    let extraBadge = '';
    if (typeof result.root !== 'number' && Math.abs(result.root.im) > 1e-6) {
        extraBadge = '<span class="badge badge-warning" style="margin-left: 8px;">Raíz compleja</span>';
    }

    summaryContainer.innerHTML = `
        <div class="hero-metric-card">
            <div>
                <div class="hero-metric-label">Raíz aproximada (x_r)</div>
                <div class="hero-metric-value">${rootStr}</div>
            </div>
            <div style="text-align: right;">
                <div class="hero-metric-label">Iteraciones</div>
                <div class="hero-metric-value" style="font-size: 1.25rem;">${result.totalIterations}</div>
            </div>
        </div>
        <div style="margin-bottom: var(--spacing-md);">
            <span class="badge ${statusClass}">${statusText}</span>
            ${extraBadge}
            ${convergenceBadge}
        </div>
        <h3>Detalles de la Solución</h3>
        <p><strong>Método:</strong> ${meta.displayName}</p>
        ${extraInfo}
        <p><strong>Error final:</strong> ${result.finalError !== null ? result.finalError.toExponential(6) : '—'}</p>
        <p><strong>Residuo:</strong> ${result.residual.toExponential(6)}</p>
        <p><strong>Motivo de parada:</strong> ${getStopReasonText(result.stopReason)}</p>
    `;
};

const renderOctave = (method: NumericalMethod, input: MethodInput, result: MethodResult) => {
    const codeContainer = document.getElementById('tab-code');
    if (!codeContainer) return;

    const meta = METHOD_REGISTRY[method];
    const code = generateOctaveCode(meta.octaveRequest(input, result));

    codeContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0;">Código GNU Octave</h3>
            <button id="copy-octave-btn" class="btn-secondary">Copiar código</button>
        </div>
        <div style="overflow-x: auto; background-color: var(--surface-light); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <pre style="margin: 0; font-family: monospace; white-space: pre-wrap; font-size: 0.9rem;"><code>${code}</code></pre>
        </div>
    `;

    const copyBtn = document.getElementById('copy-octave-btn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(code);
            const originalText = copyBtn.innerText;
            copyBtn.innerText = '¡Copiado!';
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 2000);
        } catch {
            copyBtn.innerText = 'Error';
        }
    });
};

export function renderResults(
    input: MethodInput,
    result: MethodResult,
    methodName: string
) {
    showResultsView();

    const meta = METHOD_REGISTRY[methodName as NumericalMethod];
    if (!meta) return;

    renderSummary(methodName as NumericalMethod, input, result);

    const tableContainer = document.getElementById('tab-table');
    if (tableContainer) {
        tableContainer.innerHTML = meta.renderTable(result);
    }

    meta.renderGraph(input, result);
    renderOctave(methodName as NumericalMethod, input, result);
    saveToHistory(methodName as NumericalMethod, input, result);
}

export function handleError(error: Error) {
    showResultsView();

    let message = error.message;
    if (error instanceof MathError) {
        switch (error.code) {
            case 'INVALID_BRACKET':
                message = 'El intervalo seleccionado no presenta cambio de signo. Prueba otros valores para a y b.';
                break;
            case 'INVALID_EXPRESSION':
                message = 'La función ingresada no tiene una sintaxis válida.';
                break;
            case 'OUT_OF_DOMAIN':
                message = 'La función se evaluó fuera de su dominio válido (ej. división por cero, raíz de negativo).';
                break;
            case 'NON_FINITE_RESULT':
                message = 'La iteración produjo un valor que creció demasiado (divergencia) o no se puede calcular.';
                break;
        }
    }

    const summaryContainer = document.getElementById('tab-summary');
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div style="margin-bottom: var(--spacing-md);">
                <span class="badge badge-error">Error</span>
            </div>
            <h3>Error en la ejecución</h3>
            <p class="error-text">${message}</p>
        `;
    }

    const tableContainer = document.getElementById('tab-table');
    if (tableContainer) {
        tableContainer.innerHTML = '<h3>Tabla de Iteraciones</h3><p>No disponible debido a un error.</p>';
    }

    const codeContainer = document.getElementById('tab-code');
    if (codeContainer) {
        codeContainer.innerHTML = `
            <h3>Código GNU Octave</h3>
            <pre><code>% No se pudo generar código porque ocurrió un error en la evaluación.</code></pre>
        `;
    }
}

export function showUnimplementedState() {
    const previewSection = document.getElementById('preview-section');
    const resultsContainer = document.getElementById('results-container');
    const globalStatusPanel = document.getElementById('global-status-panel');
    const statusBadge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');
    const tabsContainer = document.querySelector('.tabs') as HTMLElement;

    if (previewSection && resultsContainer) {
        previewSection.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    }

    if (globalStatusPanel && statusBadge && statusText && tabsContainer) {
        globalStatusPanel.style.display = 'block';
        tabsContainer.classList.add('hidden');
        statusBadge.className = 'badge badge-info';
        statusBadge.textContent = 'Pendiente';
        statusText.textContent = 'Método aún no implementado.';
    }

    const codeContainer = document.getElementById('tab-code');
    if (codeContainer) {
        codeContainer.innerHTML = `
            <h3>Código GNU Octave</h3>
            <pre><code>% El método aún no está implementado.</code></pre>
        `;
    }
}
