import firebase from 'firebase/app';
import 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase authentication service for handling user auth operations
export const authService = {
  // Register a new user with email and password
  register: async (email, password, username) => {
    try {
      // Create user with Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      
      // Add additional user info to Firestore
      if (userCredential.user) {
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
          username,
          email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          rides: 0,
          totalDistance: 0,
          totalTime: 0,
        });

        // Save user data to AsyncStorage for offline access
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: userCredential.user.uid,
          email,
          username,
        }));
      }
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Log in existing user with email and password
  login: async (email, password) => {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      
      // Get additional user data from Firestore
      const userDoc = await firebase.firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .get();
      
      const userData = userDoc.data();
      
      // Save user data to AsyncStorage for offline access
      await AsyncStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email,
        username: userData.username,
      }));
      
      return { success: true, user: { ...userCredential.user, ...userData } };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Log out current user
  logout: async () => {
    try {
      await firebase.auth().signOut();
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password for user
  resetPassword: async (email) => {
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user from AsyncStorage (for persisting login state)
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Update user profile
  updateProfile: async (userId, userData) => {
    try {
      await firebase.firestore().collection('users').doc(userId).update(userData);
      
      // Update AsyncStorage as well
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        await AsyncStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...userData,
        }));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const user = await authService.getCurrentUser();
    return user !== null;
  },

  // Listen for auth state changes
  onAuthStateChanged: (callback) => {
    return firebase.auth().onAuthStateChanged(callback);
  }
};

export default authService;