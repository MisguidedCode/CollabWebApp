import { 
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    orderBy,
    limit
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
  import { db, storage } from '../config/firebase';
  import { Document, DocumentVersion, DocumentComment } from '../types/document';
  import { convertTimestampToString } from '../utils/firestoreHelpers';
  import { registerSubscription } from '../utils/subscriptionManager';
  
  // Firebase collection names
  const COLLECTIONS = {
    DOCUMENTS: 'documents',
    DOCUMENT_VERSIONS: 'versions',
    DOCUMENT_COMMENTS: 'comments',
    DOCUMENT_CONTENT: 'document-content'
  };
  
  // Document converter for Firestore
  const documentConverter = {
    fromFirestore: (snapshot: any, options?: any) => {
      const data = snapshot.data(options);
      
      // Handle timestamps
      return {
        ...data,
        id: snapshot.id,
        createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
        updatedAt: convertTimestampToString(data.updatedAt) || new Date().toISOString(),
        versions: data.versions?.map((version: any) => ({
          ...version,
          createdAt: convertTimestampToString(version.createdAt) || new Date().toISOString(),
        })) || [],
        comments: data.comments?.map((comment: any) => ({
          ...comment,
          createdAt: convertTimestampToString(comment.createdAt) || new Date().toISOString(),
          resolvedAt: comment.resolvedAt ? convertTimestampToString(comment.resolvedAt) : undefined,
        })) || [],
      } as Document;
    },
    toFirestore: (document: Document) => {
      const { id, ...docData } = document;
      
      // Clean up any undefined values
      const cleanData: Record<string, any> = Object.entries(docData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Convert timestamps
      return {
        ...cleanData,
        createdAt: document.createdAt ? Timestamp.fromDate(new Date(document.createdAt)) : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
    }
  };
  
  // Create a new document
  export const createDocument = async (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> => {
    const documentsCollection = collection(db, COLLECTIONS.DOCUMENTS);
    const docRef = doc(documentsCollection);
    const newDocument: Document = {
      ...document,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(docRef, documentConverter.toFirestore(newDocument));
    
    // Get the document back to ensure timestamps are converted
    const snapshot = await getDoc(docRef);
    return documentConverter.fromFirestore(snapshot);
  };
  
  // Get a document by ID
  export const getDocumentById = async (documentId: string): Promise<Document | null> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const snapshot = await getDoc(documentDoc);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return documentConverter.fromFirestore(snapshot);
  };
  
  // Get all documents for a user
  export const getUserDocuments = async (userId: string): Promise<Document[]> => {
    const documentsCollection = collection(db, COLLECTIONS.DOCUMENTS);
    const q = query(
      documentsCollection,
      where('permissions.owner', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => documentConverter.fromFirestore(doc));
  };
  
  // Get documents shared with a user
  export const getSharedDocuments = async (userId: string): Promise<Document[]> => {
    const documentsCollection = collection(db, COLLECTIONS.DOCUMENTS);
    const q = query(
      documentsCollection,
      where('permissions.readers', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => documentConverter.fromFirestore(doc));
  };
  
  // Get recent documents for a user
  export const getRecentDocuments = async (userId: string, maxCount = 10): Promise<Document[]> => {
    const documentsCollection = collection(db, COLLECTIONS.DOCUMENTS);
    
    // Query for documents owned by user or shared with user
    const ownedQuery = query(
      documentsCollection,
      where('permissions.owner', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(maxCount)
    );
    
    const sharedQuery = query(
      documentsCollection,
      where('permissions.readers', 'array-contains', userId),
      orderBy('updatedAt', 'desc'),
      limit(maxCount)
    );
    
    const [ownedSnapshot, sharedSnapshot] = await Promise.all([
      getDocs(ownedQuery),
      getDocs(sharedQuery)
    ]);
    
    const ownedDocs = ownedSnapshot.docs.map(doc => documentConverter.fromFirestore(doc));
    const sharedDocs = sharedSnapshot.docs.map(doc => documentConverter.fromFirestore(doc));
    
    // Combine and sort by updatedAt
    return [...ownedDocs, ...sharedDocs]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, maxCount);
  };
  
  // Update document metadata
  export const updateDocument = async (document: Document): Promise<void> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, document.id);
    await updateDoc(documentDoc, documentConverter.toFirestore(document));
  };
  
  // Delete a document
  export const deleteDocument = async (documentId: string): Promise<void> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await deleteDoc(documentDoc);
  };
  
  // Upload document content
  export const uploadDocumentContent = async (
    documentId: string, 
    content: string | Blob | File, 
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    let fileRef;
    let downloadUrl = '';
    
    if (typeof content === 'string') {
      // For text documents, store as JSON in a specific location
      fileRef = ref(storage, `${COLLECTIONS.DOCUMENT_CONTENT}/${documentId}/content.json`);
      const contentBlob = new Blob([content], { type: 'application/json' });
      await uploadBytes(fileRef, contentBlob);
    } else {
      // For binary documents, store in the original format
      const file = content instanceof Blob ? content : content;
      const extension = content instanceof File ? content.name.split('.').pop() || '' : 'bin';
      fileRef = ref(storage, `${COLLECTIONS.DOCUMENT_CONTENT}/${documentId}/content.${extension}`);
      
      // Upload with progress tracking
      if (onProgress) {
        const uploadTask = uploadBytes(fileRef, file);
        uploadTask.then(snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
        await uploadTask;
      } else {
        await uploadBytes(fileRef, file);
      }
    }
    
    // Get download URL
    downloadUrl = await getDownloadURL(fileRef);
    
    // Update document with content URL
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(documentDoc, { 
      contentUrl: downloadUrl,
      updatedAt: serverTimestamp()
    });
    
    return downloadUrl;
  };
  
  // Create a new document version
  export const createDocumentVersion = async (
    documentId: string,
    version: Omit<DocumentVersion, 'id' | 'createdAt'>
  ): Promise<DocumentVersion> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const versionsCollection = collection(documentDoc, COLLECTIONS.DOCUMENT_VERSIONS);
    const versionRef = doc(versionsCollection);
    
    const newVersion: DocumentVersion = {
      ...version,
      id: versionRef.id,
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(versionRef, {
      ...newVersion,
      createdAt: serverTimestamp()
    });
    
    // Update current document with new version ID
    await updateDoc(documentDoc, {
      currentVersionId: newVersion.id,
      versions: [...(await getDocumentVersions(documentId)), newVersion],
      updatedAt: serverTimestamp()
    });
    
    return newVersion;
  };
  
  // Get all versions of a document
  export const getDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const versionsCollection = collection(documentDoc, COLLECTIONS.DOCUMENT_VERSIONS);
    const q = query(versionsCollection, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
      } as DocumentVersion;
    });
  };
  
  // Add a comment to a document
  export const addDocumentComment = async (
    documentId: string,
    comment: Omit<DocumentComment, 'id' | 'createdAt'>
  ): Promise<DocumentComment> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const commentsCollection = collection(documentDoc, COLLECTIONS.DOCUMENT_COMMENTS);
    const commentRef = doc(commentsCollection);
    
    const newComment: DocumentComment = {
      ...comment,
      id: commentRef.id,
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(commentRef, {
      ...newComment,
      createdAt: serverTimestamp()
    });
    
    return newComment;
  };
  
  // Get all comments for a document
  export const getDocumentComments = async (documentId: string): Promise<DocumentComment[]> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const commentsCollection = collection(documentDoc, COLLECTIONS.DOCUMENT_COMMENTS);
    const q = query(commentsCollection, orderBy('createdAt', 'asc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
        resolvedAt: data.resolvedAt ? convertTimestampToString(data.resolvedAt) : undefined,
      } as DocumentComment;
    });
  };
  
  // Resolve a comment
  export const resolveComment = async (
    documentId: string,
    commentId: string,
    resolvedBy: string
  ): Promise<void> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const commentDoc = doc(collection(documentDoc, COLLECTIONS.DOCUMENT_COMMENTS), commentId);
    
    await updateDoc(commentDoc, {
      resolved: true,
      resolvedBy,
      resolvedAt: serverTimestamp()
    });
  };
  
  // Subscribe to a document's changes
  export const subscribeToDocument = (
    documentId: string,
    callback: (document: Document) => void
  ): () => void => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    
    const unsubscribe = onSnapshot(documentDoc, (snapshot) => {
      if (snapshot.exists()) {
        callback(documentConverter.fromFirestore(snapshot));
      }
    });
    
    // Register subscription for cleanup
    registerSubscription(`document-${documentId}`, unsubscribe);
    
    return unsubscribe;
  };
  
  // Subscribe to document comments
  export const subscribeToDocumentComments = (
    documentId: string,
    callback: (comments: DocumentComment[]) => void
  ): () => void => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const commentsCollection = collection(documentDoc, COLLECTIONS.DOCUMENT_COMMENTS);
    const q = query(commentsCollection, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
          resolvedAt: data.resolvedAt ? convertTimestampToString(data.resolvedAt) : undefined,
        } as DocumentComment;
      });
      
      callback(comments);
    });
    
    // Register subscription for cleanup
    registerSubscription(`document-comments-${documentId}`, unsubscribe);
    
    return unsubscribe;
  };
  
  // Share a document with a user
  export const shareDocumentWithUser = async (
    documentId: string,
    userId: string,
    permission: 'readers' | 'editors' | 'commenters'
  ): Promise<void> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const documentSnapshot = await getDoc(documentDoc);
    
    if (!documentSnapshot.exists()) {
      throw new Error('Document not found');
    }
    
    const document = documentConverter.fromFirestore(documentSnapshot);
    
    // Check if user already has the permission
    if (document.permissions[permission].includes(userId)) {
      return;
    }
    
    // Add user to the permission array
    document.permissions[permission].push(userId);
    
    // Update the document
    await updateDoc(documentDoc, {
      [`permissions.${permission}`]: document.permissions[permission],
      updatedAt: serverTimestamp()
    });
  };