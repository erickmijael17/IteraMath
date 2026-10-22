import { MethodId } from '../types/numerical';
import { EXAMPLES, ExamplePreset, METHOD_HELP } from './examples';
import { isMethodId } from './methodRegistry';

const DIRECT: MethodId[] = ['gauss', 'gauss-jordan', 'lu', 'cholesky', 'inverse', 'cramer'];
const ITERATIVE: MethodId[] = ['jacobi', 'gauss-seidel'];

function field(name: string, label: string, value = '', type = 'text'): string {
    return `<div class="form-group"><label>${label}</label><input name="${name}" type="${type}" step="any" value="${value}" /></div>`;
}

function systemMarkup(method: MethodId, preset: ExamplePreset): string {
    const size = Number(preset.fields.size ?? 3);
    const max = method === 'cramer' ? 4 : 6;
    const showPivot = method === 'gauss' || method === 'gauss-jordan' || method === 'lu';
    const showX0 = ITERATIVE.includes(method);
    const cells: string[] = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) cells.push(`<input name="a_${i}_${j}" type="number" step="any" value="${preset.fields[`a_${i}_${j}`] ?? 0}" aria-label="a ${i + 1} ${j + 1}" />`);
    }
    const bCells = Array.from({ length: size }, (_, i) => `<input name="b_${i}" type="number" step="any" value="${preset.fields[`b_${i}`] ?? 0}" aria-label="b ${i + 1}" />`).join('');
    const x0 = showX0
        ? `<p class="etiqueta">Aproximación inicial</p><div class="matrix-grid" style="--cols:${size}">${Array.from({ length: size }, (_, i) => `<input name="x0_${i}" type="number" step="any" value="${preset.fields[`x0_${i}`] ?? 0}" />`).join('')}</div>`
        : '';
    const stop = showX0 ? stopMarkup(preset) : '';
    return `
        ${field('size', 'Tamaño', String(size), 'number').replace('step="any"', `min="2" max="${max}" step="1"`)}
        <p class="etiqueta">Matriz A</p>
        <div class="matrix-grid" style="--cols:${size}">${cells.join('')}</div>
        <p class="etiqueta">Vector b</p>
        <div class="matrix-grid" style="--cols:${size}">${bCells}</div>
        ${showPivot ? `<label class="check"><input type="checkbox" name="pivot" value="1" ${preset.fields.pivot === '0' ? '' : 'checked'} /> Usar pivoteo parcial</label>` : ''}
        ${x0}
        ${stop}
    `;
}

function stopMarkup(preset: ExamplePreset): string {
    return `
        <div class="form-group-row">
            ${field('tolerance', 'Tolerancia', preset.fields.tolerance ?? '1e-6')}
            ${field('maxIterations', 'Iteraciones', preset.fields.maxIterations ?? '25', 'number')}
        </div>
        <div class="form-group">
            <label>Norma</label>
            <select name="norm">
                <option value="inf" ${preset.fields.norm === '1' || preset.fields.norm === '2' ? '' : 'selected'}>Infinito</option>
                <option value="1" ${preset.fields.norm === '1' ? 'selected' : ''}>Norma 1</option>
                <option value="2" ${preset.fields.norm === '2' ? 'selected' : ''}>Euclidiana</option>
            </select>
        </div>
    `;
}

function equationMarkup(preset: ExamplePreset, kind: 'f' | 'g'): string {
    const count = Number(preset.fields.eqCount ?? 2);
    const rows = Array.from({ length: count }, (_, index) => `
        <div class="form-group">
            <label>${kind}${index + 1}(${['x', 'y', 'z', 'u', 'v', 'w'].slice(0, count).join(', ')})</label>
            <input name="eq_${index}" type="text" value="${preset.fields[`eq_${index}`] ?? ''}" spellcheck="false" />
        </div>
        ${field(`x0_${index}`, `Valor inicial ${['x', 'y', 'z', 'u', 'v', 'w'][index]}`, preset.fields[`x0_${index}`] ?? '0', 'number')}
    `).join('');
    return `
        <input type="hidden" name="eqCount" value="${count}" />
        ${rows}
        <div class="inline-actions"><button type="button" id="btn-add-eq" class="btn-secondary">Agregar ecuación</button></div>
        ${stopMarkup(preset)}
    `;
}

function pointMarkup(preset: ExamplePreset, mode: 'lagrange' | 'newton' | 'poly'): string {
    const rows = Number(preset.fields.rows ?? 2);
    const body = Array.from({ length: rows }, (_, index) => `
        <tr>
            <td><input name="px_${index}" type="number" step="any" value="${preset.fields[`px_${index}`] ?? ''}" /></td>
            <td><input name="py_${index}" type="number" step="any" value="${preset.fields[`py_${index}`] ?? ''}" /></td>
        </tr>
    `).join('');
    const extra = mode === 'poly'
        ? field('degree', 'Grado', preset.fields.degree ?? '1', 'number')
        : `
            ${field('at', 'Aproximar en x', preset.fields.at ?? '0', 'number')}
            ${field('degree', 'Grado', preset.fields.degree ?? '1', 'number')}
            ${mode === 'lagrange' ? `<div class="form-group"><label>Nodos</label><select name="mode"><option value="apropiados" ${preset.fields.mode === 'todos' ? '' : 'selected'}>Los más cercanos a x</option><option value="todos" ${preset.fields.mode === 'todos' ? 'selected' : ''}>Todos los datos</option></select></div>${field('expression', 'f(x) para la cota, si la piden', preset.fields.expression ?? '')}` : ''}
            ${mode === 'newton' ? `<div class="form-group"><label>Forma</label><select name="form"><option value="auto" ${preset.fields.form && preset.fields.form !== 'auto' ? '' : 'selected'}>La más apropiada</option><option value="progresiva" ${preset.fields.form === 'progresiva' ? 'selected' : ''}>Progresiva</option><option value="regresiva" ${preset.fields.form === 'regresiva' ? 'selected' : ''}>Regresiva</option></select></div>` : ''}
        `;
    return `
        <input type="hidden" name="rows" value="${rows}" />
        <table class="point-table"><thead><tr><th>x</th><th>y</th></tr></thead><tbody>${body}</tbody></table>
        <div class="inline-actions"><button type="button" id="btn-add-row" class="btn-secondary">Agregar fila</button></div>
        ${extra}
    `;
}

function multipleMarkup(preset: ExamplePreset): string {
    const rows = Number(preset.fields.rows ?? 4);
    const body = Array.from({ length: rows }, (_, index) => `
        <tr>
            <td><input name="x1_${index}" type="number" step="any" value="${preset.fields[`x1_${index}`] ?? ''}" /></td>
            <td><input name="x2_${index}" type="number" step="any" value="${preset.fields[`x2_${index}`] ?? ''}" /></td>
            <td><input name="y_${index}" type="number" step="any" value="${preset.fields[`y_${index}`] ?? ''}" /></td>
        </tr>
    `).join('');
    return `
        <input type="hidden" name="rows" value="${rows}" />
        <table class="point-table"><thead><tr><th>x1</th><th>x2</th><th>y</th></tr></thead><tbody>${body}</tbody></table>
        <div class="inline-actions"><button type="button" id="btn-add-row" class="btn-secondary">Agregar fila</button></div>
    `;
}

function markup(method: MethodId, preset: ExamplePreset): string {
    if (DIRECT.includes(method) || ITERATIVE.includes(method)) return systemMarkup(method, preset);
    if (method === 'newton-system') return equationMarkup(preset, 'f');
    if (method === 'fixed-point-system') return equationMarkup(preset, 'g');
    if (method === 'lagrange') return pointMarkup(preset, 'lagrange');
    if (method === 'newton-divided') return pointMarkup(preset, 'newton');
    if (method === 'regression-poly') return pointMarkup(preset, 'poly');
    return multipleMarkup(preset);
}

function readFields(container: HTMLElement): Record<string, string> {
    const fields: Record<string, string> = {};
    container.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name], select[name]').forEach((element) => {
        if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            fields[element.name] = element.checked ? '1' : '0';
        } else {
            fields[element.name] = element.value;
        }
    });
    return fields;
}

export function setupMethodForm(onResolve: () => void, onClear: () => void): void {
    const form = document.getElementById('resolver-form') as HTMLFormElement | null;
    const selector = document.getElementById('method-selector') as HTMLSelectElement | null;
    const dynamic = document.getElementById('dynamic-parameters');
    const examples = document.getElementById('example-list');
    const help = document.getElementById('method-help');
    const clear = document.getElementById('btn-clear');
    if (!form || !selector || !dynamic || !examples || !help) return;

    let exampleIndex = 0;

    const paint = (method: MethodId) => {
        const presets = EXAMPLES[method];
        exampleIndex = Math.min(exampleIndex, presets.length - 1);
        const preset = presets[exampleIndex];
        help.textContent = METHOD_HELP[method];
        examples.innerHTML = presets.map((item, index) =>
            `<button type="button" class="btn-secondary ${index === exampleIndex ? 'active' : ''}" data-example="${index}">${item.name}</button>`
        ).join('');
        dynamic.innerHTML = markup(method, preset);
        bindLocal(method);
    };

    const bindLocal = (method: MethodId) => {
        dynamic.querySelector<HTMLInputElement>('input[name="size"]')?.addEventListener('change', () => {
            const current = readFields(dynamic);
            const max = method === 'cramer' ? 4 : 6;
            const size = Math.min(max, Math.max(2, Number(current.size) || 2));
            current.size = String(size);
            const preset = { name: 'actual', fields: current };
            dynamic.innerHTML = systemMarkup(method, preset);
            bindLocal(method);
        });
        dynamic.querySelector('#btn-add-row')?.addEventListener('click', () => {
            const current = readFields(dynamic);
            const rows = Number(current.rows ?? 0) + 1;
            current.rows = String(rows);
            dynamic.innerHTML = method === 'regression-multiple' ? multipleMarkup({ name: 'actual', fields: current }) : pointMarkup({ name: 'actual', fields: current }, method === 'lagrange' ? 'lagrange' : method === 'newton-divided' ? 'newton' : 'poly');
            bindLocal(method);
        });
        dynamic.querySelector('#btn-add-eq')?.addEventListener('click', () => {
            const current = readFields(dynamic);
            const count = Math.min(6, Number(current.eqCount ?? 2) + 1);
            current.eqCount = String(count);
            dynamic.innerHTML = equationMarkup({ name: 'actual', fields: current }, method === 'fixed-point-system' ? 'g' : 'f');
            bindLocal(method);
        });
    };

    paint(selector.value as MethodId);

    selector.addEventListener('change', () => {
        if (!isMethodId(selector.value)) return;
        exampleIndex = 0;
        paint(selector.value);
        onClear();
    });

    examples.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest('button[data-example]') as HTMLButtonElement | null;
        if (!button || !isMethodId(selector.value)) return;
        exampleIndex = Number(button.dataset.example ?? 0);
        paint(selector.value);
        onClear();
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        onResolve();
    });

    clear?.addEventListener('click', () => {
        if (!isMethodId(selector.value)) return;
        exampleIndex = 0;
        paint(selector.value);
        onClear();
    });
}

export function currentFields(): Record<string, string> {
    const form = document.getElementById('resolver-form');
    if (!form) return {};
    return readFields(form);
}
