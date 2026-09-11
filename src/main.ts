import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {},
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

window.addEventListener('online', () => {
    document.getElementById('offline-indicator')?.classList.add('hidden');
});
window.addEventListener('offline', () => {
    document.getElementById('offline-indicator')?.classList.remove('hidden');
});
if (!navigator.onLine) {
    document.getElementById('offline-indicator')?.classList.remove('hidden');
}

import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/compare.css';
import './styles/responsive.css';

import { NumericalMethod } from './types/numerical';
import { setupMethodForm } from './ui/methodForm';
import { setupTabs } from './ui/tabs';
import { setupFunctionInput } from './ui/functionInput';
import { setupStoppingCriteria } from './ui/stoppingCriteria';
import { renderResults, handleError, showUnimplementedState } from './ui/renderResults';
import { METHOD_REGISTRY, isNumericalMethod } from './ui/methodRegistry';
import { clearGraph, setupGraphToolbars } from './graph';

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupStoppingCriteria();
    setupGraphToolbars();

    const methodSelector = document.getElementById('method-selector') as HTMLSelectElement;

    const liveInput = setupFunctionInput({
        getMethod: () => methodSelector.value as NumericalMethod
    });

    const onResolve = () => {
        const form = document.getElementById('resolver-form') as HTMLFormElement;
        const formData = new FormData(form);
        const method = formData.get('method') as string;

        if (!isNumericalMethod(method)) {
            showUnimplementedState();
            return;
        }

        if (!liveInput.isValid()) {
            liveInput.refresh();
            if (!liveInput.isValid()) {
                document.getElementById('input-fx')?.focus();
                return;
            }
        }

        try {
            const meta = METHOD_REGISTRY[method];
            const input = meta.buildInput(formData);
            const result = meta.solve(input);
            renderResults(input, result, method);
        } catch (error: any) {
            handleError(error);
        }
    };

    const onClear = () => {
        const previewSection = document.getElementById('preview-section');
        const resultsContainer = document.getElementById('results-container');
        if (previewSection && resultsContainer) {
            resultsContainer.classList.add('hidden');
            previewSection.classList.remove('hidden');
        }
        clearGraph('plotly-canvas');

        const codeContainer = document.getElementById('tab-code');
        if (codeContainer) {
            codeContainer.innerHTML = `
                <h3>Código GNU Octave</h3>
                <pre><code>% Resuelve un ejercicio para generar el código GNU Octave.</code></pre>
            `;
        }

        liveInput.refresh();
    };

    setupMethodForm(
        'resolver-form',
        'method-selector',
        'dynamic-parameters',
        onResolve,
        onClear
    );

    import('./ui/history').then(({ setupHistoryNavigation }) => {
        setupHistoryNavigation((input, result, method) => {
            renderResults(input, result, method);
        });
    });

    import('./ui/compare').then(({ setupCompareNavigation }) => {
        setupCompareNavigation((input, result, method) => {
            renderResults(input, result, method);
        });
    });
});
