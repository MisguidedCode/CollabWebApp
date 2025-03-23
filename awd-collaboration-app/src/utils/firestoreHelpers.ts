import { 
    Timestamp, 
    serverTimestamp,
    WriteBatch,
    DocumentReference,
    DocumentData,
    collection,
    doc,
    getFirestore
  } from 'firebase/firestore';
  import { db } from '../config/firebase';
  
  /**
   * Helper functions for working with Firestore
   */
  
  // Helper function to safely convert Firestore timestamps to ISO strings
  export const convertTimestampToString = (timestamp: any): string | undefined => {
    if (!timestamp) return undefined;
    
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    // Already a string
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    return undefined;
  };
  
  // Convert a JavaScript Date to a Firestore Timestamp
  export const dateToTimestamp = (date: Date | string | undefined | null): Timestamp | null => {
    if (!date) return null;
    
    if (typeof date === 'string') {
      return Timestamp.fromDate(new Date(date));
    }
    
    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }
    
    return null;
  };
  
  // Get current server timestamp for Firestore
  export const getServerTimestamp = () => {
    return serverTimestamp();
  };
  
  // Remove undefined values from an object for Firestore (undefined is not supported in Firestore)
  export const sanitizeForFirestore = <T extends Record<string, any>>(data: T): Partial<T> => {
    return Object.entries(data).reduce((result, [key, value]) => {
      // Skip undefined values
      if (value === undefined) return result;
      
      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Timestamp)) {
        result[key as keyof T] = sanitizeForFirestore(value) as any;
      } else {
        result[key as keyof T] = value;
      }
      
      return result;
    }, {} as Partial<T>);
  };
  
  // Create a document reference with proper error handling
  export const createDocRef = <T = DocumentData>(
    collectionPath: string, 
    docId?: string
  ): DocumentReference<T> => {
    try {
      const collectionRef = collection(db, collectionPath);
      return docId ? doc(collectionRef, docId) as DocumentReference<T> : doc(collectionRef) as DocumentReference<T>;
    } catch (error) {
      console.error(`Error creating document reference for ${collectionPath}/${docId || '[new]'}:`, error);
      throw error;
    }
  };
  
  // Helper for working with Firestore batches
  export class FirestoreBatch {
    private batch: WriteBatch;
    private operationCount: number = 0;
    private readonly MAX_OPERATIONS: number = 500; // Firestore batch limit
    
    constructor() {
      this.batch = this.createNewBatch();
    }
    
    private createNewBatch(): WriteBatch {
      return getFirestore().batch();
    }
    
    // Add a document to the batch
    public set<T>(docRef: DocumentReference<T>, data: T, options?: any): this {
      this.batch.set(docRef, data as any, options);
      this.operationCount++;
      return this;
    }
    
    // Update a document in the batch
    public update<T>(docRef: DocumentReference<T>, data: Partial<T>): this {
      this.batch.update(docRef, sanitizeForFirestore(data) as any);
      this.operationCount++;
      return this;
    }
    
    // Delete a document in the batch
    public delete<T>(docRef: DocumentReference<T>): this {
      this.batch.delete(docRef);
      this.operationCount++;
      return this;
    }
    
    // Get the current operation count
    public getOperationCount(): number {
      return this.operationCount;
    }
    
    // Check if the batch is full
    public isFull(): boolean {
      return this.operationCount >= this.MAX_OPERATIONS;
    }
    
    // Commit the batch and return a new batch if needed
    public async commitAndReset(): Promise<void> {
      if (this.operationCount === 0) return;
      
      await this.batch.commit();
      this.batch = this.createNewBatch();
      this.operationCount = 0;
    }
    
    // Get the raw batch instance
    public getBatch(): WriteBatch {
      return this.batch;
    }
  }
  
  // Helper for parsing document snapshot data with proper type conversion
  export const parseDocumentData = <T>(doc: DocumentData): T => {
    const data = doc.data();
    
    // Convert all Firestore timestamps to ISO strings
    const parsed = Object.entries(data).reduce((acc, [key, value]) => {
      if (value instanceof Timestamp) {
        acc[key] = value.toDate().toISOString();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        acc[key] = parseDocumentData(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    return {
      id: doc.id,
      ...parsed
    } as T;
  };