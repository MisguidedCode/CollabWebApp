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
import { registerSubscription, unregisterSubscriptionsByPrefix } from '../utils/subscriptionManager';
import { documentStorage } from '../utils/documentStorage';
  
  // Helper function to check workspace membership
  const checkWorkspaceMembership = async (userId: string, workspaceId: string): Promise<boolean> => {
    const workspaceDoc = doc(db, `workspaces/${workspaceId}`);
    const snapshot = await getDoc(workspaceDoc);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    const workspace = snapshot.data();
    return workspace.members.some((member: any) => 
      member.userId === userId && member.status === 'active'
    );
  };
  
  // Helper function to verify document access
  const verifyDocumentAccess = async (documentId: string, userId: string): Promise<Document> => {
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const snapshot = await getDoc(documentDoc);
    
    if (!snapshot.exists()) {
      throw new Error('Document not found');
    }
    
    const document = documentConverter.fromFirestore(snapshot);
    
    // Check workspace membership
    if (!await checkWorkspaceMembership(userId, document.permissions.workspaceId)) {
      throw new Error('User does not have access to this document');
    }
    
    // User has workspace access, now check document permissions
    const { owner, admin = [], read = [], write = [], editors = [], readers = [] } = document.permissions;
    
    // Check if user has any level of access
    const hasAccess = owner === userId || 
                     admin.includes(userId) || 
                     read.includes(userId) || 
                     write.includes(userId) || 
                     editors.includes(userId) || 
                     readers.includes(userId);
                     
    if (!hasAccess) {
      throw new Error('User does not have permission to access this document');
    }
    
    return document;
  };
  
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
  
// Create a new document with workspace-wide permissions
export const createDocument = async (
  document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>, 
  userId: string
): Promise<Document> => {
  // Get workspace data to check membership and get all members
  const workspaceDoc = doc(db, 'workspaces', document.permissions.workspaceId);
  const workspaceSnapshot = await getDoc(workspaceDoc);
  
  if (!workspaceSnapshot.exists()) {
    throw new Error('Workspace not found');
  }
  
  const workspace = workspaceSnapshot.data();
  const currentUserMember = workspace.members.find((m: any) => m.userId === userId);
  
  if (!currentUserMember || currentUserMember.status !== 'active') {
    throw new Error('User is not a member of this workspace');
  }

  // Sort members into permission arrays based on workspace roles
  const adminIds: string[] = [];
  const editorIds: string[] = [];
  const readerIds: string[] = [];

  workspace.members.forEach((member: any) => {
    if (member.status === 'active') {
      switch (member.role) {
        case 'admin':
          adminIds.push(member.userId);
          break;
        case 'editor':
          editorIds.push(member.userId);
          break;
        case 'member':
          readerIds.push(member.userId);
          break;
      }
    }
  });

  // Create document with workspace-wide permissions and collaborative editing enabled
  const documentsCollection = collection(db, COLLECTIONS.DOCUMENTS);
  const docRef = doc(documentsCollection);
  const newDocument: Document = {
    ...document,
    id: docRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      ...document.metadata,
      collaborativeEditingEnabled: true, // Enable collaborative editing by default
      status: document.metadata?.status || 'draft',
      lastModifiedBy: userId,
      lastModifiedAt: new Date().toISOString(),
    },
    permissions: {
      ...document.permissions,
      owner: userId,
      admin: Array.from(new Set([...adminIds, userId])), // Include document creator in admin
      write: Array.from(new Set([...adminIds, ...editorIds, ...readerIds])), // All members can edit
      read: Array.from(new Set([...adminIds, ...editorIds, ...readerIds])), // All members can read
      editors: Array.from(new Set([...adminIds, ...editorIds, ...readerIds])), // All members can edit
      readers: Array.from(new Set([...adminIds, ...editorIds, ...readerIds])), // All members can read
      commenters: Array.from(new Set([...adminIds, ...editorIds, ...readerIds])) // All members can comment
    }
  };
  
  await setDoc(docRef, documentConverter.toFirestore(newDocument));
  
  // Get the document back to ensure timestamps are converted
  const snapshot = await getDoc(docRef);
  return documentConverter.fromFirestore(snapshot);
  };
  
  // Get a document by ID with access check
  export const getDocumentById = async (documentId: string, userId: string): Promise<Document | null> => {
    return verifyDocumentAccess(documentId, userId);
  };
  
  // Get all documents for a user in a workspace
  export const getWorkspaceDocuments = async (workspaceId: string, userId: string): Promise<Document[]> => {
    // Verify workspace membership
    if (!await checkWorkspaceMembership(userId, workspaceId)) {
      throw new Error('User is not a member of this workspace');
    }

    const documentsCollection = collection(db, COLLECTIONS.DOCUMENTS);
    const q = query(
      documentsCollection,
      where('permissions.workspaceId', '==', workspaceId),
      where('permissions.owner', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => documentConverter.fromFirestore(doc));
  };
  
  // Get documents shared with a user in a workspace
  export const getSharedWorkspaceDocuments = async (workspaceId: string, userId: string): Promise<Document[]> => {
    // Verify workspace membership
    if (!await checkWorkspaceMembership(userId, workspaceId)) {
      throw new Error('User is not a member of this workspace');
    }

    const documentsCollection = collection(db, COLLECTIONS.DOCUMENTS);
    const q = query(
      documentsCollection,
      where('permissions.workspaceId', '==', workspaceId),
      where('permissions.read', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => documentConverter.fromFirestore(doc));
  };
  
  // Get recent documents for a user in a workspace
  export const getRecentWorkspaceDocuments = async (workspaceId: string, userId: string, maxCount = 10): Promise<Document[]> => {
    // Verify workspace membership
    if (!await checkWorkspaceMembership(userId, workspaceId)) {
      throw new Error('User is not a member of this workspace');
    }

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
      where('permissions.read', 'array-contains', userId),
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
  
  // Update document metadata with workspace check
  export const updateDocument = async (document: Document, userId: string): Promise<void> => {
    // Verify access to document
    await verifyDocumentAccess(document.id, userId);
    
    // Ensure collaborative editing stays enabled if it was enabled
    const documentToUpdate = {
      ...document,
      metadata: {
        ...document.metadata,
        collaborativeEditingEnabled: document.metadata.collaborativeEditingEnabled ?? true,
        lastModifiedBy: userId,
        lastModifiedAt: new Date().toISOString(),
      }
    };
    
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, document.id);
    await updateDoc(documentDoc, documentConverter.toFirestore(documentToUpdate));
  };

  // Enable collaborative editing for an existing document
  export const enableCollaborativeEditing = async (documentId: string, userId: string): Promise<void> => {
    const document = await verifyDocumentAccess(documentId, userId);
    
    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(documentDoc, {
      'metadata.collaborativeEditingEnabled': true,
      'metadata.lastModifiedBy': userId,
      'metadata.lastModifiedAt': serverTimestamp()
    });
  };
  
// Delete a document with workspace check
export const deleteDocument = async (documentId: string, userId: string): Promise<void> => {
  try {
    // Verify access and get document to check if user is owner
    const document = await verifyDocumentAccess(documentId, userId);
    
    // Only owner can delete document
    if (document.permissions.owner !== userId) {
      throw new Error('Only document owner can delete the document');
    }
    
    const documentRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const commentsRef = collection(documentRef, COLLECTIONS.DOCUMENT_COMMENTS);
    const versionsRef = collection(documentRef, COLLECTIONS.DOCUMENT_VERSIONS);

    // Delete document contents from storage if they exist
    if (document.contentUrl) {
      try {
        const contentRef = ref(storage, document.contentUrl);
        await deleteObject(contentRef);
      } catch (error) {
        console.error('Error deleting document content:', error);
        // Continue with document deletion even if content deletion fails
      }
    }

    // Delete all comments
    const commentDocs = await getDocs(commentsRef);
    await Promise.all(
      commentDocs.docs.map(doc => deleteDoc(doc.ref))
    );

    // Delete all versions
    const versionDocs = await getDocs(versionsRef);
    await Promise.all(
      versionDocs.docs.map(doc => deleteDoc(doc.ref))
    );

    // Delete the document itself
    await deleteDoc(documentRef);

    // Clean up any local drafts
    documentStorage.removeDraft(documentId);

    // Unsubscribe from WebSocket
    unregisterSubscriptionsByPrefix(`document-${documentId}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
  
  // Upload document content with workspace check
  export const uploadDocumentContent = async (
    documentId: string, 
    content: string | Blob | File, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    // Only need to verify document access as all workspace members can edit
    const document = await verifyDocumentAccess(documentId, userId);
    
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
      
      // Upload file
      await uploadBytes(fileRef, file);
      
      // Notify completion if progress callback is provided
      if (onProgress) {
        onProgress(100);
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
  
  // Create a new document version with workspace check
  export const createDocumentVersion = async (
    documentId: string,
    version: Omit<DocumentVersion, 'id' | 'createdAt'>,
    userId: string
  ): Promise<DocumentVersion> => {
    // Only need to verify document access as all workspace members can edit
    const document = await verifyDocumentAccess(documentId, userId);

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
      versions: [...(await getDocumentVersions(documentId, userId)), newVersion],
      updatedAt: serverTimestamp()
    });
    
    return newVersion;
  };
  
  // Get all versions of a document with workspace check
  export const getDocumentVersions = async (documentId: string, userId: string): Promise<DocumentVersion[]> => {
    // Verify document access
    await verifyDocumentAccess(documentId, userId);

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
  
  // Add a comment to a document with workspace check
  export const addDocumentComment = async (
    documentId: string,
    comment: Omit<DocumentComment, 'id' | 'createdAt'>,
    userId: string
  ): Promise<DocumentComment> => {
    // Only need to verify document access as all workspace members can comment
    const document = await verifyDocumentAccess(documentId, userId);

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
  
  // Get all comments for a document with workspace check
  export const getDocumentComments = async (documentId: string, userId: string): Promise<DocumentComment[]> => {
    // Verify document access
    await verifyDocumentAccess(documentId, userId);

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
  
  // Resolve a comment with workspace check
  export const resolveComment = async (
    documentId: string,
    commentId: string,
    resolvedBy: string,
    userId: string
  ): Promise<void> => {
    // Only need to verify document access as all workspace members can resolve comments
    const document = await verifyDocumentAccess(documentId, userId);

    const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const commentDoc = doc(collection(documentDoc, COLLECTIONS.DOCUMENT_COMMENTS), commentId);
    
    await updateDoc(commentDoc, {
      resolved: true,
      resolvedBy,
      resolvedAt: serverTimestamp()
    });
  };
  
  // Subscribe to a document's changes with workspace check
  export const subscribeToDocument = async (
    documentId: string,
    userId: string,
    callback: (document: Document | null) => void
  ): Promise<() => void> => {
    try {
      // Verify initial access
      await verifyDocumentAccess(documentId, userId);
      
      const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
      const unsubscribe = onSnapshot(documentDoc, {
        next: async (snapshot) => {
          if (snapshot.exists()) {
            const document = documentConverter.fromFirestore(snapshot);
            try {
              // Re-verify access on each update
              await verifyDocumentAccess(documentId, userId);
              callback(document);
            } catch (error) {
              console.error('Lost access to document:', error);
              callback(null);
            }
          } else {
            callback(null);
          }
        },
        error: (error: Error) => {
          console.error('Error in document subscription:', error);
          callback(null);
        }
      });
      
      // Register subscription for cleanup
      registerSubscription(
        `document-${documentId}`,
        unsubscribe,
        'DocumentService',
        'document-subscription'
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to document:', error);
      callback(null);
      return () => {};
    }
  };
  
  // Subscribe to document comments with workspace check
  export const subscribeToDocumentComments = async (
    documentId: string,
    userId: string,
    callback: (comments: DocumentComment[]) => void
  ): Promise<() => void> => {
    try {
      // Verify initial access
      await verifyDocumentAccess(documentId, userId);
      
      const documentDoc = doc(db, COLLECTIONS.DOCUMENTS, documentId);
      const commentsCollection = collection(documentDoc, COLLECTIONS.DOCUMENT_COMMENTS);
      const q = query(commentsCollection, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(q, {
        next: async (snapshot) => {
          try {
            // Re-verify access on each update
            await verifyDocumentAccess(documentId, userId);
            
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
          } catch (error) {
            console.error('Lost access to document comments:', error);
            callback([]);
          }
        },
        error: (error: Error) => {
          console.error('Error in comments subscription:', error);
          callback([]);
        }
      });
      
      // Register subscription for cleanup
      registerSubscription(
        `document-comments-${documentId}`,
        unsubscribe,
        'DocumentService',
        'comments-subscription'
      );
      return unsubscribe;
      
    } catch (error) {
      console.error('Error subscribing to document comments:', error);
      callback([]);
      return () => {};
    }
  };
  
  // Share a document with a user
// Alias for backward compatibility
export const getRecentDocuments = async (userId: string, maxCount: number = 10): Promise<Document[]> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  // Get user's current workspace or default to first one
  const workspaceId = userDoc.data().currentWorkspaceId || userDoc.data().workspaces?.[0];
  if (!workspaceId) {
    return [];
  }
  
  return getRecentWorkspaceDocuments(workspaceId, userId, maxCount);
};

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
