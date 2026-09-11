import { CompareRequest, CompareMethodSelection, CompareMethodResult } from '../comparison/types';
import { runComparison } from '../comparison/comparisonService';
import { plotConvergence } from '../graph/convergenceGraph';
import { saveHistoryEntry } from '../storage';
import { ComplexValue } from '../math/complex';
import { ErrorCriterion, NumericalMethod } from '../types/numerical';

const methodNames: Record<string, string> = {
    'bisection': 'Bisección',
    'false-position': 'Regla Falsa',
    'fixed-point': 'Punto Fijo',
    'newton-raphson': 'Newton-Raphson',
    'secant': 'Secante',
    'muller': 'Müller'
};

const methodParams = {
    'bisection': [ { name: 'a', label: 'Límite Inferior (a)' }, { name: 'b', label: 'Límite Superior (b)' } ],
    'false-position': [ { name: 'a', label: 'Límite Inferior (a)' }, { name: 'b', label: 'Límite Superior (b)' } ],
    'fixed-point': [ { name: 'iterationExpression', label: 'Función g(x)' }, { name: 'x0', label: 'Valor inicial x0', type: 'number' } ],
    'newton-raphson': [ { name: 'x0', label: 'Valor inicial x0', type: 'number' } ],
    'secant': [ { name: 'x0', label: 'Valor x0', type: 'number' }, { name: 'x1', label: 'Valor x1', type: 'number' } ],
    'muller': [ { name: 'x0', label: 'Valor x0', type: 'number' }, { name: 'x1', label: 'Valor x1', type: 'number' }, { name: 'x2', label: 'Valor x2', type: 'number' } ]
};

let lastComparisonResults: { request: CompareRequest; results: CompareMethodResult[] } | null = null;

export function setupCompareNavigation(renderResultsCallback: (input: any, result: any, method: string) => void) {
    const navCompare = document.getElementById('nav-compare');
    const viewResolver = document.getElementById('view-resolver');
    const viewHistory = document.getElementById('view-history');
    const viewCompare = document.getElementById('view-compare');
    const navResolver = document.getElementById('nav-resolver');
    const navHistory = document.getElementById('nav-history');

    navCompare?.addEventListener('click', (e) => {
        e.preventDefault();
        navCompare.classList.add('active');
        navResolver?.classList.remove('active');
        navHistory?.classList.remove('active');
        
        viewCompare?.classList.remove('hidden');
        viewResolver?.classList.add('hidden');
        viewHistory?.classList.add('hidden');
    });

    renderMethodCheckboxes();

    const form = document.getElementById('compare-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fd = new FormData(form);
        const selectedMethods = fd.getAll('selectedMethods') as string[];
        
        if (selectedMethods.length < 2) {
            showCompareNotification('Por favor, selecciona al menos 2 métodos para comparar.', true);
            return;
        }

        const common = {
            expression: fd.get('fx') as string,
            errorCriterion: fd.get('errorCriterion') as ErrorCriterion,
            tolerance: Number(fd.get('tolerance')),
            maxIterations: Number(fd.get('maxIterations'))
        };

        const methodsObj: CompareMethodSelection = {};
        for (const m of selectedMethods) {
            const mKey = m as keyof CompareMethodSelection;
            const params = methodParams[mKey];
            const methodInput: any = {};
            
            for (const param of params) {
                const rawVal = fd.get(`${mKey}_${param.name}`);
                const pType = (param as any).type;
                if (pType === 'number' || !pType) {
                    if (param.name === 'iterationExpression') {
                        methodInput[param.name] = rawVal as string;
                    } else {
                        methodInput[param.name] = Number(rawVal);
                    }
                }
            }
            (methodsObj as any)[mKey] = methodInput;
        }

        const req: CompareRequest = { common, methods: methodsObj };
        try {
            const comparison = runComparison(req);
            lastComparisonResults = { request: req, results: comparison.results };
            renderCompareResults(comparison.results, comparison.metrics, req, renderResultsCallback);
        } catch (e: any) {
            showCompareNotification(`Error general en la comparación: ${e.message}`, true);
        }
    });

    const btnExample = document.getElementById('btn-compare-example');
    btnExample?.addEventListener('click', () => {
        loadExample();
    });

    const btnSave = document.getElementById('btn-compare-save');
    btnSave?.addEventListener('click', async () => {
        if (!lastComparisonResults) return;
        
        let savedCount = 0;
        for (const res of lastComparisonResults.results) {
            if (res.status === 'success' && (res.result?.converged || res.result?.stopReason === 'MAX_ITERATIONS')) {
                const entry = {
                    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                    createdAt: new Date().toISOString(),
                    method: res.method as any,
                    input: { ...lastComparisonResults.request.common, ...(lastComparisonResults.request.methods as any)[res.method] } as any,
                    result: res.result as any
                };
                await saveHistoryEntry(entry as any);
                savedCount++;
            }
        }
        showCompareNotification(`Se han guardado ${savedCount} resultados válidos en el historial local.`, false);
    });
}

function showCompareNotification(message: string, isError: boolean) {
    let notif = document.getElementById('compare-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'compare-notification';
        notif.setAttribute('role', 'status');
        notif.setAttribute('aria-live', 'polite');
        const container = document.querySelector('.compare-actions') || document.getElementById('compare-form');
        container?.prepend(notif);
    }
    notif.className = `badge ${isError ? 'badge-error' : 'badge-success'}`;
    notif.textContent = message;
    notif.classList.remove('hidden');
    setTimeout(() => {
        notif?.classList.add('hidden');
    }, 4000);
}

function renderMethodCheckboxes() {
    const container = document.getElementById('compare-methods-grid');
    if (!container) return;
    container.innerHTML = '';

    for (const [key, title] of Object.entries(methodNames)) {
        const card = document.createElement('div');
        card.className = 'compare-method-card';
        
        const header = document.createElement('div');
        header.className = 'compare-method-header';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `chk_${key}`;
        checkbox.name = 'selectedMethods';
        checkbox.value = key;
        
        const label = document.createElement('label');
        label.htmlFor = `chk_${key}`;
        label.textContent = ` ${title}`;
        label.className = 'compare-method-label';

        header.appendChild(checkbox);
        header.appendChild(label);
        card.appendChild(header);

        const paramsContainer = document.createElement('div');
        paramsContainer.id = `params_${key}`;
        paramsContainer.className = 'compare-method-params';
        
        const paramsDef = (methodParams as any)[key] as { name: string, label: string, type?: string }[];
        for (const param of paramsDef) {
            const pGroup = document.createElement('div');
            pGroup.className = 'form-group';
            pGroup.style.marginBottom = '0';
            
            const pLabel = document.createElement('label');
            pLabel.textContent = param.label;
            pLabel.style.fontSize = '0.85rem';
            
            const pInput = document.createElement('input');
            pInput.type = 'text';
            pInput.name = `${key}_${param.name}`;
            pInput.className = 'compare-input';
            
            pGroup.appendChild(pLabel);
            pGroup.appendChild(pInput);
            paramsContainer.appendChild(pGroup);
        }

        checkbox.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            if (isChecked) {
                paramsContainer.classList.add('active');
            } else {
                paramsContainer.classList.remove('active');
            }
            paramsContainer.querySelectorAll('input').forEach(inp => {
                inp.required = isChecked;
            });
        });

        card.appendChild(paramsContainer);
        container.appendChild(card);
    }
}

function loadExample() {
    const form = document.getElementById('compare-form') as HTMLFormElement;
    if (!form) return;
    
    form.fx.value = 'x^3 - x - 1';
    form.errorCriterion.value = 'absolute';
    form.tolerance.value = '0.0005';
    form.maxIterations.value = '100';

    const checkAndFill = (method: string, values: Record<string, string>) => {
        const chk = document.getElementById(`chk_${method}`) as HTMLInputElement;
        if (chk) {
            if (!chk.checked) chk.click();
            for (const [k, v] of Object.entries(values)) {
                const inp = form.elements.namedItem(`${method}_${k}`) as HTMLInputElement;
                if (inp) inp.value = v;
            }
        }
    };

    document.querySelectorAll('input[name="selectedMethods"]').forEach((chk: any) => {
        if (chk.checked) chk.click();
    });

    checkAndFill('bisection', { a: '1', b: '2' });
    checkAndFill('false-position', { a: '1', b: '2' });
    checkAndFill('newton-raphson', { x0: '1.5' });
    checkAndFill('secant', { x0: '1', x1: '2' });
    checkAndFill('muller', { x0: '1', x1: '1.5', x2: '2' });
}

function formatRoot(root: number | ComplexValue | undefined): string {
    if (root === undefined) return '-';
    if (typeof root === 'number') return root.toFixed(8);
    
    if (Math.abs(root.im) < 1e-12) return root.re.toFixed(8);
    const sign = root.im >= 0 ? '+' : '-';
    return `${root.re.toFixed(8)} ${sign} ${Math.abs(root.im).toFixed(8)}i`;
}

function renderCompareResults(
    results: CompareMethodResult[], 
    metrics: any, 
    req: CompareRequest, 
    renderResultsCallback: (input: any, result: any, method: string) => void
) {
    const container = document.getElementById('compare-results-container');
    const tbody = document.querySelector('#compare-table tbody');
    const metricsContainer = document.getElementById('compare-metrics');
    
    if (!container || !tbody || !metricsContainer) return;
    
    container.classList.remove('hidden');
    
    tbody.innerHTML = '';
    results.forEach(res => {
        const tr = document.createElement('tr');
        
        const tdMethod = document.createElement('td');
        tdMethod.textContent = methodNames[res.method];
        tdMethod.style.fontWeight = '600';
        
        const tdRoot = document.createElement('td');
        const tdIter = document.createElement('td');
        const tdError = document.createElement('td');
        const tdRes = document.createElement('td');
        const tdStatus = document.createElement('td');
        const tdAction = document.createElement('td');
        
        if (res.status === 'success' && res.result) {
            tdRoot.textContent = formatRoot(res.result.root);
            tdIter.textContent = res.result.iterations.length.toString();
            tdError.textContent = res.result.finalError !== null ? res.result.finalError.toExponential(4) : '-';
            tdRes.textContent = res.result.residual.toExponential(4);
            
            if (res.result.converged) {
                tdStatus.innerHTML = `<span style="color: var(--color-success); font-weight: 600;">Convergió</span>`;
            } else if (res.result.stopReason === 'MAX_ITERATIONS') {
                tdStatus.innerHTML = `<span style="color: var(--color-warning); font-weight: 600;">Max Iteraciones</span>`;
            } else {
                tdStatus.textContent = 'Finalizado';
            }
            
            const btn = document.createElement('button');
            btn.className = 'btn-secondary';
            btn.style.padding = '0.25rem 0.75rem';
            btn.style.fontSize = '0.85rem';
            btn.textContent = 'Ver detalle';
            btn.onclick = () => {
                document.getElementById('nav-resolver')?.click();
                const specInput = (req.methods as any)[res.method];
                const fullInput = { ...req.common, ...specInput };
                renderResultsCallback(fullInput, res.result, res.method);
            };
            tdAction.appendChild(btn);
            
        } else {
            tdRoot.textContent = '-';
            tdIter.textContent = '-';
            tdError.textContent = '-';
            tdRes.textContent = '-';
            tdStatus.innerHTML = `<span style="color: var(--color-error); font-weight: 600;">Error: ${res.errorMessage}</span>`;
            tdAction.textContent = '-';
        }
        
        tr.appendChild(tdMethod);
        tr.appendChild(tdRoot);
        tr.appendChild(tdIter);
        tr.appendChild(tdError);
        tr.appendChild(tdRes);
        tr.appendChild(tdStatus);
        tr.appendChild(tdAction);
        
        tbody.appendChild(tr);
    });

    metricsContainer.innerHTML = '';
    const addMetric = (title: string, methodKey: NumericalMethod | null, desc: string) => {
        const div = document.createElement('div');
        div.className = 'compare-metric-card';
        
        const t = document.createElement('div');
        t.className = 'compare-metric-title';
        t.textContent = title;
        
        const v = document.createElement('div');
        v.className = 'compare-metric-value';
        v.textContent = methodKey ? methodNames[methodKey] : 'N/A';
        
        const d = document.createElement('div');
        d.className = 'compare-metric-desc';
        d.textContent = desc;

        div.appendChild(t);
        div.appendChild(v);
        div.appendChild(d);
        metricsContainer.appendChild(div);
    };

    addMetric('Menos iteraciones', metrics.leastIterationsMethod, 'Alcanzó el objetivo en menos pasos');
    addMetric('Menor error final', metrics.lowestErrorMethod, 'Aproximación más cercana según criterio');
    addMetric('Menor residuo', metrics.lowestResidualMethod, 'Evaluación |f(x)| más cercana a 0');

    plotConvergence('compare-plotly-canvas', results, req.common.errorCriterion);
}
