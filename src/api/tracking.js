import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { calculateDistance, calculateSpeed } from '../utils/formatters';

// Tracking service for handling all cycling activity tracking operations
export const trackingService = {
  // Store tracking session data
  trackingData: {
    isTracking: false,
    startTime: null,
    endTime: null,
    duration: 0,
    distance: 0,
    currentSpeed: 0,
    maxSpeed: 0,
    minSpeed: Infinity,
    avgSpeed: 0,
    locationHistory: [],
    timer: null,
    currentLocation: null,
    routeSnapshot: null,
  },

  // Start a new tracking session
  startTracking: async (userId) => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Location permission denied' };
      }

      // Start background location updates
      await Location.startLocationUpdatesAsync('tracking-task', {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 5, // Update every 5 meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Cycle Tracker',
          notificationBody: 'Tracking your cycling activity',
        },
      });

      // Reset tracking data
      trackingService.trackingData = {
        isTracking: true,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        distance: 0,
        currentSpeed: 0,
        maxSpeed: 0,
        minSpeed: Infinity,
        avgSpeed: 0,
        locationHistory: [],
        timer: null,
        currentLocation: null,
        routeSnapshot: null,
      };

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      trackingService.trackingData.currentLocation = location;
      trackingService.trackingData.locationHistory.push({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        speed: location.coords.speed || 0,
        altitude: location.coords.altitude || 0,
      });

      // Cache tracking ID for recovery in case of app crash
      const trackingId = firebase.firestore().collection('tracking_sessions').doc().id;
      await AsyncStorage.setItem('current_tracking_id', trackingId);
      await AsyncStorage.setItem('tracking_start_time', trackingService.trackingData.startTime.toString());

      return { success: true, trackingId };
    } catch (error) {
      console.error('Start tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update tracking with new location data
  updateTracking: (location) => {
    if (!trackingService.trackingData.isTracking) return;

    const { coords, timestamp } = location;
    const { latitude, longitude, speed, altitude } = coords;
    
    // Add to location history
    const locationPoint = {
      latitude,
      longitude,
      timestamp,
      speed: speed || 0,
      altitude: altitude || 0,
    };
    
    trackingService.trackingData.locationHistory.push(locationPoint);
    trackingService.trackingData.currentLocation = location;
    
    // Calculate distance
    if (trackingService.trackingData.locationHistory.length > 1) {
      const prevLocation = trackingService.trackingData.locationHistory[trackingService.trackingData.locationHistory.length - 2];
      const distDelta = calculateDistance(
        prevLocation.latitude,
        prevLocation.longitude,
        latitude,
        longitude
      );
      
      trackingService.trackingData.distance += distDelta;
    }
    
    // Update speed calculations
    const currentSpeed = speed ? speed * 3.6 : 0; // Convert m/s to km/h
    trackingService.trackingData.currentSpeed = currentSpeed;
    
    // Update max and min speed if the current speed is valid (greater than zero)
    if (currentSpeed > 0) {
      trackingService.trackingData.maxSpeed = Math.max(trackingService.trackingData.maxSpeed, currentSpeed);
      trackingService.trackingData.minSpeed = Math.min(trackingService.trackingData.minSpeed, currentSpeed);
    }
    
    // Calculate average speed
    const totalTime = (timestamp - trackingService.trackingData.startTime) / 1000 / 3600; // hours
    trackingService.trackingData.avgSpeed = totalTime > 0 ? trackingService.trackingData.distance / totalTime : 0;
    
    // Calculate duration
    trackingService.trackingData.duration = (timestamp - trackingService.trackingData.startTime) / 1000; // seconds
    
    // Cache location history periodically to handle app crashes
    if (trackingService.trackingData.locationHistory.length % 10 === 0) {
      AsyncStorage.setItem('location_history', JSON.stringify(trackingService.trackingData.locationHistory));
    }
  },

  // Stop the current tracking session and save data
  stopTracking: async (userId) => {
    try {
      if (!trackingService.trackingData.isTracking) {
        return { success: false, error: 'No active tracking session' };
      }

      // Stop location updates
      await Location.stopLocationUpdatesAsync('tracking-task');

      // Set end time and final calculations
      trackingService.trackingData.endTime = new Date();
      trackingService.trackingData.isTracking = false;

      // If minSpeed was never set (always remained at Infinity), set it to 0
      if (trackingService.trackingData.minSpeed === Infinity) {
        trackingService.trackingData.minSpeed = 0;
      }

      // Get tracking ID from AsyncStorage
      const trackingId = await AsyncStorage.getItem('current_tracking_id');

      // Create the tracking data object to save to Firestore
      const trackingDataToSave = {
        userId,
        startTime: firebase.firestore.Timestamp.fromDate(trackingService.trackingData.startTime),
        endTime: firebase.firestore.Timestamp.fromDate(trackingService.trackingData.endTime),
        duration: trackingService.trackingData.duration,
        distance: trackingService.trackingData.distance,
        maxSpeed: trackingService.trackingData.maxSpeed,
        minSpeed: trackingService.trackingData.minSpeed,
        avgSpeed: trackingService.trackingData.avgSpeed,
        locationHistory: trackingService.trackingData.locationHistory,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Save to Firestore
      await firebase.firestore().collection('tracking_sessions').doc(trackingId).set(trackingDataToSave);

      // Update user statistics in Firestore
      const userRef = firebase.firestore().collection('users').doc(userId);
      await firebase.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User does not exist!');
        }

        const userData = userDoc.data();
        transaction.update(userRef, {
          rides: (userData.rides || 0) + 1,
          totalDistance: (userData.totalDistance || 0) + trackingService.trackingData.distance,
          totalTime: (userData.totalTime || 0) + trackingService.trackingData.duration,
          lastRideDate: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Clean up AsyncStorage
      await AsyncStorage.removeItem('current_tracking_id');
      await AsyncStorage.removeItem('tracking_start_time');
      await AsyncStorage.removeItem('location_history');

      return { 
        success: true, 
        trackingData: { 
          ...trackingService.trackingData,
          id: trackingId,
        } 
      };
    } catch (error) {
      console.error('Stop tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Pause tracking temporarily
  pauseTracking: async () => {
    try {
      if (!trackingService.trackingData.isTracking) {
        return { success: false, error: 'No active tracking session' };
      }

      // Stop location updates but keep tracking data
      await Location.stopLocationUpdatesAsync('tracking-task');
      
      trackingService.trackingData.isTracking = false;
      
      return { success: true };
    } catch (error) {
      console.error('Pause tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Resume tracking after pause
  resumeTracking: async () => {
    try {
      if (trackingService.trackingData.isTracking) {
        return { success: false, error: 'Tracking is already active' };
      }

      // Restart location updates
      await Location.startLocationUpdatesAsync('tracking-task', {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 5,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Cycle Tracker',
          notificationBody: 'Tracking your cycling activity',
        },
      });

      trackingService.trackingData.isTracking = true;
      
      return { success: true };
    } catch (error) {
      console.error('Resume tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's tracking history
  getTrackingHistory: async (userId, limit = 10) => {
    try {
      const snapshot = await firebase.firestore()
        .collection('tracking_sessions')
        .where('userId', '==', userId)
        .orderBy('startTime', 'desc')
        .limit(limit)
        .get();

      const history = [];
      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return { success: true, history };
    } catch (error) {
      console.error('Get tracking history error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get detailed data for a specific tracking session
  getTrackingDetail: async (trackingId) => {
    try {
      const doc = await firebase.firestore()
        .collection('tracking_sessions')
        .doc(trackingId)
        .get();

      if (!doc.exists) {
        return { success: false, error: 'Tracking session not found' };
      }

      return { success: true, trackingData: { id: doc.id, ...doc.data() } };
    } catch (error) {
      console.error('Get tracking detail error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current tracking stats (for active tracking)
  getCurrentStats: () => {
    if (!trackingService.trackingData.isTracking && !trackingService.trackingData.startTime) {
      return null;
    }

    return {
      duration: trackingService.trackingData.duration,
      distance: trackingService.trackingData.distance,
      currentSpeed: trackingService.trackingData.currentSpeed,
      maxSpeed: trackingService.trackingData.maxSpeed,
      minSpeed: trackingService.trackingData.minSpeed === Infinity ? 0 : trackingService.trackingData.minSpeed,
      avgSpeed: trackingService.trackingData.avgSpeed,
      locationHistory: trackingService.trackingData.locationHistory,
      isTracking: trackingService.trackingData.isTracking,
    };
  },

  // Delete a tracking session
  deleteTrackingSession: async (trackingId, userId) => {
    try {
      // Get the tracking data first to update user stats
      const trackingDoc = await firebase.firestore()
        .collection('tracking_sessions')
        .doc(trackingId)
        .get();

      if (!trackingDoc.exists) {
        return { success: false, error: 'Tracking session not found' };
      }

      const trackingData = trackingDoc.data();

      // Verify this session belongs to the user
      if (trackingData.userId !== userId) {
        return { success: false, error: 'Not authorized to delete this session' };
      }

      // Delete the tracking document
      await firebase.firestore().collection('tracking_sessions').doc(trackingId).delete();

      // Update user statistics in Firestore (reduce the totals)
      const userRef = firebase.firestore().collection('users').doc(userId);
      await firebase.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User does not exist!');
        }

        const userData = userDoc.data();
        transaction.update(userRef, {
          rides: Math.max((userData.rides || 0) - 1, 0),
          totalDistance: Math.max((userData.totalDistance || 0) - trackingData.distance, 0),
          totalTime: Math.max((userData.totalTime || 0) - trackingData.duration, 0),
        });
      });

      return { success: true };
    } catch (error) {
      console.error('Delete tracking session error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if there was an interrupted tracking session (app crash recovery)
  checkForInterruptedTracking: async () => {
    try {
      const trackingId = await AsyncStorage.getItem('current_tracking_id');
      const startTimeString = await AsyncStorage.getItem('tracking_start_time');
      const locationHistoryString = await AsyncStorage.getItem('location_history');

      if (!trackingId || !startTimeString) {
        return { interrupted: false };
      }

      const startTime = new Date(startTimeString);
      const locationHistory = locationHistoryString ? JSON.parse(locationHistoryString) : [];

      return {
        interrupted: true,
        trackingId,
        startTime,
        locationHistory,
      };
    } catch (error) {
      console.error('Check interrupted tracking error:', error);
      return { interrupted: false, error: error.message };
    }
  },

  // Resume an interrupted tracking session
  resumeInterruptedTracking: async (interruptedData) => {
    try {
      const { trackingId, startTime, locationHistory } = interruptedData;

      // Reset tracking data with saved information
      trackingService.trackingData = {
        isTracking: true,
        startTime: new Date(startTime),
        endTime: null,
        duration: 0,
        distance: 0,
        currentSpeed: 0,
        maxSpeed: 0,
        minSpeed: Infinity,
        avgSpeed: 0,
        locationHistory: locationHistory || [],
        timer: null,
        currentLocation: null,
        routeSnapshot: null,
      };

      // Recalculate distance from location history
      if (locationHistory && locationHistory.length > 1) {
        let totalDistance = 0;
        for (let i = 1; i < locationHistory.length; i++) {
          const prev = locationHistory[i - 1];
          const curr = locationHistory[i];
          
          totalDistance += calculateDistance(
            prev.latitude,
            prev.longitude,
            curr.latitude,
            curr.longitude
          );
        }
        
        trackingService.trackingData.distance = totalDistance;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      trackingService.trackingData.currentLocation = location;

      // Calculate speeds from history
      if (locationHistory && locationHistory.length > 0) {
        for (const point of locationHistory) {
          if (point.speed > 0) {
            const speedKmh = point.speed * 3.6;
            trackingService.trackingData.maxSpeed = Math.max(trackingService.trackingData.maxSpeed, speedKmh);
            trackingService.trackingData.minSpeed = Math.min(trackingService.trackingData.minSpeed, speedKmh);
          }
        }
      }

      // Restart location tracking
      await Location.startLocationUpdatesAsync('tracking-task', {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 5,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Cycle Tracker',
          notificationBody: 'Tracking your cycling activity',
        },
      });

      return { success: true, trackingId };
    } catch (error) {
      console.error('Resume interrupted tracking error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user statistics summary
  getUserStats: async (userId) => {
    try {
      const userDoc = await firebase.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      
      // Calculate additional stats
      const stats = {
        totalRides: userData.rides || 0,
        totalDistance: userData.totalDistance || 0,
        totalTime: userData.totalTime || 0,
        avgDistance: userData.rides > 0 ? userData.totalDistance / userData.rides : 0,
        avgTime: userData.rides > 0 ? userData.totalTime / userData.rides : 0,
        avgSpeed: userData.totalTime > 0 ? (userData.totalDistance / (userData.totalTime / 3600)) : 0,
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Get user stats error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Register the background task for location tracking
if (Location.hasStartedLocationUpdatesAsync) {
  Location.hasStartedLocationUpdatesAsync('tracking-task').then(hasStarted => {
    if (!hasStarted) {
      Location.registerTaskAsync('tracking-task', {
        taskName: 'tracking-task',
        taskType: Location.TaskType.BACKGROUND,
        options: {
          accuracy: Location.Accuracy.BestForNavigation,
          showsBackgroundLocationIndicator: true,
        },
      });
    }
  }).catch(error => {
    console.error('Error checking location task status:', error);
  });
}

export default trackingService;