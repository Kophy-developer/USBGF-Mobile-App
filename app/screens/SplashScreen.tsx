import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';
import { getOnboardingSeen } from '../storage/flags';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  useEffect(() => {
    // Navigate after 2 seconds
    const timer = setTimeout(async () => {
      try {
        const onboardingSeen = await getOnboardingSeen();
        navigation.replace(onboardingSeen ? 'SignIn' : 'Onboarding');
      } catch (error) {
        // Default to onboarding if there's an error
        navigation.replace('Onboarding');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/USBGF_com_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="USBGF Logo"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.appName}>USBGF</Text>
          <Text style={styles.subtitle}>US Backgammon Federation</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['3xl'],
  },
  logoContainer: {
    marginBottom: theme.spacing['4xl'],
  },
  logo: {
    width: 200,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    ...theme.typography.title,
    color: theme.colors.textOnDark,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textOnDark,
    opacity: 0.8,
    textAlign: 'center',
  },
});