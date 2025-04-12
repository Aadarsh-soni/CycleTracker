import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

// Create context
const TrackingContext = createContext();

/**
 * TrackingProvider - Provides cycling tracking functionality and state
 * 
 * @param {Object} props 
 * @param {React.ReactNode} props.children - Child components
 */
export const TrackingProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [stats, setStats] = useState({
    distance: 0,
    currentSpeed: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    duration: 0,
    startTime: null,
    endTime: null
  });
  
  // Refs
  const locationSubscription = useRef(null);
  const activityDocRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastLocationRef = useRef(null);
  
  // Get location permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'CycleTracker needs location permissions to track your rides.'
        );
      }
    })();
    
    // Cleanup on unmount
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);
  
  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  // Start tracking a new ride
  const startTracking = async () => {
    try {
      // Check if already tracking
      if (isTracking) return;
      
      // Check for location permissions again
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required to track your ride.');
      }
      
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      // Reset state
      setRoute([]);
      setStats({
        distance: 0,
        currentSpeed: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        duration: 0,
        startTime: new Date(),
        endTime: null
      });
      
      // Create a new activity document in Firestore
      if (user) {
        const activitiesRef = collection(db, 'activities', user.uid, 'rides');
        const docRef = await addDoc(activitiesRef, {
          startTime: serverTimestamp(),
          status: 'active',
          createdAt: serverTimestamp(),
        });
        activityDocRef.current = docRef;
      }
      
      // Set refs
      startTimeRef.current = new Date();
      lastLocationRef.current = location.coords;
      
      // Add first location to route
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        speed: location.coords.speed || 0,
        altitude: location.coords.altitude || 0
      };
      setRoute([locationData]);
      setCurrentLocation(locationData);
      
      // Start watching location
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5, // meters
        },
        handleLocationUpdate
      );
      
      setIsTracking(true);
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Error starting tracking:', error);
    }
  };
  
  // Handle new location updates
  const handleLocationUpdate = (location) => {
    try {
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        speed: location.coords.speed || 0,
        altitude: location.coords.altitude || 0
      };
      
      // Update current location
      setCurrentLocation(locationData);
      
      // Add to route
      setRoute(prevRoute => [...prevRoute, locationData]);
      
      // Calculate new stats
      updateStats(locationData);
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  };
  
  // Update tracking statistics
  const updateStats = (newLocation) => {
    setStats(prevStats => {
      // Calculate distance
      let newDistance = prevStats.distance;
      if (lastLocationRef.current) {
        const segmentDistance = calculateDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          newLocation.latitude,
          newLocation.longitude
        );
        
        // Only add if it's a reasonable distance (avoid GPS jumps)
        if (segmentDistance < 0.1) { // Less than 100m jump
          newDistance += segmentDistance;
        }
      }
      
      // Calculate current speed (convert m/s to km/h)
      const currentSpeed = newLocation.speed ? newLocation.speed * 3.6 : 0;
      
      // Calculate max speed
      const maxSpeed = Math.max(prevStats.maxSpeed, currentSpeed);
      
      // Calculate duration
      const now = new Date();
      const duration = (now - startTimeRef.current) / 1000; // in seconds
      
      // Calculate average speed
      const averageSpeed = duration > 0 ? (newDistance / (duration / 3600)) : 0;
      
      // Update last location
      lastLocationRef.current = newLocation;
      
      return {
        distance: newDistance,
        currentSpeed,
        averageSpeed,
        maxSpeed,
        duration,
        startTime: prevStats.startTime,
        endTime: null
      };
    });
  };
  
  // Pause tracking
  const pauseTracking = async () => {
    try {
      if (!isTracking) return;
      
      // Stop location subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      setIsTracking(false);
      
      // Save current state to Firestore
      if (user && activityDocRef.current) {
        await updateDoc(activityDocRef.current, {
          status: 'paused',
          duration: stats.duration,
          distance: stats.distance,
          averageSpeed: stats.averageSpeed,
          maxSpeed: stats.maxSpeed,
          lastUpdated: serverTimestamp(),
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pause tracking');
      console.error('Error pausing tracking:', error);
    }
  };
  
  // Resume tracking
  const resumeTracking = async () => {
    try {
      if (isTracking) return;
      
      // Start watching location again
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5, // meters
        },
        handleLocationUpdate
      );
      
      setIsTracking(true);
      
      // Update Firestore
      if (user && activityDocRef.current) {
        await updateDoc(activityDocRef.current, {
          status: 'active',
          lastUpdated: serverTimestamp(),
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resume tracking');
      console.error('Error resuming tracking:', error);
    }
  };
  
  // Stop tracking and save activity
  const stopTracking = async () => {
    try {
      // Stop location subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      // Update end time
      const endTime = new Date();
      setStats(prev => ({
        ...prev,
        endTime
      }));
      
      // Save final data to Firestore
      if (user && activityDocRef.current) {
        await updateDoc(activityDocRef.current, {
          status: 'completed',
          endTime: serverTimestamp(),
          duration: stats.duration,
          distance: stats.distance,
          averageSpeed: stats.averageSpeed,
          maxSpeed: stats.maxSpeed,
          route: route,
          summary: {
            topSpeed: stats.maxSpeed,
            averageSpeed: stats.averageSpeed,
            distance: stats.distance,
            duration: stats.duration,
            startTime: stats.startTime.toISOString(),
            endTime: endTime.toISOString()
          },
          lastUpdated: serverTimestamp(),
        });
      }
      
      // Reset state
      setIsTracking(false);
      activityDocRef.current = null;
      startTimeRef.current = null;
      lastLocationRef.current = null;
      
      return {
        ...stats,
        endTime,
        route: [...route]
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to save your ride');
      console.error('Error stopping tracking:', error);
      return null;
    }
  };
  
  // Discard current tracking session
  const discardTracking = async () => {
    try {
      // Stop location subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      // Mark as discarded in Firestore
      if (user && activityDocRef.current) {
        await updateDoc(activityDocRef.current, {
          status: 'discarded',
          lastUpdated: serverTimestamp(),
        });
      }
      
      // Reset state
      setIsTracking(false);
      setRoute([]);
      setStats({
        distance: 0,
        currentSpeed: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        duration: 0,
        startTime: null,
        endTime: null
      });
      
      activityDocRef.current = null;
      startTimeRef.current = null;
      lastLocationRef.current = null;
      
    } catch (error) {
      Alert.alert('Error', 'Failed to discard tracking session');
      console.error('Error discarding tracking:', error);
    }
  };

  // Export context value
  const value = {
    isTracking,
    currentLocation,
    route,
    stats,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    discardTracking
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
};

// Custom hook to use the tracking context
export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};

export default TrackingContext;