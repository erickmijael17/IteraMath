import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';

import { setupMethodForm } from './ui/methodForm';
import { setupTabs } from './ui/tabs';
import { bisection, falsePosition, fixedPoint, newtonRaphson, secant, muller } from './methods';
import { 
    BisectionResult, BisectionInput, 
    FalsePositionResult, FalsePositionInput,
    FixedPointResult, FixedPointInput,
    NewtonRaphsonResult, NewtonRaphsonInput,
    SecantResult, SecantInput,
    MullerResult, MullerInput,
    ErrorCriterion 
} from './types/numerical';
import { MathError } from './math/errors';
import { formatComplex } from './math/complex';
import { renderBracketGraph, renderFixedPointGraph, renderNewtonGraph, renderSecantGraph, renderMullerGraph, clearGraph } from './graph';
import { generateOctaveCode } from './octave';

const getStopReasonText = (reason: string) => {
    switch (reason) {
        case 'TOLERANCE_REACHED': return 'Tolerancia alcanzada';
        case 'EXACT_ROOT': return 'Raíz exacta encontrada';
        case 'MAX_ITERATIONS': return 'Máximo de iteraciones alcanzado';
        default: return reason;
    }
};

const formatNum = (num: number | null) => {
    if (num === null) return '—';
    return num.toExponential(6);
};

type BracketInput = BisectionInput | FalsePositionInput;
type MethodInput = BisectionInput | FalsePositionInput | FixedPointInput | NewtonRaphsonInput | SecantInput | MullerInput;
type MethodResult = BisectionResult | FalsePositionResult | FixedPointResult | NewtonRaphsonResult | SecantResult | MullerResult;

const renderResults = (input: MethodInput, result: MethodResult, methodName: string) => {
    const emptyState = document.getElementById('empty-state');
    const resultsContainer = document.getElementById('results-container');
    const globalStatusPanel = document.getElementById('global-status-panel');
    const tabsContainer = document.querySelector('.tabs');
    
    if (emptyState && resultsContainer) {
        emptyState.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    }

    if (globalStatusPanel) globalStatusPanel.classList.add('hidden');
    if (tabsContainer) tabsContainer.classList.remove('hidden');

    let methodDisplayName = '';
    if (methodName === 'bisection') methodDisplayName = 'Bisección';
    else if (methodName === 'false-position') methodDisplayName = 'Regla Falsa';
    else if (methodName === 'fixed-point') methodDisplayName = 'Punto Fijo';
    else if (methodName === 'newton-raphson') methodDisplayName = 'Newton-Raphson';
    else if (methodName === 'secant') methodDisplayName = 'Secante';
    else if (methodName === 'muller') methodDisplayName = 'Müller';

    const summaryContainer = document.getElementById('tab-summary');
    if (summaryContainer) {
        const statusClass = result.converged ? 'badge-success' : 'badge-error';
        const statusText = result.converged ? 'Convergió' : 'No convergió';
        
        let extraInfo = '';
        if (methodName === 'newton-raphson') {
            const nrResult = result as NewtonRaphsonResult;
            extraInfo = `
                <p><strong>Función f(x):</strong> ${input.expression}</p>
                <p><strong>Derivada f'(x):</strong> ${nrResult.derivativeExpression}</p>
            `;
        }

        let rootStr = typeof result.root === 'number' ? result.root.toString() : formatComplex(result.root);
        let extraBadge = '';
        if (typeof result.root !== 'number' && Math.abs(result.root.im) > 1e-6) {
            extraBadge = `<span class="badge badge-warning" style="margin-left: 8px;">Raíz compleja</span>`;
        }

        summaryContainer.innerHTML = `
            <div style="margin-bottom: var(--spacing-md);">
                <span class="badge ${statusClass}">${statusText}</span>
                ${extraBadge}
            </div>
            <h3>Resumen de Resultados</h3>
            <p><strong>Método:</strong> ${methodDisplayName}</p>
            ${extraInfo}
            <p><strong>Raíz aproximada:</strong> ${rootStr}</p>
            <p><strong>Error final:</strong> ${result.finalError !== null ? result.finalError.toExponential(6) : '—'}</p>
            <p><strong>Residuo:</strong> ${result.residual.toExponential(6)}</p>
            <p><strong>Iteraciones:</strong> ${result.totalIterations}</p>
            <p><strong>Motivo de parada:</strong> ${getStopReasonText(result.stopReason)}</p>
        `;
    }

    const tableContainer = document.getElementById('tab-table');
    if (tableContainer) {
        if (methodName === 'newton-raphson') {
            const nrResult = result as NewtonRaphsonResult;
            let rows = nrResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.xCurrent.toFixed(6)}</td>
                <td>${it.fx.toFixed(6)}</td>
                <td>${it.dfx.toFixed(6)}</td>
                <td>${it.xNext.toFixed(6)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
            `).join('');

            tableContainer.innerHTML = `
                <h3>Tabla de Iteraciones</h3>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>k</th>
                                <th>x_k</th>
                                <th>f(x_k)</th>
                                <th>f'(x_k)</th>
                                <th>x_{k+1}</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length > 0 ? rows : `<tr><td colspan="6">No hay iteraciones.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;
            renderNewtonGraph('plotly-canvas', input as NewtonRaphsonInput, nrResult);

        } else if (methodName === 'secant') {
            const secResult = result as SecantResult;
            let rows = secResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.xPrevious.toFixed(6)}</td>
                <td>${it.xCurrent.toFixed(6)}</td>
                <td>${it.fPrevious.toFixed(6)}</td>
                <td>${it.fCurrent.toFixed(6)}</td>
                <td>${it.xNext.toFixed(6)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
            `).join('');

            tableContainer.innerHTML = `
                <h3>Tabla de Iteraciones</h3>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>k</th>
                                <th>x_{k-1}</th>
                                <th>x_k</th>
                                <th>f(x_{k-1})</th>
                                <th>f(x_k)</th>
                                <th>x_{k+1}</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length > 0 ? rows : `<tr><td colspan="7">No hay iteraciones.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;
            renderSecantGraph('plotly-canvas', input as SecantInput, secResult);

        } else if (methodName === 'muller') {
            const mullerResult = result as MullerResult;
            let rows = mullerResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${formatComplex(it.x0, 4)}</td>
                <td>${formatComplex(it.x1, 4)}</td>
                <td>${formatComplex(it.x2, 4)}</td>
                <td>${formatComplex(it.a, 4)}</td>
                <td>${formatComplex(it.b, 4)}</td>
                <td>${formatComplex(it.c, 4)}</td>
                <td>${formatComplex(it.discriminant, 4)}</td>
                <td>${formatComplex(it.xNext, 4)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
            `).join('');

            tableContainer.innerHTML = `
                <h3>Tabla de Iteraciones</h3>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>k</th>
                                <th>x0</th>
                                <th>x1</th>
                                <th>x2</th>
                                <th>a</th>
                                <th>b</th>
                                <th>c</th>
                                <th>D</th>
                                <th>xNext</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length > 0 ? rows : `<tr><td colspan="10">No hay iteraciones.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;
            renderMullerGraph('plotly-canvas', input as MullerInput, mullerResult);

        } else if (methodName === 'fixed-point') {
            const fpResult = result as FixedPointResult;
            let rows = fpResult.iterations.map(it => `
            <tr>
                <td>${it.iteration}</td>
                <td>${it.xCurrent.toFixed(6)}</td>
                <td>${it.xNext.toFixed(6)}</td>
                <td>${it.fNext.toFixed(6)}</td>
                <td>${formatNum(it.error)}</td>
            </tr>
            `).join('');

            tableContainer.innerHTML = `
                <h3>Tabla de Iteraciones</h3>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>k</th>
                                <th>x_k</th>
                                <th>x_{k+1}</th>
                                <th>f(x_{k+1})</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length > 0 ? rows : `<tr><td colspan="5">No hay iteraciones.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;
            renderFixedPointGraph('plotly-canvas', input as FixedPointInput, fpResult);
        } else {
            const isBisection = methodName === 'bisection';
            const pointLabel = isBisection ? 'm' : 'w';
            const brResult = result as (BisectionResult | FalsePositionResult);
            
            let rows = brResult.iterations.map((it: any) => {
                const pointVal = 'midpoint' in it ? it.midpoint : ('w' in it ? it.w : 0);
                const fPointVal = 'fm' in it ? it.fm : ('fw' in it ? it.fw : 0);
                return `
                <tr>
                    <td>${it.iteration}</td>
                    <td>${it.a.toFixed(6)}</td>
                    <td>${it.b.toFixed(6)}</td>
                    <td>${pointVal.toFixed(6)}</td>
                    <td>${it.fa.toFixed(6)}</td>
                    <td>${it.fb.toFixed(6)}</td>
                    <td>${fPointVal.toFixed(6)}</td>
                    <td>${formatNum(it.error)}</td>
                </tr>
                `;
            }).join('');

            tableContainer.innerHTML = `
                <h3>Tabla de Iteraciones</h3>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>k</th>
                                <th>a</th>
                                <th>b</th>
                                <th>${pointLabel}</th>
                                <th>f(a)</th>
                                <th>f(b)</th>
                                <th>f(${pointLabel})</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length > 0 ? rows : `<tr><td colspan="8">No hay iteraciones.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;
            renderBracketGraph('plotly-canvas', input as (BisectionInput | FalsePositionInput), brResult, pointLabel);
        }
    }

    // Renderizar Octave
    const codeContainer = document.getElementById('tab-code');
    if (codeContainer) {
        const code = generateOctaveCode(methodName, input, result);
        codeContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">Código GNU Octave</h3>
                <button id="copy-octave-btn" class="btn btn-secondary">Copiar código</button>
            </div>
            <div style="overflow-x: auto; background-color: var(--surface-light); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <pre style="margin: 0; font-family: monospace; white-space: pre-wrap; font-size: 0.9rem;"><code>${code}</code></pre>
            </div>
        `;

        const copyBtn = document.getElementById('copy-octave-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code);
                    const originalText = copyBtn.innerText;
                    copyBtn.innerText = "¡Copiado!";
                    setTimeout(() => {
                        copyBtn.innerText = originalText;
                    }, 2000);
                } catch (err) {
                    console.error('Error al copiar:', err);
                    copyBtn.innerText = "Error";
                }
            });
        }
    }
};

const handleError = (error: Error) => {
    const emptyState = document.getElementById('empty-state');
    const resultsContainer = document.getElementById('results-container');
    const globalStatusPanel = document.getElementById('global-status-panel');
    const tabsContainer = document.querySelector('.tabs');
    
    if (emptyState && resultsContainer) {
        emptyState.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    }

    if (globalStatusPanel) globalStatusPanel.classList.add('hidden');
    if (tabsContainer) tabsContainer.classList.remove('hidden');

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
            case 'ZERO_DERIVATIVE':
                message = error.message;
                break;
            case 'ZERO_SECANT_DENOMINATOR':
                message = error.message;
                break;
            case 'DEGENERATE_MULLER_POINTS':
                message = error.message;
                break;
            case 'ZERO_MULLER_DENOMINATOR':
                message = error.message;
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
        tableContainer.innerHTML = `<h3>Tabla de Iteraciones</h3><p>No disponible debido a un error.</p>`;
    }

    const codeContainer = document.getElementById('tab-code');
    if (codeContainer) {
        codeContainer.innerHTML = `
            <h3>Código GNU Octave</h3>
            <pre><code>% No se pudo generar código porque ocurrió un error en la evaluación.</code></pre>
        `;
    }
};

const showUnimplementedState = () => {
    const emptyState = document.getElementById('empty-state');
    const resultsContainer = document.getElementById('results-container');
    const globalStatusPanel = document.getElementById('global-status-panel');
    const statusBadge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');
    const tabsContainer = document.querySelector('.tabs') as HTMLElement;
    
    if (emptyState && resultsContainer) {
        emptyState.classList.add('hidden');
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
};

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Pestañas
    setupTabs();

    const emptyState = document.getElementById('empty-state');
    const resultsContainer = document.getElementById('results-container');

    // Manejadores de eventos globales
    const onResolve = () => {
        const form = document.getElementById('resolver-form') as HTMLFormElement;
        const formData = new FormData(form);
        const method = formData.get('method') as string;

        if (method !== 'bisection' && method !== 'false-position' && method !== 'fixed-point' && method !== 'newton-raphson' && method !== 'secant' && method !== 'muller') {
            showUnimplementedState();
            return;
        }

        try {
            let input: MethodInput;
            let result: MethodResult;

            if (method === 'bisection' || method === 'false-position') {
                input = {
                    expression: formData.get('fx') as string,
                    a: Number(formData.get('a')),
                    b: Number(formData.get('b')),
                    tolerance: Number(formData.get('tolerance')),
                    maxIterations: Number(formData.get('maxIterations')),
                    errorCriterion: formData.get('errorCriterion') as ErrorCriterion
                } as BracketInput;
                result = method === 'bisection' ? bisection(input as BisectionInput) : falsePosition(input as FalsePositionInput);
            } else if (method === 'fixed-point') {
                input = {
                    expression: formData.get('fx') as string,
                    iterationExpression: formData.get('gx') as string,
                    x0: Number(formData.get('x0')),
                    tolerance: Number(formData.get('tolerance')),
                    maxIterations: Number(formData.get('maxIterations')),
                    errorCriterion: formData.get('errorCriterion') as ErrorCriterion
                } as FixedPointInput;
                result = fixedPoint(input as FixedPointInput);
            } else if (method === 'newton-raphson') {
                input = {
                    expression: formData.get('fx') as string,
                    x0: Number(formData.get('x0')),
                    tolerance: Number(formData.get('tolerance')),
                    maxIterations: Number(formData.get('maxIterations')),
                    errorCriterion: formData.get('errorCriterion') as ErrorCriterion
                } as NewtonRaphsonInput;
                result = newtonRaphson(input as NewtonRaphsonInput);
            } else if (method === 'secant') {
                input = {
                    expression: formData.get('fx') as string,
                    x0: Number(formData.get('x0')),
                    x1: Number(formData.get('x1')),
                    tolerance: Number(formData.get('tolerance')),
                    maxIterations: Number(formData.get('maxIterations')),
                    errorCriterion: formData.get('errorCriterion') as ErrorCriterion
                } as SecantInput;
                result = secant(input as SecantInput);
            } else {
                input = {
                    expression: formData.get('fx') as string,
                    x0: Number(formData.get('x0')),
                    x1: Number(formData.get('x1')),
                    x2: Number(formData.get('x2')),
                    tolerance: Number(formData.get('tolerance')),
                    maxIterations: Number(formData.get('maxIterations')),
                    errorCriterion: formData.get('errorCriterion') as ErrorCriterion
                } as MullerInput;
                result = muller(input as MullerInput);
            }
            
            renderResults(input, result, method);
        } catch (error: any) {
            handleError(error);
        }
    };

    const onClear = () => {
        // Restablece la interfaz a su estado inicial vacío
        if (emptyState && resultsContainer) {
            resultsContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
        }
        clearGraph('plotly-canvas');
        
        const codeContainer = document.getElementById('tab-code');
        if (codeContainer) {
            codeContainer.innerHTML = `
                <h3>Código GNU Octave</h3>
                <pre><code>% Resuelve un ejercicio para generar el código GNU Octave.</code></pre>
            `;
        }
    };

    // Inicializar Formulario
    setupMethodForm(
        'resolver-form', 
        'method-selector', 
        'dynamic-parameters',
        onResolve,
        onClear
    );
});
