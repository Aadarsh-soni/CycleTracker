import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
  Alert
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../config/colors';

/**
 * Custom MapView component for displaying routes and current location
 * 
 * @param {Array} routeCoordinates - Array of coordinates for the route line
 * @param {Object} initialRegion - Initial map region
 * @param {boolean} showCurrentLocation - Whether to show and track current location
 * @param {boolean} followUser - Whether map should follow user's location
 * @param {Object} startMarker - Coordinates for start marker
 * @param {Object} endMarker - Coordinates for end marker
 * @param {function} onRegionChange - Function to call when map region changes
 * @param {boolean} interactive - Whether map is interactive (zoomable, pannable)
 * @param {Object} style - Additional styles for the map container
 * @param {string} routeColor - Color of the route line
 * @param {number} routeWidth - Width of the route line
 * @param {boolean} fitToCoordinates - Whether to fit map to show all coordinates
 * @param {number} zoomLevel - Custom zoom level
 */
const CycleMapView = ({
  routeCoordinates = [],
  initialRegion = null,
  showCurrentLocation = false,
  followUser = false,
  startMarker = null,
  endMarker = null,
  onRegionChange,
  interactive = true,
  style = {},
  routeColor = colors.primary,
  routeWidth = 4,
  fitToCoordinates = true,
  zoomLevel = 15,
}) => {
  // Refs
  const mapRef = useRef(null);
  
  // State
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [defaultRegion, setDefaultRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Request location permissions
  useEffect(() => {
    const getLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            "Location Permission",
            "Location permission is required to show your position on the map.",
            [{ text: "OK" }]
          );
          return;
        }
        
        if (showCurrentLocation) {
          getCurrentLocation();
        }
      } catch (error) {
        console.error('Error getting location permission:', error);
      }
    };

    getLocationPermission();
  }, []);

  // Watch location updates
  useEffect(() => {
    let locationSubscription = null;
    
    if (hasLocationPermission && showCurrentLocation) {
      getCurrentLocation();
      
      locationSubscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation(location.coords);
          
          if (followUser && mapRef.current && mapReady) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        }
      );
    }
    
    return () => {
      if (locationSubscription) {
        locationSubscription.then(sub => sub.remove());
      }
    };
  }, [hasLocationPermission, showCurrentLocation, followUser, mapReady]);

  // Fit to coordinates when route changes
  useEffect(() => {
    if (
      mapRef.current && 
      mapReady && 
      routeCoordinates.length > 1 && 
      fitToCoordinates
    ) {
      fitMapToCoordinates();
    }
  }, [routeCoordinates, mapReady]);

  // Set initial region if provided
  useEffect(() => {
    if (initialRegion) {
      setDefaultRegion(initialRegion);
    } else if (routeCoordinates.length > 0) {
      // Use first coordinate in route if no initial region provided
      setDefaultRegion({
        latitude: routeCoordinates[0].latitude,
        longitude: routeCoordinates[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [initialRegion, routeCoordinates]);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      if (!hasLocationPermission) return;
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setCurrentLocation(location.coords);
      
      if (!initialRegion && !routeCoordinates.length) {
        setDefaultRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Fit map to show all coordinates
  const fitMapToCoordinates = () => {
    if (mapRef.current && routeCoordinates.length > 1) {
      // Include start and end markers in the coordinates to fit
      const coordinatesToFit = [...routeCoordinates];
      
      if (startMarker) {
        coordinatesToFit.push(startMarker);
      }
      
      if (endMarker) {
        coordinatesToFit.push(endMarker);
      }
      
      // If current location is available and should be shown, include it
      if (currentLocation && showCurrentLocation) {
        coordinatesToFit.push({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }
      
      mapRef.current.fitToCoordinates(coordinatesToFit, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Center map on current location
  const centerOnCurrentLocation = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Handle map ready event
  const handleMapReady = () => {
    setMapReady(true);
    
    // Fit to coordinates on map ready if there's a route
    if (routeCoordinates.length > 1 && fitToCoordinates) {
      setTimeout(fitMapToCoordinates, 500);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        showsUserLocation={showCurrentLocation}
        showsMyLocationButton={false}
        showsCompass={interactive}
        showsScale={interactive}
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={false}
        showsPointsOfInterest={false}
        zoomEnabled={interactive}
        scrollEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        toolbarEnabled={interactive}
        moveOnMarkerPress={false}
        onRegionChange={onRegionChange}
        onMapReady={handleMapReady}
        mapType="standard"
      >
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={routeWidth}
            strokeColor={routeColor}
            lineCap="round"
            lineJoin="round"
          />
        )}
        
        {startMarker && (
          <Marker
            coordinate={startMarker}
            pinColor="green"
            title="Start"
          />
        )}
        
        {endMarker && (
          <Marker
            coordinate={endMarker}
            pinColor="red"
            title="Finish"
          />
        )}
      </MapView>
      
      {showCurrentLocation && hasLocationPermission && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={centerOnCurrentLocation}
        >
          <View style={styles.locationButtonInner}>
            <View style={styles.locationIcon}>
              <View style={styles.locationIconDot} />
            </View>
          </View>
        </TouchableOpacity>
      )}
      
      {interactive && (
        <TouchableOpacity
          style={styles.fitButton}
          onPress={fitMapToCoordinates}
        >
          <Text style={styles.fitButtonText}>Fit Route</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  locationButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  fitButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fitButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CycleMapView;