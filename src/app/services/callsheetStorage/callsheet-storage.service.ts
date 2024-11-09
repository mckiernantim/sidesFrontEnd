import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

interface CallsheetData {
  imageUrl: string;
  uploadDate: string;
  originalName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CallsheetStorageService {
  private dbName = 'sidesDB';
  private storeName = 'callsheet';
  private version = 1;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  storeCallsheet(callsheetData: CallsheetData): Observable<void> {
    return from(this.saveCallsheet(callsheetData));
  }

  private async saveCallsheet(callsheetData: CallsheetData): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.put(callsheetData, 'currentCallsheet');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error storing callsheet:', error);
      throw error;
    }
  }

  getStoredCallsheet(): Observable<CallsheetData | null> {
    return from(this.retrieveCallsheet());
  }

  private async retrieveCallsheet(): Promise<CallsheetData | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get('currentCallsheet');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error retrieving callsheet:', error);
      throw error;
    }
  }
}