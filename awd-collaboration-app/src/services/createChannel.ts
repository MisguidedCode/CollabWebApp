import { 
    collection,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
  } from 'firebase/firestore';
  import { db, COLLECTIONS } from '../config/firebase';
  import { Chat } from '../types/chat';
  
  // Helper function to safely convert Firestore timestamps to ISO strings
  const convertTimestampToString = (timestamp: any): string | undefined => {
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
  
  /**
   * Create a new channel chat with extra error handling and debugging
   */
  export const createChannelChatEnhanced = async (
    name: string,
    description: string,
    creatorId: string,
    workspaceId: string
  ): Promise<Chat> => {
    console.log('Starting enhanced channel creation:', { name, description, creatorId, workspaceId });
  
    try {
      // Create a reference for a new document with an auto-generated ID
      const chatsCollection = collection(db, COLLECTIONS.CHATS);
      const newChatRef = doc(chatsCollection);
      const chatId = newChatRef.id;
      
      console.log('Generated new chat ID:', chatId);
      
      // Prepare the chat data
      const chatData = {
        id: chatId,
        type: 'channel' as const,
        name,
        description,
        workspaceId,
        participants: [creatorId],
        meta: {
          createdBy: creatorId
        },
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };
      
      // Remove the ID field before storing (it's already in the document reference)
      const { id, ...dataToStore } = chatData;
      
      // Use setDoc instead of addDoc for more control
      await setDoc(newChatRef, dataToStore);
      console.log('Chat document created successfully');
      
      // Retrieve the new document to get server timestamps
      const docSnapshot = await getDoc(newChatRef);
      
      if (!docSnapshot.exists()) {
        throw new Error('Failed to retrieve newly created chat document');
      }
      
      const data = docSnapshot.data();
      console.log('Retrieved chat data:', data);
      
      // Convert timestamps to strings for Redux
      const result: Chat = {
        id: chatId,
        type: 'channel',
        name: data.name,
        description: data.description,
        workspaceId: data.workspaceId,
        participants: data.participants,
        meta: data.meta,
        createdAt: convertTimestampToString(data.createdAt),
        lastUpdated: convertTimestampToString(data.lastUpdated) || new Date().toISOString(),
      };
      
      console.log('Returning serialized chat object:', result);
      return result;
    } catch (error) {
      console.error('Error in enhanced channel creation:', error);
      throw error;
    }
  };
