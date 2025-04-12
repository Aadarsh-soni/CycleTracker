import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook for processing and calculating cycling statistics
 * 
 * This hook provides functionality to calculate various statistics
 * from cycling data, including speed metrics, distance calculations,
 * and performance analysis.
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.route - Array of location points with coordinates and timestamps
 * @param {number} options.duration - Total duration in seconds
 * @param {string} options.unit - Distance unit ('km' or 'mi')
 * @returns {Object} Calculated statistics and processing functions
 */
const useStats = ({ 
  route = [], 
  duration = 0, 
  unit = 'km' 
} = {}) => {
  // Get user settings
  const { user } = useAuth();
  const preferredUnit = user?.settings?.distanceUnit || unit;
  
  // State for calculated stats
  const [stats, setStats] = useState({
    distance: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    minSpeed: Infinity,
    elevationGain: 0,
    caloriesBurned: 0,
    speedData: [],
    altitudeData: [],
    pacesData: []
  });

  // Calculate distance between two coordinates
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
    const distanceKm = R * c; // Distance in km
    
    return preferredUnit === 'mi' ? distanceKm * 0.621371 : distanceKm;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // Convert speed from m/s to km/h or mph
  const formatSpeed = (speedMs) => {
    if (!speedMs) return 0;
    const speedKmh = speedMs * 3.6;
    return preferredUnit === 'mi' ? speedKmh * 0.621371 : speedKmh;
  };

  // Calculate calories burned based on duration, distance, and estimated MET value
  // MET = Metabolic Equivalent of Task
  const calculateCalories = (durationSec, distanceKm, averageSpeedKmh) => {
    // Rough estimate using MET values for cycling
    // https://sites.google.com/site/compendiumofphysicalactivities/
    
    let metValue;
    
    // Estimate MET based on average speed
    if (averageSpeedKmh < 16) {
      metValue = 4.0; // Leisure, 10-15.9 km/h
    } else if (averageSpeedKmh < 20) {
      metValue = 6.8; // Moderate effort, 16-19.9 km/h
    } else if (averageSpeedKmh < 25) {
      metValue = 8.0; // Vigorous effort, 20-24.9 km/h
    } else {
      metValue = 10.0; // Racing/very fast, 25+ km/h
    }
    
    // Standard formula: calories = MET * 3.5 * weight(kg) * duration(hr) / 200
    // Using 70kg as default weight for estimation
    const weight = user?.settings?.weight || 70; // kg
    const durationHr = durationSec / 3600;
    
    return Math.round(metValue * 3.5 * weight * durationHr / 200 * 100);
  };

  // Calculate total elevation gain from route data
  const calculateElevationGain = (routeData) => {
    if (!routeData || routeData.length < 2) return 0;
    
    let totalGain = 0;
    
    for (let i = 1; i < routeData.length; i++) {
      const currentAlt = routeData[i].altitude || 0;
      const prevAlt = routeData[i-1].altitude || 0;
      
      // Only count positive elevation changes
      if (currentAlt > prevAlt) {
        totalGain += (currentAlt - prevAlt);
      }
    }
    
    return totalGain;
  };

  // Calculate pace (time per distance unit)
  const calculatePace = (speedKmh) => {
    if (!speedKmh || speedKmh === 0) return Infinity;
    
    // Minutes per km/mi
    const minutesPerUnit = 60 / speedKmh;
    
    // Format as MM:SS
    const minutes = Math.floor(minutesPerUnit);
    const seconds = Math.floor((minutesPerUnit - minutes) * 60);
    
    return {
      minutes,
      seconds,
      formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`
    };
  };

  // Process route data to calculate all stats
  const processRouteData = (routeData) => {
    if (!routeData || routeData.length < 2) {
      setStats({
        distance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        minSpeed: 0,
        elevationGain: 0,
        caloriesBurned: 0,
        speedData: [],
        altitudeData: [],
        pacesData: []
      });
      return;
    }
    
    // Calculate total distance
    let totalDistance = 0;
    let maxSpeed = 0;
    let minSpeed = Infinity;
    let speedSum = 0;
    let speedCount = 0;
    
    const speedData = [];
    const altitudeData = [];
    const pacesData = [];
    
    for (let i = 1; i < routeData.length; i++) {
      const prevPoint = routeData[i-1];
      const currentPoint = routeData[i];
      
      // Distance calculation
      const segmentDistance = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        currentPoint.latitude,
        currentPoint.longitude
      );
      
      // Skip GPS jumps (unrealistic distances)
      if (segmentDistance > 0.1) continue;
      
      totalDistance += segmentDistance;
      
      // Speed processing
      const speed = currentPoint.speed ? formatSpeed(currentPoint.speed) : 0;
      
      if (speed > 0) {
        maxSpeed = Math.max(maxSpeed, speed);
        minSpeed = Math.min(minSpeed, speed);
        speedSum += speed;
        speedCount++;
        
        // Add to speed dataset for charts
        speedData.push({
          timestamp: new Date(currentPoint.timestamp).getTime(),
          speed: speed.toFixed(1)
        });
        
        // Add to pace dataset
        const pace = calculatePace(speed);
        if (pace.minutes < 60) { // Filter out unrealistic paces
          pacesData.push({
            timestamp: new Date(currentPoint.timestamp).getTime(),
            pace: pace.minutes + (pace.seconds / 60)
          });
        }
      }
      
      // Altitude processing
      if (currentPoint.altitude) {
        altitudeData.push({
          timestamp: new Date(currentPoint.timestamp).getTime(),
          altitude: currentPoint.altitude.toFixed(1)
        });
      }
    }
    
    // Calculate average speed
    const averageSpeed = speedCount > 0 ? speedSum / speedCount : 0;
    
    // Calculate elevation gain
    const elevationGain = calculateElevationGain(routeData);
    
    // Calculate calories burned
    const caloriesBurned = calculateCalories(
      duration,
      totalDistance,
      averageSpeed
    );
    
    // Set calculated stats
    setStats({
      distance: totalDistance.toFixed(2),
      averageSpeed: averageSpeed.toFixed(1),
      maxSpeed: maxSpeed.toFixed(1),
      minSpeed: minSpeed === Infinity ? 0 : minSpeed.toFixed(1),
      elevationGain: elevationGain.toFixed(1),
      caloriesBurned,
      speedData,
      altitudeData,
      pacesData
    });
  };

  // Process route data whenever it changes
  useEffect(() => {
    processRouteData(route);
  }, [route, duration, preferredUnit]);

  // Derived stats with proper formatting
  const formattedStats = useMemo(() => {
    const distanceUnit = preferredUnit === 'km' ? 'km' : 'mi';
    const speedUnit = preferredUnit === 'km' ? 'km/h' : 'mph';
    
    // Calculate average pace
    const avgSpeed = parseFloat(stats.averageSpeed);
    const averagePace = calculatePace(avgSpeed);
    
    return {
      ...stats,
      formattedDistance: `${stats.distance} ${distanceUnit}`,
      formattedAvgSpeed: `${stats.averageSpeed} ${speedUnit}`,
      formattedMaxSpeed: `${stats.maxSpeed} ${speedUnit}`,
      formattedMinSpeed: `${stats.minSpeed} ${speedUnit}`,
      formattedElevation: `${stats.elevationGain} m`,
      formattedCalories: `${stats.caloriesBurned} cal`,
      averagePace: averagePace.formatted,
      distanceUnit,
      speedUnit
    };
  }, [stats, preferredUnit]);

  // Helper for converting between km and miles
  const convertDistance = (distance, toUnit) => {
    if (toUnit === 'km' && preferredUnit === 'mi') {
      return (distance / 0.621371).toFixed(2);
    } else if (toUnit === 'mi' && preferredUnit === 'km') {
      return (distance * 0.621371).toFixed(2);
    }
    return distance;
  };

  return {
    ...formattedStats,
    processRouteData,
    calculateDistance,
    formatSpeed,
    calculateCalories,
    calculatePace,
    convertDistance,
    unit: preferredUnit
  };
};

export default useStats;