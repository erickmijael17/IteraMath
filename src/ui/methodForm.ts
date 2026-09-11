import { NumericalMethod } from '../types/numerical';

export function setupMethodForm(
    formId: string,
    selectorId: string,
    dynamicContainerId: string,
    onResolve: () => void,
    onClear: () => void
) {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const selector = document.getElementById(selectorId) as HTMLSelectElement | null;
    const dynamicContainer = document.getElementById(dynamicContainerId);
    const btnClear = document.getElementById('btn-clear');

    if (!form || !selector || !dynamicContainer) {
        console.error("Method form elements not found.");
        return;
    }

    const renderDynamicFields = (method: NumericalMethod) => {
        let html = '';

        switch (method) {
            case 'bisection':
            case 'false-position':
                html = `
                    <div class="form-group-row">
                        <div class="form-group">
                            <label for="input-a">Límite a</label>
                            <input type="number" step="any" id="input-a" name="a" placeholder="p. ej. 1" required />
                        </div>
                        <div class="form-group">
                            <label for="input-b">Límite b</label>
                            <input type="number" step="any" id="input-b" name="b" placeholder="p. ej. 2" required />
                        </div>
                    </div>
                `;
                break;
            case 'fixed-point':
                html = `
                    <div class="form-group">
                        <div class="field-header">
                            <label for="input-gx">Función g(x)</label>
                            <span class="field-badge-hint">Iteración xₖ₊₁ = g(xₖ)</span>
                        </div>
                        <input type="text" id="input-gx" name="gx" required autocomplete="off" placeholder="p. ej. (x + 2)^(1/3)" />
                        <div id="gx-variations" class="gx-variations"></div>
                    </div>
                    <div class="form-group">
                        <label for="input-x0">Punto Inicial x0</label>
                        <input type="number" step="any" id="input-x0" name="x0" required placeholder="p. ej. 1.5" />
                    </div>
                `;
                break;
            case 'newton-raphson':
                html = `
                    <div class="form-group">
                        <label for="input-x0">Punto Inicial x0</label>
                        <input type="number" step="any" id="input-x0" name="x0" placeholder="p. ej. 1.5" required />
                    </div>
                `;
                break;
            case 'secant':
                html = `
                    <div class="form-group-row">
                        <div class="form-group">
                            <label for="input-x0">Punto x0</label>
                            <input type="number" step="any" id="input-x0" name="x0" placeholder="p. ej. 1.0" required />
                        </div>
                        <div class="form-group">
                            <label for="input-x1">Punto x1</label>
                            <input type="number" step="any" id="input-x1" name="x1" placeholder="p. ej. 2.0" required />
                        </div>
                    </div>
                `;
                break;
            case 'muller':
                html = `
                    <div class="form-group-row">
                        <div class="form-group">
                            <label for="input-x0">x0</label>
                            <input type="number" step="any" id="input-x0" name="x0" placeholder="p. ej. 0" required />
                        </div>
                        <div class="form-group">
                            <label for="input-x1">x1</label>
                            <input type="number" step="any" id="input-x1" name="x1" placeholder="p. ej. 1" required />
                        </div>
                        <div class="form-group">
                            <label for="input-x2">x2</label>
                            <input type="number" step="any" id="input-x2" name="x2" placeholder="p. ej. 2" required />
                        </div>
                    </div>
                `;
                break;
        }

        dynamicContainer.innerHTML = html;
    };

    renderDynamicFields(selector.value as NumericalMethod);

    selector.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        renderDynamicFields(target.value as NumericalMethod);
        onClear();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (form.checkValidity()) {
            onResolve();
        } else {
            form.reportValidity();
        }
    });

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            form.reset();
            renderDynamicFields(selector.value as NumericalMethod);
            onClear();
        });
    }
}
