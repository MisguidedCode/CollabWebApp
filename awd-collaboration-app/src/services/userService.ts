import { 
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
  } from 'firebase/firestore';
  import { db, COLLECTIONS } from '../config/firebase';
  import { User, UserRole } from '../types/auth';
  
  // Create a new user document
  export const createUserDocument = async (user: User): Promise<void> => {
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      roles: user.roles || { member: true },
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    
    await setDoc(userRef, userData);
  };
  
  // Get user data
  export const getUserData = async (userId: string): Promise<User | null> => {
    const userDoc = doc(db, COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(userDoc);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.data();
    return {
      uid: snapshot.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      roles: data.roles,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      lastLogin: data.lastLogin?.toDate().toISOString() || new Date().toISOString(),
    };
  };
  
  // Update user profile
  export const updateUserProfile = async (
    userId: string, 
    data: { displayName?: string; photoURL?: string }
  ): Promise<void> => {
    const userDoc = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userDoc, {
      ...data,
      updatedAt: serverTimestamp()
    });
  };
  
  // Update user roles
  export const updateUserRoles = async (
    userId: string,
    roles: UserRole
  ): Promise<void> => {
    const userDoc = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userDoc, {
      roles,
      updatedAt: serverTimestamp()
    });
  };
  
  // Update last login timestamp
  export const updateLastLogin = async (userId: string): Promise<void> => {
    const userDoc = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userDoc, {
      lastLogin: serverTimestamp()
    });
  };