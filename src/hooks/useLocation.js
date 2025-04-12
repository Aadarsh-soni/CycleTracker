import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useTracking } from '../contexts/TrackingContext';

/**
 * Custom hook for location tracking functionality
 * 
 * This hook handles requesting permissions, watching location updates,
 * and providing the current location data for use in components.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable location tracking
 * @param {Location.Accuracy} options.accuracy - Desired accuracy level
 * @param {number} options.timeInterval - Minimum time (ms) between updates
 * @param {number} options.distanceInterval - Minimum distance (m) between updates
 * @param {boolean} options.foregroundOnly - Whether to track in foreground only
 * @returns {Object} Location data and control functions
 */
const useLocation = ({
  enabled = false,
  accuracy = Location.Accuracy.BestForNavigation,
  timeInterval = 1000,
  distanceInterval = 5,
  foregroundOnly = true
} = {}) => {
  // State
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  
  // Reference to store the location subscription
  const locationSubscription = useRef(null);
  
  // Access tracking context for integration
  const trackingContext = useTracking();
  
  // Request location permissions on mount
  useEffect(() => {
    let isMounted = true;
    
    const requestPermissions = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (isMounted) {
          if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            setHasPermission(false);
            return;
          }
          
          setHasPermission(true);
          
          // Request background permissions if needed (iOS)
          if (!foregroundOnly && Platform.OS === 'ios') {
            const { status: backgroundStatus } = 
              await Location.requestBackgroundPermissionsAsync();
            
            if (backgroundStatus !== 'granted' && isMounted) {
              Alert.alert(
                'Limited Functionality',
                'Background location access was denied. Tracking will only work when app is open.'
              );
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          setErrorMsg(`Failed to get location permissions: ${error.message}`);
          setHasPermission(false);
        }
      }
    };
    
    requestPermissions();
    
    return () => {
      isMounted = false;
    };
  }, [foregroundOnly]);
  
  // Start/stop location tracking based on enabled prop
  useEffect(() => {
    let isMounted = true;
    
    const startLocationTracking = async () => {
      try {
        // Clean up existing subscription
        if (locationSubscription.current) {
          locationSubscription.current.remove();
          locationSubscription.current = null;
        }
        
        if (!hasPermission) return;
        
        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy
        });
        
        if (isMounted) {
          setLocation(currentLocation);
          
          // Start watching position if enabled
          if (enabled) {
            locationSubscription.current = await Location.watchPositionAsync(
              {
                accuracy,
                timeInterval,
                distanceInterval
              },
              (newLocation) => {
                if (isMounted) {
                  setLocation(newLocation);
                }
              }
            );
            
            setIsTracking(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          setErrorMsg(`Error getting location: ${error.message}`);
        }
      }
    };
    
    if (hasPermission && enabled) {
      startLocationTracking();
    } else if (!enabled) {
      // Stop tracking if disabled
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        setIsTracking(false);
      }
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [hasPermission, enabled, accuracy, timeInterval, distanceInterval]);
  
  /**
   * Get the current location once
   * @returns {Promise<Location.LocationObject>} Current location
   */
  const getCurrentLocation = async () => {
    try {
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy
      });
      
      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      setErrorMsg(`Error getting current location: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Start tracking location updates
   */
  const startTracking = async () => {
    try {
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }
      
      // Clean up existing subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }// fdsfkgjn
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval,
          distanceInterval
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
      
      setIsTracking(true);
    } catch (error) {
      setErrorMsg(`Error starting location tracking: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Stop tracking location updates
   */
  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      setIsTracking(false);
    }
  };
  
  /**
   * Format a raw coordinate into a Google Maps URL
   * @param {Object} coords - Coordinates object with latitude and longitude
   * @returns {string} Google Maps URL
   */
  const getGoogleMapsUrl = (coords) => {
    if (!coords || !coords.latitude || !coords.longitude) return '';
    return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
  };
  
  /**
   * Calculate distance between two coordinates in kilometers
   * @param {Object} coords1 - First coordinates {latitude, longitude}
   * @param {Object} coords2 - Second coordinates {latitude, longitude}
   * @returns {number} Distance in kilometers
   */
  const calculateDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return 0;
    
    const lat1 = coords1.latitude;
    const lon1 = coords1.longitude;
    const lat2 = coords2.latitude;
    const lon2 = coords2.longitude;
    
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
  
  /**
   * Get a human-readable address from coordinates
   * @param {Object} coords - Coordinates {latitude, longitude}
   * @returns {Promise<string>} Human-readable address
   */
  const getAddressFromCoordinates = async (coords) => {
    try {
      if (!coords) return '';
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ]
          .filter(Boolean)
          .join(', ');
      }
      
      return '';
    } catch (error) {
      console.error('Error getting address:', error);
      return '';
    }
  };
  
  return {
    location,
    errorMsg,
    hasPermission,
    isTracking,
    getCurrentLocation,
    startTracking,
    stopTracking,
    getGoogleMapsUrl,
    calculateDistance,
    getAddressFromCoordinates
  };
};

export default useLocation;