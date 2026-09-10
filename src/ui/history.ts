import { getHistoryEntries, deleteHistoryEntry, clearHistory } from '../storage';

export function setupHistoryNavigation(renderResultsCallback: (input: any, result: any, method: string) => void) {
    const navResolver = document.getElementById('nav-resolver');
    const navHistory = document.getElementById('nav-history');
    
    const viewResolver = document.getElementById('view-resolver');
    const viewHistory = document.getElementById('view-history');
    
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');

    const navCompare = document.getElementById('nav-compare');
    const viewCompare = document.getElementById('view-compare');

    // Navigation logic
    navResolver?.addEventListener('click', (e) => {
        e.preventDefault();
        navResolver.classList.add('active');
        navHistory?.classList.remove('active');
        navCompare?.classList.remove('active');
        
        viewResolver?.classList.remove('hidden');
        viewHistory?.classList.add('hidden');
        viewCompare?.classList.add('hidden');
    });

    navHistory?.addEventListener('click', async (e) => {
        e.preventDefault();
        navHistory.classList.add('active');
        navResolver?.classList.remove('active');
        navCompare?.classList.remove('active');
        
        viewHistory?.classList.remove('hidden');
        viewResolver?.classList.add('hidden');
        viewCompare?.classList.add('hidden');
        
        await loadHistory();
    });

    // Clear History Button
    btnClearHistory?.addEventListener('click', () => {
        showConfirmModal('¿Limpiar todo el historial?', 'Esta acción no se puede deshacer.', async () => {
            await clearHistory();
            await loadHistory();
        });
    });

    // Format Methods Names
    const methodNames: Record<string, string> = {
        'bisection': 'Bisección',
        'false-position': 'Regla Falsa',
        'fixed-point': 'Punto Fijo',
        'newton-raphson': 'Newton-Raphson',
        'secant': 'Secante',
        'muller': 'Müller'
    };

    // Render History
    async function loadHistory() {
        if (!historyList) return;
        
        historyList.innerHTML = '<p>Cargando...</p>';
        
        try {
            const entries = await getHistoryEntries();
            
            if (entries.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <p>Aún no tienes ejercicios guardados.</p>
                        <button class="btn-primary" onclick="document.getElementById('nav-resolver').click()">Resolver un ejercicio</button>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = '';
            
            entries.forEach(entry => {
                const card = document.createElement('div');
                card.className = 'history-card';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '1.5rem';
                card.style.backgroundColor = 'var(--surface-color)';
                card.style.boxShadow = 'var(--shadow-sm)';
                
                const rootFormat = typeof entry.result.root === 'number' 
                    ? entry.result.root.toFixed(8) 
                    : `${entry.result.root.re.toFixed(8)} + ${entry.result.root.im.toFixed(8)}i`;

                const date = new Date(entry.createdAt).toLocaleString();
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <div style="font-weight: 600; color: var(--primary-color);">${methodNames[entry.method]}</div>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">${date}</div>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <code style="font-size: 1.1rem; color: var(--text-color);">f(x) = ${entry.input.expression}</code>
                    </div>
                    <div style="margin-bottom: 1rem; display: flex; gap: 2rem;">
                        <div>
                            <small style="color: var(--text-muted); display: block;">Raíz aproximada:</small>
                            <strong>${rootFormat}</strong>
                        </div>
                        <div>
                            <small style="color: var(--text-muted); display: block;">Iteraciones:</small>
                            <span>${entry.result.iterations.length}</span>
                        </div>
                        <div>
                            <small style="color: var(--text-muted); display: block;">Estado:</small>
                            <span>${entry.result.converged ? 'Convergió' : 'Máx Iteraciones'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <button class="btn-secondary btn-view" data-id="${entry.id}">Ver</button>
                        <button class="btn-secondary btn-repeat" data-id="${entry.id}">Repetir</button>
                        <button class="btn-secondary btn-delete" data-id="${entry.id}" style="color: var(--danger-color); border-color: var(--danger-color);">Eliminar</button>
                    </div>
                `;
                historyList.appendChild(card);
            });

            // Bind events for cards
            document.querySelectorAll('.btn-view').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = (e.target as HTMLButtonElement).getAttribute('data-id')!;
                    const entry = entries.find(x => x.id === id);
                    if (entry) {
                        navResolver?.click();
                        // Reutiliza componentes
                        renderResultsCallback(entry.input, entry.result, entry.method);
                    }
                });
            });

            document.querySelectorAll('.btn-repeat').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = (e.target as HTMLButtonElement).getAttribute('data-id')!;
                    const entry = entries.find(x => x.id === id);
                    if (entry) {
                        navResolver?.click();
                        
                        // Cargar en formulario
                        const methodSelector = document.getElementById('method-selector') as HTMLSelectElement;
                        if (methodSelector) {
                            methodSelector.value = entry.method;
                            methodSelector.dispatchEvent(new Event('change'));
                        }
                        
                        // Esperar un ciclo a que se generen los campos dinámicos
                        setTimeout(() => {
                            const map: any = {
                                'fx': entry.input.expression,
                                'gx': (entry.input as any).iterationExpression,
                                'a': (entry.input as any).a,
                                'b': (entry.input as any).b,
                                'x0': (entry.input as any).x0,
                                'x1': (entry.input as any).x1,
                                'x2': (entry.input as any).x2,
                                'tolerance': entry.input.tolerance,
                                'maxIterations': entry.input.maxIterations,
                                'errorCriterion': entry.input.errorCriterion
                            };
                            
                            for (const key of Object.keys(map)) {
                                const inputEl = document.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLSelectElement;
                                if (inputEl && map[key] !== undefined) {
                                    inputEl.value = map[key].toString();
                                }
                            }
                        }, 50);
                    }
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = (e.target as HTMLButtonElement).getAttribute('data-id')!;
                    showConfirmModal('¿Eliminar este ejercicio del historial?', '', async () => {
                        await deleteHistoryEntry(id);
                        await loadHistory();
                    });
                });
            });

        } catch (err) {
            historyList.innerHTML = `<div class="empty-state"><p>El historial local no está disponible en este navegador.</p></div>`;
        }
    }
}

function showConfirmModal(title: string, message: string, onConfirm: () => void) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const btnCancel = document.getElementById('modal-btn-cancel');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    
    if (modal && titleEl && messageEl && btnCancel && btnConfirm) {
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        modal.classList.remove('hidden');
        
        const cleanup = () => {
            modal.classList.add('hidden');
            btnCancel.removeEventListener('click', onCancelHandler);
            btnConfirm.removeEventListener('click', onConfirmHandler);
        };
        
        const onCancelHandler = () => cleanup();
        const onConfirmHandler = () => {
            cleanup();
            onConfirm();
        };
        
        btnCancel.addEventListener('click', onCancelHandler);
        btnConfirm.addEventListener('click', onConfirmHandler);
    }
}
