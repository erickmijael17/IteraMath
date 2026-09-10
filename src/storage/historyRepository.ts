import { HistoryEntry } from '../types/history';
import { getDatabase } from './database';

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
    try {
        const db = await getDatabase();
        // Clona de forma estructurada para asegurar que no haya referencias circulares,
        // DOM nodes o instancias no admitidas que rompan IndexedDB.
        const serializedEntry = structuredClone(entry);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction('history', 'readwrite');
            const store = transaction.objectStore('history');
            const request = store.add(serializedEntry);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        // En caso de que IndexedDB falle, devolvemos error.
        // main.ts se encargará de atraparlo y mostrar advertencia no fatal.
        throw new Error(`Error al guardar historial: ${(err as Error).message}`);
    }
}

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('history', 'readonly');
        const store = transaction.objectStore('history');
        const index = store.index('createdAt');
        
        // Obtenemos los elementos usando un cursor reverso para orden descendente
        const request = index.openCursor(null, 'prev');
        const results: HistoryEntry[] = [];

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

export async function getHistoryEntry(id: string): Promise<HistoryEntry | undefined> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('history', 'readonly');
        const store = transaction.objectStore('history');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteHistoryEntry(id: string): Promise<void> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('history', 'readwrite');
        const store = transaction.objectStore('history');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function clearHistory(): Promise<void> {
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('history', 'readwrite');
        const store = transaction.objectStore('history');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
