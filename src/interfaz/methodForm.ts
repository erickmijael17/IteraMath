import { MathError } from '../matematicas/errors';
import { MethodId } from '../tipos/numerical';
import { EXAMPLES, ExamplePreset, METHOD_HELP } from './examples';
import { isMethodId, METHOD_REGISTRY } from './methodRegistry';

const DIRECT: MethodId[] = ['gauss', 'gauss-jordan', 'lu', 'cholesky', 'inverse', 'cramer'];
const ITERATIVE: MethodId[] = ['jacobi', 'gauss-seidel'];

function field(name: string, label: string, value = ''): string {
    return `<div class="form-group"><label>${label}</label><input name="${name}" type="text" inputmode="decimal" autocomplete="off" value="${value}" /></div>`;
}

function dato(name: string, value: string | number, label: string): string {
    return `<input name="${name}" type="text" inputmode="decimal" autocomplete="off" value="${value}" aria-label="${label}" />`;
}

function systemMarkup(method: MethodId, preset: ExamplePreset): string {
    const size = Number(preset.fields.size ?? 3);
    const max = method === 'cramer' ? 4 : 6;
    const showPivot = method === 'gauss' || method === 'gauss-jordan' || method === 'lu';
    const showX0 = ITERATIVE.includes(method);
    const cells: string[] = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) cells.push(dato(`a_${i}_${j}`, preset.fields[`a_${i}_${j}`] ?? 0, `a ${i + 1} ${j + 1}`));
    }
    const bCells = Array.from({ length: size }, (_, i) => dato(`b_${i}`, preset.fields[`b_${i}`] ?? 0, `b ${i + 1}`)).join('');
    const x0 = showX0
        ? `<p class="etiqueta">Aproximación inicial</p><div class="matrix-grid" style="--cols:${size}">${Array.from({ length: size }, (_, i) => dato(`x0_${i}`, preset.fields[`x0_${i}`] ?? 0, `x0 ${i + 1}`)).join('')}</div>`
        : '';
    const stop = showX0 ? stopMarkup(preset) : '';
    return `
        ${field('size', `Tamaño, de 2 a ${max}`, String(size))}
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
            ${field('maxIterations', 'Iteraciones', preset.fields.maxIterations ?? '25')}
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
        ${field(`x0_${index}`, `Valor inicial ${['x', 'y', 'z', 'u', 'v', 'w'][index]}`, preset.fields[`x0_${index}`] ?? '0')}
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
            <td>${dato(`px_${index}`, preset.fields[`px_${index}`] ?? '', `x ${index + 1}`)}</td>
            <td>${dato(`py_${index}`, preset.fields[`py_${index}`] ?? '', `y ${index + 1}`)}</td>
        </tr>
    `).join('');
    const extra = mode === 'poly'
        ? `${field('degree', 'Grado del polinomio', preset.fields.degree ?? '1')}${field('at', 'Aproximar en x, si lo piden', preset.fields.at ?? '')}`
        : `
            ${field('at', 'Aproximar en x', preset.fields.at ?? '0')}
            ${field('degree', 'Grado', preset.fields.degree ?? '1')}
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
            <td>${dato(`x1_${index}`, preset.fields[`x1_${index}`] ?? '', `x1 ${index + 1}`)}</td>
            <td>${dato(`x2_${index}`, preset.fields[`x2_${index}`] ?? '', `x2 ${index + 1}`)}</td>
            <td>${dato(`y_${index}`, preset.fields[`y_${index}`] ?? '', `y ${index + 1}`)}</td>
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

const VISIBLE_METHODS: { group: string; id: MethodId; label: string }[] = [
    { group: 'Sistemas de ecuaciones', id: 'cramer', label: 'Cramer' },
    { group: 'Sistemas de ecuaciones', id: 'gauss', label: 'Eliminación gaussiana' },
    { group: 'Interpolación', id: 'newton-divided', label: 'Interpolación de Newton' },
    { group: 'Ajuste de curvas', id: 'regression-poly', label: 'Regresión polinomial' }
];

function showOnlyVisibleMethods(selector: HTMLSelectElement): void {
    const current = selector.value;
    const groups = new Map<string, string[]>();
    VISIBLE_METHODS.forEach((method) => {
        const options = groups.get(method.group) ?? [];
        options.push(`<option value="${method.id}">${method.label}</option>`);
        groups.set(method.group, options);
    });
    selector.replaceChildren();
    groups.forEach((options, label) => {
        const group = document.createElement('optgroup');
        group.label = label;
        group.innerHTML = options.join('');
        selector.appendChild(group);
    });
    const allowed = VISIBLE_METHODS.map((method) => method.id);
    selector.value = allowed.includes(current as MethodId) ? current : allowed[0];
}

export function setupMethodForm(onResolve: () => void, onClear: () => void): void {
    const form = document.getElementById('resolver-form') as HTMLFormElement | null;
    const selector = document.getElementById('method-selector') as HTMLSelectElement | null;
    const dynamic = document.getElementById('dynamic-parameters');
    const examples = document.getElementById('example-list');
    const help = document.getElementById('method-help');
    const clear = document.getElementById('btn-clear');
    if (!form || !selector || !dynamic || !examples || !help) return;

    showOnlyVisibleMethods(selector);

    let exampleIndex = 0;

    const aviso = document.getElementById('aviso-datos');
    const resolver = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    const campoAMedias = (): boolean => {
        return [...form.querySelectorAll<HTMLInputElement>('input[type="text"]')].some((input) => {
            const value = input.value.trim();
            if (value === '') return input.name !== 'at' || selector.value !== 'regression-poly';
            const parsed = Number(value.replace(',', '.'));
            return !Number.isFinite(parsed) && /^-?\d*[,.]?\d*$/.test(value);
        });
    };

    const refrescarAviso = () => {
        if (!aviso || !isMethodId(selector.value)) return;
        if (campoAMedias()) {
            aviso.textContent = '';
            aviso.classList.add('hidden');
            if (resolver) resolver.disabled = false;
            return;
        }
        try {
            const meta = METHOD_REGISTRY[selector.value];
            meta.solve(meta.buildInput(new FormData(form)));
            aviso.textContent = '';
            aviso.classList.add('hidden');
            if (resolver) resolver.disabled = false;
        } catch (error) {
            const message = error instanceof MathError
                ? error.message
                : 'No se puede resolver con estos datos.';
            aviso.textContent = message;
            aviso.classList.remove('hidden');
            if (resolver) resolver.disabled = true;
        }
    };

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
        refrescarAviso();
    };

    const bindLocal = (method: MethodId) => {
        dynamic.querySelector<HTMLInputElement>('input[name="size"]')?.addEventListener('change', () => {
            const current = readFields(dynamic);
            const max = method === 'cramer' ? 4 : 6;
            const size = Math.min(max, Math.max(2, Number(String(current.size).replace(',', '.')) || 2));
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

    form.addEventListener('input', () => refrescarAviso());
    form.addEventListener('change', () => refrescarAviso());

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        refrescarAviso();
        if (resolver?.disabled) return;
        onResolve();
    });

    clear?.addEventListener('click', () => {
        if (!isMethodId(selector.value)) return;
        dynamic.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
            if (input.type === 'hidden') return;
            if (input.type === 'checkbox') {
                input.checked = false;
                return;
            }
            input.value = '0';
        });
        examples.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
        refrescarAviso();
        onClear();
    });
}

export function currentFields(): Record<string, string> {
    const form = document.getElementById('resolver-form');
    if (!form) return {};
    return readFields(form);
}
