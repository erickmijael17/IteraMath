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
                            <input type="number" step="any" id="input-a" name="a" required />
                        </div>
                        <div class="form-group">
                            <label for="input-b">Límite b</label>
                            <input type="number" step="any" id="input-b" name="b" required />
                        </div>
                    </div>
                `;
                break;
            case 'fixed-point':
                html = `
                    <div class="form-group">
                        <label for="input-gx">Función g(x)</label>
                        <input type="text" id="input-gx" name="gx" required />
                    </div>
                    <div class="form-group">
                        <label for="input-x0">Punto Inicial x0</label>
                        <input type="number" step="any" id="input-x0" name="x0" required />
                    </div>
                `;
                break;
            case 'newton-raphson':
                html = `
                    <div class="form-group">
                        <label for="input-x0">Punto Inicial x0</label>
                        <input type="number" step="any" id="input-x0" name="x0" required />
                    </div>
                `;
                break;
            case 'secant':
                html = `
                    <div class="form-group-row">
                        <div class="form-group">
                            <label for="input-x0">Punto x0</label>
                            <input type="number" step="any" id="input-x0" name="x0" required />
                        </div>
                        <div class="form-group">
                            <label for="input-x1">Punto x1</label>
                            <input type="number" step="any" id="input-x1" name="x1" required />
                        </div>
                    </div>
                `;
                break;
            case 'muller':
                html = `
                    <div class="form-group-row">
                        <div class="form-group">
                            <label for="input-x0">x0</label>
                            <input type="number" step="any" id="input-x0" name="x0" required />
                        </div>
                        <div class="form-group">
                            <label for="input-x1">x1</label>
                            <input type="number" step="any" id="input-x1" name="x1" required />
                        </div>
                        <div class="form-group">
                            <label for="input-x2">x2</label>
                            <input type="number" step="any" id="input-x2" name="x2" required />
                        </div>
                    </div>
                `;
                break;
        }
        
        dynamicContainer.innerHTML = html;
    };

    // Initial render
    renderDynamicFields(selector.value as NumericalMethod);

    // Render on change
    selector.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        renderDynamicFields(target.value as NumericalMethod);
    });

    // Handle submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (form.checkValidity()) {
            onResolve();
        } else {
            form.reportValidity();
        }
    });

    // Handle clear
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            form.reset();
            renderDynamicFields(selector.value as NumericalMethod);
            onClear();
        });
    }
}
