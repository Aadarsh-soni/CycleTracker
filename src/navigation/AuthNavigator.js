import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';

// Auth Screens
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import Welcome from '../screens/auth/Welcome';

// Styles
import colors from '../styles/colors';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyle: styles.cardStyle,
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0, // for Android
          shadowOpacity: 0, // for iOS
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={Welcome} 
        options={{ animationTypeForReplace: 'pop' }}
      />
      <Stack.Screen 
        name="Login" 
        component={Login} 
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={Register} 
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  cardStyle: {
    backgroundColor: colors.background,
  },
});

export default AuthNavigator;