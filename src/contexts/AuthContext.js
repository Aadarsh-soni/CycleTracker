import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Create context
const AuthContext = createContext();

/**
 * AuthProvider - Provides authentication state and methods to the app
 * 
 * @param {Object} props 
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Get additional user data from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // Combine auth user with firestore data
            setUser({
              ...currentUser,
              ...userDoc.data()
            });
          } else {
            // Just use auth user data if no firestore data exists
            setUser(currentUser);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Register a new user
  const register = async (email, password, displayName) => {
    try {
      setLoading(true);
      setError(null);

      // Create the user in Firebase Auth
      const { user: newUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user's display name
      await updateProfile(newUser, { displayName });

      // Create a user document in Firestore
      const userDocRef = doc(db, 'users', newUser.uid);
      await setDoc(userDocRef, {
        email,
        displayName,
        createdAt: new Date().toISOString(),
        settings: {
          distanceUnit: 'km',
          notifications: true
        }
      });

      return newUser;
    } catch (err) {
      setError(err.message);
      Alert.alert('Registration Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login an existing user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user: currentUser } = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      return currentUser;
    } catch (err) {
      setError(err.message);
      Alert.alert('Login Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout the current user
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      Alert.alert('Logout Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset',
        'Check your email for password reset instructions'
      );
    } catch (err) {
      setError(err.message);
      Alert.alert('Password Reset Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);

      // Update auth profile if display name or photo URL is provided
      if (updates.displayName || updates.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName || auth.currentUser.displayName,
          photoURL: updates.photoURL || auth.currentUser.photoURL
        });
      }

      // Update user document in firestore
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, updates, { merge: true });

      // Refresh user object
      const userDoc = await getDoc(userDocRef);
      setUser({
        ...auth.currentUser,
        ...userDoc.data()
      });

    } catch (err) {
      setError(err.message);
      Alert.alert('Profile Update Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user settings
  const updateSettings = async (settings) => {
    try {
      setLoading(true);
      setError(null);

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { settings }, { merge: true });

      // Refresh user object
      const userDoc = await getDoc(userDocRef);
      setUser({
        ...auth.currentUser,
        ...userDoc.data()
      });

    } catch (err) {
      setError(err.message);
      Alert.alert('Settings Update Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value to be provided
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    updateSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;