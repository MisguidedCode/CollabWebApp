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
  orderBy
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { Task, TaskStatus } from '../types/task';

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

// Convert Firestore data to Task object
const taskConverter = {
  fromFirestore: (snapshot: any, options?: any) => {
    const data = snapshot.data(options);
    
    // Safely handle all timestamp fields
    return {
      ...data,
      id: snapshot.id,
      createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
      dueDate: convertTimestampToString(data.dueDate),
      updatedAt: convertTimestampToString(data.updatedAt),
      // Ensure attachments have proper date formatting
      attachments: Array.isArray(data.attachments) 
        ? data.attachments.map((attachment: any) => ({
            ...attachment,
            uploadedAt: convertTimestampToString(attachment.uploadedAt) || new Date().toISOString()
          }))
        : []
    } as Task;
  },
  toFirestore: (task: Task) => {
    const { id, ...taskData } = task;
    return {
      ...taskData,
      createdAt: task.createdAt ? Timestamp.fromDate(new Date(task.createdAt)) : serverTimestamp(),
      dueDate: task.dueDate ? Timestamp.fromDate(new Date(task.dueDate)) : null,
      updatedAt: serverTimestamp(),
    };
  }
};

// Create a new task
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const docRef = doc(tasksCollection);
  const newTask = { ...task, id: docRef.id };
  
  await setDoc(docRef, taskConverter.toFirestore(newTask));
  
  // Get the document back to ensure timestamps are converted
  const snapshot = await getDoc(docRef);
  return taskConverter.fromFirestore(snapshot);
};

// Get a task by ID
export const getTaskById = async (taskId: string): Promise<Task | null> => {
  const taskDoc = doc(db, COLLECTIONS.TASKS, taskId);
  const snapshot = await getDoc(taskDoc);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return taskConverter.fromFirestore(snapshot);
};

// Get all tasks
export const getAllTasks = async (): Promise<Task[]> => {
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(tasksCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
};

// Update a task
export const updateTaskInFirestore = async (task: Task): Promise<void> => {
  const taskDoc = doc(db, COLLECTIONS.TASKS, task.id);
  await updateDoc(taskDoc, taskConverter.toFirestore(task));
};

// Delete a task
export const deleteTaskFromFirestore = async (taskId: string): Promise<void> => {
  const taskDoc = doc(db, COLLECTIONS.TASKS, taskId);
  await deleteDoc(taskDoc);
};

// Update task status
export const updateTaskStatusInFirestore = async (taskId: string, status: TaskStatus): Promise<void> => {
  const taskDoc = doc(db, COLLECTIONS.TASKS, taskId);
  await updateDoc(taskDoc, { 
    status,
    updatedAt: serverTimestamp()
  });
};

// Subscribe to tasks changes
export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(tasksCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
    callback(tasks);
  });
};

// Get tasks by status
export const getTasksByStatus = async (status: TaskStatus): Promise<Task[]> => {
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksCollection,
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
};

// Get tasks by assignee
export const getTasksByAssignee = async (userId: string): Promise<Task[]> => {
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksCollection,
    where('assignedTo', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
};