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

export const useAuth = () => {
  const dispatch = useDispatch();
  const [loading, setLocalLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLocalLoading(true);
      if (firebaseUser) {
        // Convert Firebase user to our User type
        const user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          roles: { member: true }, // Default role
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          lastLogin: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
        };
        dispatch(setUser(user));
      } else {
        dispatch(logout());
      }
      setLocalLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  const signUp = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      dispatch(setError((error as Error).message));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      dispatch(setError((error as Error).message));
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
    } catch (error) {
      dispatch(setError((error as Error).message));
    }
  };

  return {
    signUp,
    signIn,
    signOut: signOutUser,
    loading,
  };
};