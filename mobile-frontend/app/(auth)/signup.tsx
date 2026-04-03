import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Title, Body, Label, Caption } from '@/components/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/use-auth';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();

  const validateFullName = (name: string): boolean => {
    if (!name.trim()) {
      setFullNameError('Full name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setFullNameError('Name must be at least 2 characters');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPwd: string): boolean => {
    if (!confirmPwd) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPwd !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSignUp = async () => {
    // Validate all fields
    const isFullNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isFullNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName.trim());
      
      if (error) {
        Alert.alert(
          'Sign Up Failed',
          error.message || 'Unable to create account. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Account Created',
          'Your account has been created successfully. You can now sign in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Title style={styles.title}>Create Account</Title>
          <Body style={styles.subtitle}>Sign up to start tracking inventory</Body>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Juan dela Cruz"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (fullNameError) validateFullName(text);
            }}
            onBlur={() => validateFullName(fullName)}
            error={fullNameError}
            autoCapitalize="words"
            autoCorrect={false}
            required
          />

          <Input
            label="Email"
            placeholder="your.email@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onBlur={() => validateEmail(email)}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            required
          />

          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text);
              // Re-validate confirm password if it was already filled
              if (confirmPassword) validateConfirmPassword(confirmPassword);
            }}
            onBlur={() => validatePassword(password)}
            error={passwordError}
            helperText="Must be at least 6 characters"
            secureTextEntry
            required
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) validateConfirmPassword(text);
            }}
            onBlur={() => validateConfirmPassword(confirmPassword)}
            error={confirmPasswordError}
            secureTextEntry
            required
          />

          <Button
            onPress={handleSignUp}
            disabled={isLoading}
            loading={isLoading}
            style={styles.signUpButton}
          >
            Create Account
          </Button>
        </View>

        <View style={styles.footer}>
          <Body style={styles.footerText}>Already have an account?</Body>
          <Button
            variant="ghost"
            onPress={handleLoginPress}
            disabled={isLoading}
            size="small"
          >
            Sign In
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  form: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  signUpButton: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    color: Colors.textSecondary,
  },
});
