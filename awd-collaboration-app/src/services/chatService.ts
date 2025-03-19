import { 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { Chat, Message, ChatType } from '../types/chat';

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

// Chat converter
const chatConverter = {
  fromFirestore: (snapshot: any, options?: any) => {
    const data = snapshot.data(options);
    
    // Process the lastMessage if it exists
    let lastMessage = data.lastMessage;
    if (lastMessage) {
      lastMessage = {
        ...lastMessage,
        timestamp: convertTimestampToString(lastMessage.timestamp)
      };
    }
    
    return {
      ...data,
      id: snapshot.id,
      lastUpdated: convertTimestampToString(data.lastUpdated) || new Date().toISOString(),
      createdAt: convertTimestampToString(data.createdAt),
      lastMessage
    } as Chat;
  },
  toFirestore: (chat: Partial<Chat>) => {
    const { id, ...chatData } = chat;
    
    // Only convert lastMessage timestamp if it exists
    const lastMessage = chat.lastMessage ? {
      ...chat.lastMessage,
      timestamp: chat.lastMessage.timestamp ? 
        Timestamp.fromDate(new Date(chat.lastMessage.timestamp)) : 
        serverTimestamp()
    } : undefined;
    
    return {
      ...chatData,
      lastMessage,
      lastUpdated: serverTimestamp()
    };
  }
};

// Message converter
const messageConverter = {
  fromFirestore: (snapshot: any, options?: any) => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      timestamp: convertTimestampToString(data.timestamp) || new Date().toISOString(),
    } as Message;
  },
  toFirestore: (message: Omit<Message, 'id'>) => {
    return {
      ...message,
      timestamp: message.timestamp ? 
        Timestamp.fromDate(new Date(message.timestamp)) : 
        serverTimestamp()
    };
  }
};

// Create a new chat
export const createChat = async (chat: Omit<Chat, 'id'>): Promise<Chat> => {
  const chatsCollection = collection(db, COLLECTIONS.CHATS);
  const chatData = {
    ...chat,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  };
  
  const docRef = await addDoc(chatsCollection, chatData);
  
  // Fetch the created document to properly convert timestamps
  const chatDoc = await getDoc(docRef);
  return chatConverter.fromFirestore(chatDoc);
};

// Get chat by ID
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  const chatDoc = doc(db, COLLECTIONS.CHATS, chatId);
  const snapshot = await getDoc(chatDoc);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return chatConverter.fromFirestore(snapshot);
};

// Get all chats for a user
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  const chatsCollection = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsCollection,
    where('participants', 'array-contains', userId),
    orderBy('lastUpdated', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => chatConverter.fromFirestore(doc));
};

// Subscribe to user chats
export const subscribeToUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const chatsCollection = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsCollection,
    where('participants', 'array-contains', userId),
    orderBy('lastUpdated', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => chatConverter.fromFirestore(doc));
    callback(chats);
  });
};

// Create a message
export const sendMessage = async (chatId: string, message: Omit<Message, 'id'>): Promise<Message> => {
  const messagesCollection = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
  const docRef = await addDoc(messagesCollection, messageConverter.toFirestore(message));
  
  // Update chat's lastUpdated and lastMessage
  const chatDoc = doc(db, COLLECTIONS.CHATS, chatId);
  await updateDoc(chatDoc, {
    lastUpdated: serverTimestamp(),
    lastMessage: {
      content: message.content,
      senderId: message.senderId,
      timestamp: serverTimestamp(),
      type: message.type
    }
  });
  
  // Get the created message with proper timestamp conversion
  const messageDoc = await getDoc(docRef);
  return messageConverter.fromFirestore(messageDoc);
};

// Get messages for a chat
export const getChatMessages = async (chatId: string, msgLimit = 50): Promise<Message[]> => {
  const messagesCollection = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
  const q = query(
    messagesCollection,
    orderBy('timestamp', 'desc'),
    limit(msgLimit)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => messageConverter.fromFirestore(doc))
    .reverse(); // Reverse to get oldest messages first
};

// Subscribe to chat messages
export const subscribeToChatMessages = (
  chatId: string, 
  callback: (messages: Message[]) => void,
  messageLimit = 50
) => {
  const messagesCollection = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
  const q = query(
    messagesCollection,
    orderBy('timestamp', 'asc'),
    limit(messageLimit)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => messageConverter.fromFirestore(doc));
    callback(messages);
  });
};

// Create a direct message chat between two users
export const createDirectMessageChat = async (
  userId1: string,
  userId2: string,
  userName1: string,
  userName2: string
): Promise<Chat> => {
  // Check if chat already exists
  const chatsCollection = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsCollection,
    where('type', '==', 'direct'),
    where('participants', 'array-contains', userId1)
  );
  
  const snapshot = await getDocs(q);
  const existingChat = snapshot.docs.find(doc => {
    const data = doc.data();
    return data.participants.includes(userId2);
  });
  
  if (existingChat) {
    return chatConverter.fromFirestore(existingChat);
  }
  
  // Create new direct message chat
  return createChat({
    type: 'direct',
    name: `${userName1}, ${userName2}`,
    participants: [userId1, userId2],
    meta: {
      userNames: {
        [userId1]: userName1,
        [userId2]: userName2
      }
    }
  });
};

// Create a channel chat
export const createChannelChat = async (
  name: string,
  description: string,
  creatorId: string
): Promise<Chat> => {
  return createChat({
    type: 'channel',
    name,
    description,
    participants: [creatorId],
    meta: {
      createdBy: creatorId
    }
  });
};

// Add user to chat
export const addUserToChat = async (chatId: string, userId: string): Promise<void> => {
  const chatDoc = doc(db, COLLECTIONS.CHATS, chatId);
  const chatSnapshot = await getDoc(chatDoc);
  
  if (!chatSnapshot.exists()) {
    throw new Error('Chat not found');
  }
  
  const chatData = chatSnapshot.data();
  const participants = chatData.participants || [];
  
  if (!participants.includes(userId)) {
    await updateDoc(chatDoc, {
      participants: [...participants, userId],
      lastUpdated: serverTimestamp()
    });
  }
};

// Remove user from chat
export const removeUserFromChat = async (chatId: string, userId: string): Promise<void> => {
  const chatDoc = doc(db, COLLECTIONS.CHATS, chatId);
  const chatSnapshot = await getDoc(chatDoc);
  
  if (!chatSnapshot.exists()) {
    throw new Error('Chat not found');
  }
  
  const chatData = chatSnapshot.data();
  const participants = chatData.participants || [];
  
  await updateDoc(chatDoc, {
    participants: participants.filter((id: string) => id !== userId),
    lastUpdated: serverTimestamp()
  });
};