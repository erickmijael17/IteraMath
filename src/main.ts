import { registerSW } from 'virtual:pwa-register';
import { clearGraph, setupGraphToolbars } from './graficas';
import { MethodId } from './tipos/numerical';
import { currentFields, setupMethodForm } from './interfaz/methodForm';
import { isMethodId, METHOD_REGISTRY } from './interfaz/methodRegistry';
import { clearResults, handleError, renderResults } from './interfaz/renderResults';
import { setupTabs } from './interfaz/tabs';
import './estilos/variables.css';
import './estilos/base.css';
import './estilos/layout.css';
import './estilos/components.css';
import './estilos/compare.css';
import './estilos/responsive.css';

const registrations = 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistrations() : Promise.resolve([]);
registrations.then((installed) => Promise.all(installed.map((registration) => registration.unregister()))).catch(() => undefined);
registerSW({ onNeedRefresh() {}, onOfflineReady() {} });

window.addEventListener('online', () => {
    document.getElementById('offline-indicator')?.classList.add('hidden');
});
window.addEventListener('offline', () => {
    document.getElementById('offline-indicator')?.classList.remove('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupGraphToolbars();

    const resolve = () => {
        const form = document.getElementById('resolver-form') as HTMLFormElement | null;
        const selector = document.getElementById('method-selector') as HTMLSelectElement | null;
        if (!form || !selector || !isMethodId(selector.value)) return;
        try {
            const meta = METHOD_REGISTRY[selector.value];
            const input = meta.buildInput(new FormData(form));
            input.formValues = currentFields();
            renderResults(input, meta.solve(input), selector.value);
        } catch (error) {
            handleError(error);
        }
    };

    setupMethodForm(resolve, () => {
        clearResults();
        clearGraph('plotly-canvas');
    });

    import('./interfaz/history').then(({ setupHistoryNavigation }) => {
        setupHistoryNavigation((input, result, method) => {
            renderResults(input, result, method as MethodId);
        });
    });
    import('./interfaz/compare').then(({ setupCompareNavigation }) => {
        setupCompareNavigation();
    });
});
