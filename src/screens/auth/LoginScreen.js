import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import Input from '../../components/ui/Input';
import Button from '../../components/Button';

// Context
import { AuthContext } from '../../context/AuthContext';

// Services
import { loginUser } from '../../services/auth';

// Styles
import colors from '../../styles/colors';
import typography from '../../styles/typography';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { setUser } = useContext(AuthContext);

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!email.trim()) {
      formErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      formErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = await loginUser(email, password);
      setUser(userData);
      // Navigation will be handled by AppNavigator based on auth state
    } catch (error) {
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      Alert.alert('Login Failed', errorMessage);
      console.log('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Cycle Track</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue tracking your cycling progress</Text>

          <View style={styles.formContainer}>
            <Input
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({...errors, email: ''});
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="mail-outline"
              error={errors.email}
            />

            <Input
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({...errors, password: ''});
                }
              }}
              secureTextEntry={!showPassword}
              iconName="lock-closed-outline"
              rightIcon={
                <TouchableOpacity onPress={toggleShowPassword}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={colors.textLight} 
                  />
                </TouchableOpacity>
              }
              error={errors.password}
            />

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button 
              title={isLoading ? "Signing In..." : "Sign In"}
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
            />

            {isLoading && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            )}
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.noAccountText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    ...typography.h2,
    color: colors.primary,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
  },
  forgotPasswordText: {
    ...typography.caption,
    color: colors.primary,
  },
  loginButton: {
    marginTop: 10,
  },
  loader: {
    marginTop: 20,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  noAccountText: {
    ...typography.body,
    color: colors.textLight,
    marginRight: 5,
  },
  registerText: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default Login;