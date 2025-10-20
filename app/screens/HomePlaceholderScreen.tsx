import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';

type HomePlaceholderNavigationProp = StackNavigationProp<RootStackParamList, 'HomePlaceholder'>;

interface HomePlaceholderScreenProps {
  navigation: HomePlaceholderNavigationProp;
}

export const HomePlaceholderScreen: React.FC<HomePlaceholderScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/USBGF_com_logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="USBGF Logo"
        />
        
        <Text style={styles.title}>Welcome to USBGF!</Text>
        
        <Text style={styles.subtitle}>
          You've successfully signed in. This is a placeholder screen for the main app content.
        </Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Coming Soon:</Text>
          <Text style={styles.feature}>• Membership Management</Text>
          <Text style={styles.feature}>• Event Calendar</Text>
          <Text style={styles.feature}>• Match Tracking</Text>
          <Text style={styles.feature}>• Community Features</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['3xl'],
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: theme.spacing['4xl'],
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['4xl'],
    lineHeight: 24,
  },
  featuresContainer: {
    alignItems: 'flex-start',
  },
  featuresTitle: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  feature: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
});
