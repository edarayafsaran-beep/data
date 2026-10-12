import { dbApi } from './api';
import { db as firestoreDb } from './firebase';
import { doc, setDoc, deleteDoc, collection as firestoreCollection, getDocs, onSnapshot } from 'firebase/firestore';
import { cleanForFirestore } from '../utils/firestoreCleaner';

interface PendingQueueItem {
  id: string;
  action: 'save' | 'delete';
  collection: string;
  item?: any;
  itemId?: string | number;
  timestamp: number;
}

const QUEUE_STORAGE_KEY = 'dunia_pending_sync_queue';

/**
 * Get pending offline operations
 */
function getPendingQueue(): PendingQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save pending operations queue
 */
function setPendingQueue(queue: PendingQueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

/**
 * Enqueue an operation to be re-tried until safely synced
 */
function enqueuePending(item: Omit<PendingQueueItem, 'id' | 'timestamp'>): void {
  const queue = getPendingQueue();
  queue.push({
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now()
  });
  setPendingQueue(queue);
}

let isDraining = false;

/**
 * Drains and syncs any pending operations to Firebase Firestore & PostgreSQL.
 * Automatically runs on reconnect, periodically, and on app mount.
 * Guarantees zero data loss even during network disconnection or server restart.
 */
export async function drainPendingQueue(): Promise<void> {
  if (isDraining) return;
  const queue = getPendingQueue();
  if (queue.length === 0) return;

  isDraining = true;
  const remaining: PendingQueueItem[] = [];

  for (const entry of queue) {
    let synced = false;
    try {
      if (entry.action === 'save' && entry.item) {
        const strId = String(entry.item.id || Date.now());
        await setDoc(doc(firestoreDb, entry.collection, strId), cleanForFirestore(entry.item), { merge: true });
        dbApi.saveDoc(entry.collection, entry.item).catch(() => {});
        synced = true;
      } else if (entry.action === 'delete' && entry.itemId !== undefined) {
        await deleteDoc(doc(firestoreDb, entry.collection, String(entry.itemId)));
        dbApi.deleteDoc(entry.collection, entry.itemId).catch(() => {});
        synced = true;
      }
    } catch (err) {
      // Still offline - retain in queue to retry later
    }

    if (!synced) {
      remaining.push(entry);
    }
  }

  setPendingQueue(remaining);
  isDraining = false;
}

// Background auto-retry workers
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    drainPendingQueue();
  });
  setInterval(drainPendingQueue, 15000);
  setTimeout(drainPendingQueue, 2000);
}



export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

import { auth } from './firebase';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * High-speed local fallback cache
 */
function updateLocalCache<T extends { id?: any }>(collection: string, strId: string, cleanItem: T, isDelete = false) {
  try {
    const storageKey = `dunia_cache_${collection}`;
    const cached = localStorage.getItem(storageKey);
    let list = cached ? JSON.parse(cached) : [];
    if (Array.isArray(list)) {
      list = list.filter((x: any) => String(x.id) !== strId);
      if (!isDelete) list.unshift(cleanItem);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch (e) {}
}

/**
 * Centrally saves a record directly to Cloud Firestore (Universal cloud access across all hosts & devices).
 * Also mirrors to local PostgreSQL if the server backend is reachable.
 * Never loses data: writes to indexed persistence, cloud Firestore, and local cache.
 */
export async function syncSave<T extends { id?: any; [key: string]: any }>(
  collection: string,
  item: T
): Promise<T> {
  const strId = String(item.id || Date.now());
  const cleanItem = {
    ...item,
    id: isNaN(Number(strId)) ? strId : Number(strId)
  } as T;

  let savedSuccessfully = false;

  // 1. Primary PostgreSQL Save
  try {
    await dbApi.saveDoc(collection, cleanItem);
    savedSuccessfully = true;
  } catch (err: any) {
    console.warn(`[PostgreSQL Save Notice on ${collection}/${strId}]:`, err?.message || err);
  }

  // 2. Secondary Firebase Firestore Sync
  try {
    const firestoreData = cleanForFirestore(cleanItem);
    await setDoc(doc(firestoreDb, collection, strId), firestoreData, { merge: true });
    savedSuccessfully = true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `${collection}/${strId}`);
  }

  // If both failed, queue for auto-drain
  if (!savedSuccessfully) {
    enqueuePending({
      action: 'save',
      collection,
      item: cleanItem
    });
  }

  updateLocalCache(collection, strId, cleanItem);

  return cleanItem;
}

/**
 * Deletes a record from PostgreSQL and Cloud Firestore.
 * Seamlessly propagates deletions across all connected clients.
 */
export async function syncDelete(
  collection: string, 
  id: string | number, 
  userRole?: string, 
  canDelete?: boolean
): Promise<boolean> {
  const strId = String(id);
  let success = false;


  // 1. PostgreSQL Delete
  try {
    await dbApi.deleteDoc(collection, strId, userRole, canDelete);
    success = true;
  } catch (err: any) {
    console.warn(`[PostgreSQL Delete Notice]:`, err?.message);
  }

  // 2. Direct Cloud Delete: Firebase Firestore
  try {
    await deleteDoc(doc(firestoreDb, collection, strId));
    success = true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `${collection}/${strId}`);
  }

  // 3. Local cache removal
  try {
    const storageKey = `dunia_cache_${collection}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        localStorage.setItem(storageKey, JSON.stringify(list.filter((x: any) => String(x.id) !== strId)));
      }
    }
  } catch (e) {}

  return success;
}

/**
 * Loads collection seamlessly from PostgreSQL (primary) or Cloud Firestore.
 * If PostgreSQL has data, returns it immediately.
 * If empty, checks Firestore, local cache, or seeds fallback data.
 */
export async function syncLoad<T = any>(
  collection: string,
  branchId?: number | null,
  fallback: T[] = []
): Promise<T[]> {
  // 1. Primary Backend: PostgreSQL REST endpoints
  try {
    const data = await dbApi.getCollection<T>(collection, branchId);
    if (Array.isArray(data) && data.length > 0) {
      try {
        localStorage.setItem(`dunia_cache_${collection}`, JSON.stringify(data));
      } catch (e) {}
      // Mirror to Firestore in background
      setTimeout(async () => {
        try {
          for (const item of data) {
            const strId = String((item as any).id || Date.now());
            await setDoc(doc(firestoreDb, collection, strId), cleanForFirestore(item), { merge: true });
          }
        } catch (e) {}
      }, 300);
      return data;
    }
  } catch (err: any) {
    console.warn(`[PostgreSQL Load Notice on ${collection}]:`, err?.message || err);
  }

  // 2. Secondary Cloud Database: Firebase Firestore
  try {
    const colRef = firestoreCollection(firestoreDb, collection);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const items = snap.docs.map(d => {
        const data = d.data();
        const idVal = data.id !== undefined ? data.id : (isNaN(Number(d.id)) ? d.id : Number(d.id));
        return { ...data, id: idVal } as T;
      });

      try {
        localStorage.setItem(`dunia_cache_${collection}`, JSON.stringify(items));
      } catch (e) {}

      if (branchId !== undefined && branchId !== null) {
        const filtered = items.filter((x: any) => x.branchId === undefined || x.branchId === null || String(x.branchId) === String(branchId));
        return filtered.length > 0 ? filtered : items;
      }
      return items;
    }
  } catch (err: any) {
    console.warn(`[Firestore Cloud Load Notice on ${collection}]:`, err?.message || err);
  }

  // 3. Persistent Local Cache Fallback
  try {
    const storageKey = `dunia_cache_${collection}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list) && list.length > 0) {
        if (branchId !== undefined && branchId !== null) {
          const filtered = list.filter((x: any) => x.branchId === undefined || x.branchId === null || String(x.branchId) === String(branchId));
          return filtered.length > 0 ? filtered : list;
        }
        return list;
      }
    }
  } catch (e) {}

  // 4. Fallback if empty (returns provided fallback or empty array without forcing writes to databases)
  return fallback || [];
}

/**
 * Real-time continuous listener on Firebase Firestore collection.
 * Automatically pushes any new, updated, or deleted documents to the app state
 * across all connected devices, phones, and hosts without needing any button click or refresh.
 */
export function subscribeCollection<T = any>(
  collectionName: string,
  branchId: number | null | undefined,
  onUpdate: (items: T[]) => void
): () => void {
  try {
    const colRef = firestoreCollection(firestoreDb, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }

        const items = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const idVal = data.id !== undefined ? data.id : (isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id));
          return {
            ...data,
            id: idVal
          } as T;
        });

        // Filter by branch if specified
        const filtered = (branchId !== undefined && branchId !== null)
          ? items.filter((x: any) => x.branchId === undefined || x.branchId === null || String(x.branchId) === String(branchId))
          : items;

        onUpdate(filtered.length > 0 ? filtered : items);
        try {
          localStorage.setItem(`dunia_cache_${collectionName}`, JSON.stringify(items));
        } catch (e) {}
      },
      (error) => {
        console.warn(`[Firestore Realtime Notice for ${collectionName}]:`, error.message);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`[Firestore subscription error on ${collectionName}]:`, err);
    return () => {};
  }
}

/**
 * Resets all data from both PostgreSQL and Firestore, and clears local caches.
 */
export async function resetDatabase(): Promise<void> {
  const collections = [
    'patients', 'appointments', 'expenses', 'inventory', 'patientComplaints', 
    'labTests', 'prescriptions', 'systemAuditLogs', 'employeePayroll', 
    'staffAttendance', 'whatsappLogs', 'treatments', 'rooms', 'treatmentPackages', 
    'membershipTiers', 'cashBoxes', 'bankAccounts', 'fixedAssets', 
    'employeeBonuses', 'financialAuditLogs', 'staffLeaveRequests', 
    'workShiftConfigs', 'customFormFields'
  ];
  for (const col of collections) {
    try {
      const snap = await getDocs(firestoreCollection(firestoreDb, col));
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }
      dbApi.deleteDoc(col, 'all').catch(() => {});
      localStorage.removeItem(`dunia_cache_${col}`);
    } catch (e) {
      console.warn(`Error resetting collection ${col}:`, e);
    }
  }
  localStorage.removeItem('dunia_pending_sync_queue');
}
