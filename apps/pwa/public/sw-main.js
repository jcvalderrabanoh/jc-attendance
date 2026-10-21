/*
 * Service worker del Checador: el de Angular (ngsw: instalación y shell
 * offline) más Background Sync para la cola de marcajes.
 *
 * La cola vive en IndexedDB (`att-offline` / `punches`), la escribe la app
 * (PunchQueueService). Aquí solo se reenvía cuando el navegador dispara
 * `sync` (Chrome/Android). iOS no tiene Background Sync: allá la app la
 * vacía al abrirse, al volver a primer plano y con el evento `online`.
 */
importScripts('./ngsw-worker.js');

const DB_NAME = 'att-offline';
const STORE = 'punches';
const SYNC_TAG = 'att-punch-queue';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'idempotencyKey' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out && 'result' in out ? out.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

async function flushQueue() {
  const db = await openDb();
  const items = await tx(db, 'readonly', (s) => s.getAll());
  let sent = 0;
  for (const item of items || []) {
    if (item.rejected) continue;
    let res;
    try {
      res = await fetch(item.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${item.token}` },
        body: JSON.stringify({ ...item.body, offline: true }),
      });
    } catch (e) {
      throw e; // sin red: el navegador reintentará el sync
    }
    if (res.ok) {
      await tx(db, 'readwrite', (s) => s.delete(item.idempotencyKey));
      sent++;
    } else if (res.status >= 500 || res.status === 401 || res.status === 408 || res.status === 429) {
      throw new Error(`HTTP ${res.status}`);
    } else {
      let message = `Error ${res.status}`;
      try {
        const body = await res.json();
        message = Array.isArray(body.message) ? body.message.join('; ') : body.message || message;
      } catch (_) {}
      await tx(db, 'readwrite', (s) => s.put({ ...item, rejected: true, lastError: message }));
    }
  }
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage({ type: 'att-punch-queue-flushed', sent }));
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(flushQueue());
});
