import { getHistoryEntries, deleteHistoryEntry, clearHistory } from '../almacenamiento';
import { HistoryEntry } from '../tipos/history';
import { MethodInput, SolveResult } from '../tipos/numerical';
import { METHOD_REGISTRY } from './methodRegistry';

export function setupHistoryNavigation(
    renderResultsCallback: (input: MethodInput, result: SolveResult, method: string) => void
): void {
    const navResolver = document.getElementById('nav-resolver');
    const navHistory = document.getElementById('nav-history');
    const navCompare = document.getElementById('nav-compare');
    const viewResolver = document.getElementById('view-resolver');
    const viewHistory = document.getElementById('view-history');
    const viewCompare = document.getElementById('view-compare');
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');

    const show = (target: 'resolver' | 'history' | 'compare') => {
        navResolver?.classList.toggle('active', target === 'resolver');
        navHistory?.classList.toggle('active', target === 'history');
        navCompare?.classList.toggle('active', target === 'compare');
        viewResolver?.classList.toggle('hidden', target !== 'resolver');
        viewHistory?.classList.toggle('hidden', target !== 'history');
        viewCompare?.classList.toggle('hidden', target !== 'compare');
    };

    navResolver?.addEventListener('click', (event) => {
        event.preventDefault();
        show('resolver');
    });
    navCompare?.addEventListener('click', (event) => {
        event.preventDefault();
        show('compare');
    });
    navHistory?.addEventListener('click', async (event) => {
        event.preventDefault();
        show('history');
        await loadHistory();
    });
    btnClearHistory?.addEventListener('click', () => {
        showConfirmModal('¿Limpiar todo el historial?', 'Esta acción no se puede deshacer.', async () => {
            await clearHistory();
            await loadHistory();
        });
    });

    async function loadHistory() {
        if (!historyList) return;
        historyList.innerHTML = '<p>Cargando...</p>';
        try {
            const entries = await getHistoryEntries();
            if (entries.length === 0) {
                historyList.innerHTML = '<div class="empty-state"><p>Aún no tienes ejercicios guardados.</p></div>';
                return;
            }
            historyList.innerHTML = '';
            entries.forEach((entry) => historyList.appendChild(card(entry, entries, renderResultsCallback, show, loadHistory)));
        } catch {
            historyList.innerHTML = '<div class="empty-state"><p>El historial local no está disponible en este navegador.</p></div>';
        }
    }
}

function card(
    entry: HistoryEntry,
    entries: HistoryEntry[],
    renderResultsCallback: (input: MethodInput, result: SolveResult, method: string) => void,
    show: (target: 'resolver' | 'history' | 'compare') => void,
    reload: () => Promise<void>
): HTMLElement {
    const element = document.createElement('div');
    element.className = 'history-card';
    element.style.border = '1px solid var(--border-color)';
    element.style.borderRadius = 'var(--radius-md)';
    element.style.padding = '1.5rem';
    element.style.background = 'var(--surface)';
    const name = METHOD_REGISTRY[entry.method]?.displayName ?? entry.method;
    element.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:0.75rem;">
            <strong style="color:var(--color-primary)">${name}</strong>
            <span style="color:var(--text-muted)">${new Date(entry.createdAt).toLocaleString()}</span>
        </div>
        <p>${entry.result.headlineLabel}: <strong>${entry.result.headline}</strong></p>
        <p>${entry.result.status}</p>
        <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button type="button" class="btn-secondary" data-view="${entry.id}">Ver</button>
            <button type="button" class="btn-secondary" data-delete="${entry.id}">Eliminar</button>
        </div>
    `;
    element.querySelector('[data-view]')?.addEventListener('click', () => {
        const found = entries.find((item) => item.id === entry.id);
        if (!found) return;
        show('resolver');
        renderResultsCallback(found.input, found.result, found.method);
    });
    element.querySelector('[data-delete]')?.addEventListener('click', () => {
        showConfirmModal('¿Eliminar este ejercicio?', '', async () => {
            await deleteHistoryEntry(entry.id);
            await reload();
        });
    });
    return element;
}

function showConfirmModal(title: string, message: string, onConfirm: () => void): void {
    const modal = document.getElementById('confirm-modal') as HTMLDialogElement | null;
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const btnCancel = document.getElementById('modal-btn-cancel');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    if (!modal || !titleEl || !messageEl || !btnCancel || !btnConfirm) return;
    titleEl.textContent = title;
    messageEl.textContent = message;
    if (typeof modal.showModal === 'function') modal.showModal();
    const close = () => {
        if (typeof modal.close === 'function') modal.close();
    };
    const cancel = () => close();
    const confirm = () => {
        close();
        onConfirm();
    };
    btnCancel.addEventListener('click', cancel, { once: true });
    btnConfirm.addEventListener('click', confirm, { once: true });
}
