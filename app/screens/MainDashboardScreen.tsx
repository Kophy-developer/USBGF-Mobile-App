import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';
import { AppHeader } from '../components/AppHeader';
import { buildPrimaryMenuItems } from '../utils/menuItems';

type MainDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

interface MainDashboardScreenProps {
  navigation: MainDashboardScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const buttonWidth = (width - theme.spacing['3xl'] * 2 - theme.spacing.lg) / 2;

export const MainDashboardScreen: React.FC<MainDashboardScreenProps> = ({ navigation }) => {
  const menuItems = useMemo(() => buildPrimaryMenuItems(navigation), [navigation]);

  const handleMatches = () => {
    navigation.navigate('Matches' as any);
  };

  const handleProfile = () => {
    navigation.navigate('Profile' as any);
  };

  const handleStats = () => {
    navigation.navigate('Dashboard' as any, { screen: 'Stats' } as any);
  };

  const handleBrackets = () => {
    navigation.navigate('Dashboard' as any, { screen: 'Brackets' } as any);
  };

  const handleMessage = () => {
    navigation.navigate('Messages' as any);
  };

  const handleEvents = () => {
    navigation.navigate('Dashboard' as any, { screen: 'Events' } as any);
  };

  return (
		<SafeAreaView style={styles.container} edges={['top', 'left','right']}>
      <AppHeader menuItems={menuItems} padTop={false} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.featureGrid}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleMatches}
            >
              <Image source={require('../assets/icons/Matches.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>Matches</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleEvents}
            >
              <Image source={require('../assets/icons/Event.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>Events</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleProfile}
            >
              <Image source={require('../assets/icons/Profile.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleStats}
            >
              <Image source={require('../assets/icons/Stats.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>Stats</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleBrackets}
            >
              <Image source={require('../assets/icons/Brackets.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>Brackets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleMessage}
            >
              <Image source={require('../assets/icons/Message.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>Message</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['3xl'],
  },
  featureGrid: {
    marginTop: theme.spacing['2xl'],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  featureButton: {
    width: buttonWidth,
		height: buttonWidth, // make square using existing width
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greyButton: {
    backgroundColor: '#3D3935',
  },
  blueButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonImage: {
    width: 48,
    height: 48,
    marginBottom: theme.spacing.sm,
  },
  buttonText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: theme.colors.surface,
    fontFamily: 'DunbarTall-Regular',
    textAlign: 'center',
  },
  quickActions: {
    marginTop: theme.spacing['3xl'],
    marginBottom: theme.spacing['2xl'],
  },
  quickActionButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
});
