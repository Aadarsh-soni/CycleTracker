import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, StyleSheet, View } from 'react-native';

// Navigation
import AuthNavigator from './AuthNavigator';

// Context
import { AuthContext } from '../context/AuthContext';

// Dashboard Screens
import Dashboard from '../screens/dashboard/Dashboard';
import History from '../screens/dashboard/History';
import Profile from '../screens/dashboard/Profile';

// Tracking Screens
import ActiveTracking from '../screens/tracking/ActiveTracking';
import Summary from '../screens/tracking/Summary';

// Settings Screen
import Settings from '../screens/settings/Settings';

// Styles
import colors from '../styles/colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main dashboard tab navigator
const DashboardTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="History" component={History} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

// Main app stack for navigating between tabs and tracking screens
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardTabs" component={DashboardTabs} />
      <Stack.Screen name="ActiveTracking" component={ActiveTracking} />
      <Stack.Screen name="Summary" component={Summary} />
    </Stack.Navigator>
  );
};

// Root navigator that handles auth state
const AppNavigator = () => {
  const { user, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        {/* You could add a loading spinner here */}
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;