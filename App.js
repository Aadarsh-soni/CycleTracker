import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';

// Navigation
import Navigation from './navigation';

// Styles
import colors from './styles/colors';

// Ignore specific logs
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer',
  'Non-serializable values were found in the navigation state',
]);

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = React.useState(false);

  // Load resources function
  const loadResourcesAsync = async () => {
    try {
      // Load fonts
      await Font.loadAsync({
        'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
        'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
        'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
        'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
      });
      
      // Cache images
      await Asset.loadAsync([
        require('./assets/logo.png'),
        require('./assets/splash.png'),
        require('./assets/icon.png'),
        // Add other images that need to be preloaded
      ]);
      
      // Additional setup that might be needed
      await new Promise(resolve => setTimeout(resolve, 1000)); // Artificial delay for smoother startup
      
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  };

  // Setup effect
  React.useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, images etc.
        await loadResourcesAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (isReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <Navigation />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});