import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { setUser, setLoading, setError, logout } from '../store/slices/authSlice';
import { getUserData, createUserDocument, updateLastLogin } from '../services/userService';
import { User } from '../types/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const [loading, setLocalLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLocalLoading(true);
      try {
        if (firebaseUser) {
          // Get user data from Firestore
          let userData = await getUserData(firebaseUser.uid);
          
          // If user document doesn't exist, create it
          if (!userData) {
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              roles: { member: true }, // Default role
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };
            
            await createUserDocument(newUser);
            userData = newUser;
          } else {
            // Update last login timestamp
            await updateLastLogin(firebaseUser.uid);
          }
          
          dispatch(setUser(userData));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        dispatch(setError((error as Error).message));
      } finally {
        setLocalLoading(false);
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  const signUp = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        roles: { member: true }, // Default role
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      await createUserDocument(newUser);
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle updating the user state
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
    } catch (error) {
      dispatch(setError((error as Error).message));
      throw error;
    }
  };

  return {
    signUp,
    signIn,
    signOut: signOutUser,
    loading,
  };
};