import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearHistory, getHistoryEntries, saveHistoryEntry } from './historyRepository';
import { HistoryEntry } from '../types/history';

describe('historial de la unidad 2', () => {
    beforeEach(async () => {
        await clearHistory();
    });

    it('guarda y recupera un ejercicio', async () => {
        const entry: HistoryEntry = {
            id: 'gauss-1',
            createdAt: new Date('2026-10-21T12:00:00.000Z').toISOString(),
            method: 'gauss',
            input: { A: [[1, 0], [0, 1]], b: [1, 2], pivot: true },
            result: {
                converged: true,
                status: 'Solución única',
                headlineLabel: 'Solución',
                headline: 'x₁ = 1, x₂ = 2',
                details: [],
                tables: [],
                octave: 'disp(x)',
                graph: { type: 'none' },
                values: [1, 2],
                extra: {}
            }
        };
        await saveHistoryEntry(entry);
        const entries = await getHistoryEntries();
        expect(entries).toHaveLength(1);
        expect(entries[0].method).toBe('gauss');
    });
});
