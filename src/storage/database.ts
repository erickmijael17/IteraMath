const DB_NAME = 'iteramath-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDatabase(): Promise<IDBDatabase> {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const indexedDB = typeof window !== 'undefined' ? window.indexedDB : (globalThis as any).indexedDB;
            if (!indexedDB) {
                return reject(new Error('IndexedDB no está disponible en este entorno.'));
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event: Event) => {
                const error = (event.target as IDBOpenDBRequest).error;
                reject(new Error(`No se pudo abrir la base de datos: ${error?.message}`));
            };

            request.onsuccess = (event: Event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                resolve(db);
            };

            request.onupgradeneeded = (event: Event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Migración: Crear el store inicial en versión 1
                if (!db.objectStoreNames.contains('history')) {
                    const store = db.createObjectStore('history', { keyPath: 'id' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    return dbPromise;
}
