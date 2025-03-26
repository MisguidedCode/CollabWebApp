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
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  return undefined;
};

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

// Convert Firestore data to Task object
const taskConverter = {
  fromFirestore: (snapshot: any, options?: any) => {
    const data = snapshot.data(options);
    
    return {
      ...data,
      id: snapshot.id,
      createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
      dueDate: convertTimestampToString(data.dueDate),
      updatedAt: convertTimestampToString(data.updatedAt),
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

// Create a new task with workspace check
export const createTask = async (task: Omit<Task, 'id'>, userId: string): Promise<Task> => {
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, task.workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }
  
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const docRef = doc(tasksCollection);
  const newTask = { ...task, id: docRef.id };
  
  await setDoc(docRef, taskConverter.toFirestore(newTask));
  
  const snapshot = await getDoc(docRef);
  return taskConverter.fromFirestore(snapshot);
};

// Get a task by ID with workspace check
export const getTaskById = async (taskId: string, userId: string): Promise<Task | null> => {
  const taskDoc = doc(db, COLLECTIONS.TASKS, taskId);
  const snapshot = await getDoc(taskDoc);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const task = taskConverter.fromFirestore(snapshot);
  
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, task.workspaceId)) {
    throw new Error('User does not have access to this task');
  }
  
  return task;
};

// Get tasks for a workspace
export const getWorkspaceTasks = async (workspaceId: string, userId: string): Promise<Task[]> => {
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }
  
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksCollection,
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
};

// Update a task with workspace check
export const updateTaskInFirestore = async (task: Task, userId: string): Promise<void> => {
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, task.workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }
  
  const taskDoc = doc(db, COLLECTIONS.TASKS, task.id);
  await updateDoc(taskDoc, taskConverter.toFirestore(task));
};

// Delete a task with workspace check
export const deleteTaskFromFirestore = async (taskId: string, userId: string): Promise<void> => {
  const task = await getTaskById(taskId, userId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, task.workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }
  
  const taskDoc = doc(db, COLLECTIONS.TASKS, taskId);
  await deleteDoc(taskDoc);
};

// Update task status with workspace check
export const updateTaskStatusInFirestore = async (
  taskId: string,
  status: TaskStatus,
  userId: string
): Promise<void> => {
  const task = await getTaskById(taskId, userId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, task.workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }
  
  const taskDoc = doc(db, COLLECTIONS.TASKS, taskId);
  await updateDoc(taskDoc, { 
    status,
    updatedAt: serverTimestamp()
  });
};

// Subscribe to workspace tasks
export const subscribeToWorkspaceTasks = (workspaceId: string, userId: string, callback: (tasks: Task[]) => void) => {
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksCollection,
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    // Verify workspace membership before sending update
    checkWorkspaceMembership(userId, workspaceId).then(isMember => {
      if (isMember) {
        const tasks = snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
        callback(tasks);
      } else {
        console.error('User lost access to workspace');
        callback([]);
      }
    });
  });
};

// Get tasks by status within a workspace
export const getTasksByStatus = async (workspaceId: string, status: TaskStatus, userId: string): Promise<Task[]> => {
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }
  
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksCollection,
    where('workspaceId', '==', workspaceId),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
};

// Get tasks by assignee within a workspace
export const getTasksByAssignee = async (workspaceId: string, assigneeId: string, userId: string): Promise<Task[]> => {
  // Verify workspace membership
  if (!await checkWorkspaceMembership(userId, workspaceId)) {
    throw new Error('User is not a member of this workspace');
  }
  
  const tasksCollection = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksCollection,
    where('workspaceId', '==', workspaceId),
    where('assignedTo', '==', assigneeId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => taskConverter.fromFirestore(doc));
};
