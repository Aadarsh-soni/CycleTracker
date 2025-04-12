import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import Input from '../../components/ui/Input';
import Button from '../../components/Button';

// Services
import { sendPasswordResetEmail } from '../../services/auth';

// Styles
import colors from '../../styles/colors';
import typography from '../../styles/typography';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    setValidationError('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setEmailSent(true);
    } catch (error) {
      // Handle errors without exposing sensitive information
      Alert.alert(
        'Error',
        'Unable to send password reset email. Please check your email address and try again.',
        [{ text: 'OK' }]
      );
      console.log('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
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

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            {!emailSent && (
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            )}
          </View>

          {!emailSent ? (
            <View style={styles.formContainer}>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setValidationError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                iconName="mail-outline"
                error={validationError}
              />

              <Button 
                title={isLoading ? "Sending..." : "Send Reset Link"}
                onPress={handleResetPassword}
                disabled={isLoading}
                style={styles.button}
              />

              {isLoading && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
              )}
            </View>
          ) : (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
              <Text style={styles.successText}>
                Password reset email sent! Check your inbox for instructions.
              </Text>
              <Button
                title="Back to Login"
                onPress={() => navigation.navigate('Login')}
                style={styles.button}
              />
            </View>
          )}
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
  header: {
    marginBottom: 30,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
  },
  formContainer: {
    width: '100%',
  },
  button: {
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successText: {
    ...typography.body,
    textAlign: 'center',
    marginVertical: 20,
    color: colors.text,
  },
});

export default ForgotPassword;