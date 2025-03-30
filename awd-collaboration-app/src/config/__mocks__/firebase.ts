import { jest } from '@jest/globals';
import type { 
  FirebaseApp, 
  FirebaseOptions 
} from 'firebase/app';
import type { 
  Auth, 
  User 
} from 'firebase/auth';
import type { 
  Firestore, 
  DocumentReference, 
  CollectionReference 
} from 'firebase/firestore';
import type { 
  FirebaseStorage, 
  StorageReference, 
  UploadTask 
} from 'firebase/storage';

// Mock App Configuration
const mockConfig: FirebaseOptions = {
  apiKey: 'test-api-key',
  authDomain: 'test-app.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456'
};

// Mock App
const mockApp: FirebaseApp = {
  name: '[DEFAULT]',
  options: mockConfig,
  automaticDataCollectionEnabled: false
};

// Mock Auth
const mockUser: User = {
  uid: 'test-user',
  email: 'test@example.com',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn()
} as unknown as User;

export const auth = {
  currentUser: mockUser,
  app: mockApp,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
} as unknown as Auth;

// Mock Storage
const mockStorageRef: Partial<StorageReference> = {
  fullPath: 'test/path',
  name: 'test-file',
  bucket: 'test-bucket',
  toString: () => 'test/path'
};

export const storage: FirebaseStorage = {
  app: mockApp,
  maxOperationRetryTime: 120000,
  maxUploadRetryTime: 600000,
  ref: jest.fn().mockReturnValue(mockStorageRef)
} as unknown as FirebaseStorage;

// Mock Firestore
const mockDocRef = {
  id: 'test-doc',
  path: 'test/test-doc',
  collection: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
} as unknown as DocumentReference;

const mockCollectionRef = {
  id: 'test-collection',
  path: 'test',
  doc: jest.fn().mockReturnValue(mockDocRef),
  add: jest.fn(),
  get: jest.fn()
} as unknown as CollectionReference;

export const db: Firestore = {
  app: mockApp,
  collection: jest.fn().mockReturnValue(mockCollectionRef),
  doc: jest.fn().mockReturnValue(mockDocRef),
  runTransaction: jest.fn(),
  batch: jest.fn()
} as unknown as Firestore;

// Storage paths and collection names
export const STORAGE_PATHS = {
  TASK_ATTACHMENTS: 'task-attachments'
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  CHATS: 'chats',
  MESSAGES: 'messages',
  EVENTS: 'events',
  WORKSPACES: 'workspaces',
  WORKSPACE_INVITATIONS: 'workspace-invitations'
} as const;

// Mock Firebase methods
export const initializeApp = jest.fn().mockReturnValue(mockApp);
export const getAuth = jest.fn().mockReturnValue(auth);
export const getFirestore = jest.fn().mockReturnValue(db);
export const getStorage = jest.fn().mockReturnValue(storage);
