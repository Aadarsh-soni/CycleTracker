import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

/**
 * Custom hook to use authentication context
 * 
 * This hook provides a convenient way to access the authentication context
 * throughout the application. It handles context checking and ensures the
 * hook is used within the AuthProvider component.
 * 
 * @returns {Object} Authentication context with the following properties:
 * @returns {Object} user - The current authenticated user or null if not logged in
 * @returns {boolean} loading - Whether authentication is in process
 * @returns {string} error - Authentication error message if any
 * @returns {Function} register - Register a new user with email and password
 * @returns {Function} login - Login with email and password
 * @returns {Function} logout - Sign out the current user
 * @returns {Function} resetPassword - Send password reset email
 * @returns {Function} updateUserProfile - Update user profile information
 * @returns {Function} updateSettings - Update user application settings
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;