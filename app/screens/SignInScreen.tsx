import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { OAuthButton } from '../components/OAuthButton';
import { AuthDivider } from '../components/AuthDivider';

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

interface SignInScreenProps {
  navigation: SignInScreenNavigationProp;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email or username is required';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('HomePlaceholder');
    }, 1200);
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('HomePlaceholder');
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('HomePlaceholder');
    }, 1000);
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'This feature will be available soon.');
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('LegalWebview', { type: 'privacy' });
  };

  const handleTermsOfService = () => {
    navigation.navigate('LegalWebview', { type: 'terms' });
  };

  const isFormValid = email.trim() && password.trim() && password.length >= 6;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/USBGF_com_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="USBGF Logo"
          />
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <TextField
            label="Email or username"
            placeholder="Enter your email or username"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword(!showPassword)}
            error={errors.password}
          />

          <Button
            title="Sign in"
            onPress={handleSignIn}
            variant="primary"
            loading={isLoading}
            disabled={!isFormValid}
          />
        </View>

        {/* OAuth */}
        <View style={styles.oauthContainer}>
          <AuthDivider />
          
          <OAuthButton
            provider="apple"
            onPress={handleAppleSignIn}
          />
          
          <View style={styles.oauthSpacing} />
          
          <OAuthButton
            provider="google"
            onPress={handleGoogleSignIn}
          />
        </View>

        {/* Footer Links */}
        <View style={styles.footerContainer}>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.linkText}>Forgot password</Text>
          </TouchableOpacity>
          
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={handlePrivacyPolicy}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>•</Text>
            <TouchableOpacity onPress={handleTermsOfService}>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing['3xl'],
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing['2xl'],
  },
  logo: {
    width: 120,
    height: 72,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  formContainer: {
    marginBottom: theme.spacing['3xl'],
  },
  oauthContainer: {
    marginBottom: theme.spacing['3xl'],
  },
  oauthSpacing: {
    height: theme.spacing.lg,
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: theme.spacing['4xl'],
  },
  linkText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  separator: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.sm,
  },
});
