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

// Helper function to check workspace membership
const checkWorkspaceMembership = async (userId: string, workspaceId: string): Promise<boolean> => {
  const workspaceDoc = doc(db, COLLECTIONS.WORKSPACES, workspaceId);
  const snapshot = await getDoc(workspaceDoc);
  
  if (!snapshot.exists()) {
    return false;
  }
  
  const workspace = snapshot.data();
  return workspace.members.some((member: any) => 
    member.userId === userId && member.status === 'active'
  );
};

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

// Create a new chat with workspace check
export const createChat = async (chat: Omit<Chat, 'id'>, userId: string): Promise<Chat> => {
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, chat.workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }

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

// Get chat by ID with workspace check
export const getChatById = async (chatId: string, userId: string): Promise<Chat | null> => {
  const chatDoc = doc(db, COLLECTIONS.CHATS, chatId);
  const snapshot = await getDoc(chatDoc);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const chat = chatConverter.fromFirestore(snapshot);
  
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, chat.workspaceId)) {
    throw new Error('User does not have access to this chat');
  }
  
  return chat;
};

// Get all chats for a user in a workspace
export const getWorkspaceChats = async (workspaceId: string, userId: string): Promise<Chat[]> => {
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }

  const chatsCollection = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsCollection,
    where('workspaceId', '==', workspaceId),
    where('participants', 'array-contains', userId),
    orderBy('lastUpdated', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => chatConverter.fromFirestore(doc));
};

// Subscribe to user chats in a workspace
export const subscribeToWorkspaceChats = (workspaceId: string, userId: string, callback: (chats: Chat[]) => void) => {
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

// Create a message with workspace check
export const sendMessage = async (chatId: string, message: Omit<Message, 'id'>, userId: string): Promise<Message> => {
  // Get the chat to check workspace access
  const chat = await getChatById(chatId, userId);
  if (!chat) {
    throw new Error('Chat not found');
  }

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

// Get messages for a chat with workspace check
export const getChatMessages = async (chatId: string, userId: string, msgLimit = 50): Promise<Message[]> => {
  // Get the chat to check workspace access
  const chat = await getChatById(chatId, userId);
  if (!chat) {
    throw new Error('Chat not found');
  }

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

// Subscribe to chat messages with workspace check
export const subscribeToChatMessages = async (
  chatId: string,
  userId: string,
  callback: (messages: Message[]) => void,
  messageLimit = 50
) => {
  // Get the chat to check workspace access
  const chat = await getChatById(chatId, userId);
  if (!chat) {
    throw new Error('Chat not found');
  }

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

// Create a direct message chat between two users in a workspace
export const createDirectMessageChat = async (
  workspaceId: string,
  userId1: string,
  userId2: string,
  userName1: string,
  userName2: string
): Promise<Chat> => {
  // Check if chat already exists in the workspace
  const chatsCollection = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsCollection,
    where('workspaceId', '==', workspaceId),
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
    workspaceId,
    type: 'direct',
    name: `${userName1}, ${userName2}`,
    participants: [userId1, userId2],
    meta: {
      userNames: {
        [userId1]: userName1,
        [userId2]: userName2
      }
    }
  }, userId1);
};

// Create a channel chat in a workspace
export const createChannelChat = async (
  workspaceId: string,
  name: string,
  description: string,
  creatorId: string
): Promise<Chat> => {
  return createChat({
    workspaceId,
    type: 'channel',
    name,
    description,
    participants: [creatorId],
    meta: {
      createdBy: creatorId
    }
  }, creatorId);
};

// Add user to chat with workspace membership check
export const addUserToChat = async (chatId: string, userToAddId: string, requestingUserId: string): Promise<void> => {
  // Get the chat to check workspace access
  const chat = await getChatById(chatId, requestingUserId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  // Verify the user to be added is also a workspace member
  if (!await checkWorkspaceMembership(userToAddId, chat.workspaceId)) {
    throw new Error('User to be added is not a member of this workspace');
  }

  const chatDoc = doc(db, COLLECTIONS.CHATS, chatId);
  const chatSnapshot = await getDoc(chatDoc);
  const participants = chatSnapshot.data()?.participants || [];
  
  if (!participants.includes(userToAddId)) {
    await updateDoc(chatDoc, {
      participants: [...participants, userToAddId],
      lastUpdated: serverTimestamp()
    });
  }
};

// Remove user from chat with workspace check
export const removeUserFromChat = async (chatId: string, userToRemoveId: string, requestingUserId: string): Promise<void> => {
  // Get the chat to check workspace access
  const chat = await getChatById(chatId, requestingUserId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  const chatDoc = doc(db, COLLECTIONS.CHATS, chatId);
  const chatSnapshot = await getDoc(chatDoc);
  const participants = chatSnapshot.data()?.participants || [];
  
  await updateDoc(chatDoc, {
    participants: participants.filter((id: string) => id !== userToRemoveId),
    lastUpdated: serverTimestamp()
  });
};
