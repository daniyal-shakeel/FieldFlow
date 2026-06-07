import { PdfSpan, FieldGroup, CustomTextBox } from '../types/pdf';

export interface Draft {
  id: string;
  filename: string;
  updatedAt: string;
  rawFile: ArrayBuffer;
  spans: PdfSpan[];
  groups: FieldGroup[];
  editsMap: Record<string, string>;
  groupEditsMap: Record<string, string>;
  customBoxes: CustomTextBox[];
  spanPositions: Record<string, { x: number; y: number }>;
  spanSizes: Record<string, { width: number; height: number }>;
  spanAlignments: Record<string, 'left' | 'center' | 'right'>;
  zoom: number;
  currentPage: number;
  pageCount: number;
  pageDimensions: Record<number, { width: number; height: number }>;
  selectedPages?: number[];
}

class DraftsDB {
  private dbName = 'fieldflow-pdf-drafts';
  private dbVersion = 1;
  private storeName = 'drafts';

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveDraft(draft: Draft): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(draft);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDraft(id: string): Promise<Draft | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as Draft) || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getDrafts(): Promise<Draft[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const list = (request.result as Draft[]).filter(d => d.id !== 'active-session');
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  }


  async deleteDraft(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const draftsDb = new DraftsDB();
