import { registerSW } from 'virtual:pwa-register';
import { clearGraph, setupGraphToolbars } from './graph';
import { MethodId } from './types/numerical';
import { currentFields, setupMethodForm } from './ui/methodForm';
import { isMethodId, METHOD_REGISTRY } from './ui/methodRegistry';
import { clearResults, handleError, renderResults } from './ui/renderResults';
import { setupTabs } from './ui/tabs';
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/compare.css';
import './styles/responsive.css';

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

    import('./ui/history').then(({ setupHistoryNavigation }) => {
        setupHistoryNavigation((input, result, method) => {
            renderResults(input, result, method as MethodId);
        });
    });
    import('./ui/compare').then(({ setupCompareNavigation }) => {
        setupCompareNavigation();
    });
});
