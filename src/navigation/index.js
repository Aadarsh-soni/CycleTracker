import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Navigation
import AppNavigator from './AppNavigator';

// Context Providers
import { AuthProvider } from '../contexts/AuthContext';
import { TrackingProvider } from '../contexts/TrackingContext';

// Configuration
import { initializeFirebase } from '../config/firebase';

// Styles
import colors from '../config/colors';

// Keep the splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

const Navigation = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Firebase
        initializeFirebase();
        
        // Simulate some pre-loading tasks
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TrackingProvider>
          <AppNavigator />
        </TrackingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default Navigation;