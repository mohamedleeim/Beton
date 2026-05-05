import { openDB, IDBPDatabase } from 'idb';

export interface PendingRequest {
  id?: number;
  action: 'create' | 'update' | 'delete';
  sheetName: string;
  data?: any;
  recordId?: string;
  timestamp: number;
}

const DB_NAME = 'ConcreteAppOffline';
const STORE_NAME = 'pendingRequests';
const CACHE_STORE = 'cachedData';

export class OfflineService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
        if (oldVersion < 2) {
          db.createObjectStore(CACHE_STORE);
        }
      },
    });
  }

  async addRequest(request: Omit<PendingRequest, 'id' | 'timestamp'>) {
    const db = await this.dbPromise;
    await db.add(STORE_NAME, {
      ...request,
      timestamp: Date.now(),
    });
    console.log('Request added to offline queue:', request);
  }

  async getPendingRequests(): Promise<PendingRequest[]> {
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  async removeRequest(id: number) {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }

  async clearQueue() {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }

  async cacheData(sheetName: string, data: any[]) {
    const db = await this.dbPromise;
    await db.put(CACHE_STORE, data, sheetName);
  }

  async getCachedData(sheetName: string): Promise<any[] | undefined> {
    const db = await this.dbPromise;
    return db.get(CACHE_STORE, sheetName);
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineService = new OfflineService();
