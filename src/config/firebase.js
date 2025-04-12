// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth/react-native";

/**
 * Firebase configuration for the CycleTracker app
 * 
 * Note: In a production environment, these values should be stored in environment
 * variables or a secure configuration system. For this example, they're included
 * in the file directly.
 * 
 * Setup instructions:
 * 1. Create a Firebase project at firebase.google.com
 * 2. Register your app in the Firebase console
 * 3. Enable Authentication (Email/Password at minimum)
 * 4. Create a Firestore database
 * 5. Set up storage if needed for profile pictures
 * 6. Copy your web app configuration and replace the values below
 */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMNTmGB-CLp9w7g8od3nJ2w8cv9jc-5Yg",
  authDomain: "cycle-tracker-6343b.firebaseapp.com",
  projectId: "cycle-tracker-6343b",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Export the Firebase services for use in the app
export { app, auth, db, storage };

/**
 * Firebase Database Structure:
 * 
 * users/
 *  ├── {userId}/
 *  │    ├── profile/
 *  │    │    ├── displayName: string
 *  │    │    ├── email: string
 *  │    │    ├── photoURL: string
 *  │    │    └── createdAt: timestamp
 *  │    │
 *  │    └── settings/
 *  │         ├── distanceUnit: "km" | "mi"
 *  │         └── notifications: boolean
 *  │
 *  └── activities/
 *       └── {userId}/
 *            └── {activityId}/
 *                 ├── startTime: timestamp
 *                 ├── endTime: timestamp
 *                 ├── duration: number (seconds)
 *                 ├── distance: number
 *                 ├── averageSpeed: number
 *                 ├── maxSpeed: number
 *                 ├── route: {
 *                 │    points: [
 *                 │      {
 *                 │        latitude: number,
 *                 │        longitude: number,
 *                 │        timestamp: number,
 *                 │        speed: number,
 *                 │        altitude: number
 *                 │      },
 *                 │      ... more points
 *                 │    ]
 *                 └── summary: {
 *                      topSpeed: number,
 *                      averageSpeed: number,
 *                      calories: number (estimated),
 *                      elevationGain: number
 *                    }
 */

export default {
  app,
  auth,
  db,
  storage
};