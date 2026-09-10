import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveHistoryEntry, getHistoryEntries, getHistoryEntry, deleteHistoryEntry, clearHistory } from './historyRepository';
import { MullerHistoryEntry, BisectionHistoryEntry } from '../types/history';

// Mock simple de structuredClone para el entorno de test en caso de que no exista
if (typeof structuredClone !== 'function') {
    (globalThis as any).structuredClone = (val: any) => JSON.parse(JSON.stringify(val));
}

describe('History Repository (IndexedDB)', () => {
    beforeEach(async () => {
        await clearHistory();
    });

    afterEach(async () => {
        await clearHistory();
    });

    it('1. y 2. Guarda un registro y lo obtiene', async () => {
        const entry: BisectionHistoryEntry = {
            id: 'test-1',
            createdAt: new Date('2026-09-09T08:00:00.000Z').toISOString(),
            method: 'bisection',
            input: { expression: 'x^2', a: 1, b: 2, errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.1 },
            result: { root: 1.5, iterations: [], finalError: null, residual: 0, converged: true, stopReason: 'TOLERANCE_REACHED', totalIterations: 0 }
        };

        await saveHistoryEntry(entry);
        const entries = await getHistoryEntries();

        expect(entries.length).toBe(1);
        expect(entries[0].id).toBe('test-1');
        expect(entries[0].method).toBe('bisection');
    });

    it('3. Obtiene un registro por id', async () => {
        const entry: BisectionHistoryEntry = {
            id: 'test-2',
            createdAt: new Date('2026-09-09T08:00:00.000Z').toISOString(),
            method: 'bisection',
            input: { expression: 'x^2', a: 1, b: 2, errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.1 },
            result: { root: 1.5, iterations: [], finalError: null, residual: 0, converged: true, stopReason: 'TOLERANCE_REACHED', totalIterations: 0 }
        };

        await saveHistoryEntry(entry);
        const found = await getHistoryEntry('test-2');
        expect(found).toBeDefined();
        expect(found?.id).toBe('test-2');
    });

    it('4. Elimina un registro', async () => {
        const entry: BisectionHistoryEntry = {
            id: 'test-del',
            createdAt: new Date().toISOString(),
            method: 'bisection',
            input: { expression: 'x^2', a: 1, b: 2, errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.1 },
            result: { root: 1.5, iterations: [], finalError: null, residual: 0, converged: true, stopReason: 'TOLERANCE_REACHED', totalIterations: 0 }
        };

        await saveHistoryEntry(entry);
        await deleteHistoryEntry('test-del');
        const found = await getHistoryEntry('test-del');
        expect(found).toBeUndefined();
    });

    it('5. Limpia todo el historial', async () => {
        const entry: BisectionHistoryEntry = {
            id: 'test-clear',
            createdAt: new Date().toISOString(),
            method: 'bisection',
            input: { expression: 'x^2', a: 1, b: 2, errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.1 },
            result: { root: 1.5, iterations: [], finalError: null, residual: 0, converged: true, stopReason: 'TOLERANCE_REACHED', totalIterations: 0 }
        };

        await saveHistoryEntry(entry);
        await clearHistory();
        const entries = await getHistoryEntries();
        expect(entries.length).toBe(0);
    });

    it('6. Obtiene registros ordenados por fecha (descendente)', async () => {
        const entry1: BisectionHistoryEntry = {
            id: 'e1',
            createdAt: '2026-09-08T10:00:00.000Z',
            method: 'bisection',
            input: { expression: 'x^2', a: 1, b: 2, errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.1 },
            result: { root: 1.5, iterations: [], finalError: null, residual: 0, converged: true, stopReason: 'TOLERANCE_REACHED', totalIterations: 0 }
        };
        const entry2: BisectionHistoryEntry = {
            id: 'e2',
            createdAt: '2026-09-09T10:00:00.000Z', // Más reciente
            method: 'bisection',
            input: { expression: 'x^2', a: 1, b: 2, errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.1 },
            result: { root: 1.5, iterations: [], finalError: null, residual: 0, converged: true, stopReason: 'TOLERANCE_REACHED', totalIterations: 0 }
        };

        await saveHistoryEntry(entry1);
        await saveHistoryEntry(entry2);

        const entries = await getHistoryEntries();
        expect(entries.length).toBe(2);
        // Debe venir primero el e2 por ser más reciente
        expect(entries[0].id).toBe('e2');
        expect(entries[1].id).toBe('e1');
    });

    it('7. Müller complejo serializable correctamente', async () => {
        const mullerEntry: MullerHistoryEntry = {
            id: 'muller-1',
            createdAt: new Date().toISOString(),
            method: 'muller',
            input: { expression: 'x^2+1', x0: -1, x1: 0, x2: 1, errorCriterion: 'absolute', maxIterations: 10, tolerance: 0.1 },
            result: { 
                root: { re: 0, im: 1 }, 
                iterations: [], 
                finalError: null, 
                residual: 0, 
                converged: true, 
                stopReason: 'TOLERANCE_REACHED', 
                totalIterations: 0 
            }
        };

        await saveHistoryEntry(mullerEntry);
        const retrieved = await getHistoryEntry('muller-1') as MullerHistoryEntry;
        
        expect(retrieved).toBeDefined();
        expect(retrieved.result.root).toEqual({ re: 0, im: 1 });
    });
});
