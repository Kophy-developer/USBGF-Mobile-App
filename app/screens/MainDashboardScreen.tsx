import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';
import { AppHeader } from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';

type MainDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

interface MainDashboardScreenProps {
  navigation: MainDashboardScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const buttonWidth = (width - theme.spacing['3xl'] * 2 - theme.spacing.lg) / 2.2;

export const MainDashboardScreen: React.FC<MainDashboardScreenProps> = ({ navigation }) => {
  const handleABTMatches = () => {
    navigation.navigate('Matches' as any, { viewType: 'ABT' } as any);
  };

  const handleOnlineMatches = () => {
    navigation.navigate('Matches' as any, { viewType: 'ONLINE' } as any);
  };

  const handleStats = () => {
    navigation.navigate('Dashboard' as any, { screen: 'Stats' } as any);
  };

  const handleBrackets = () => {
    navigation.navigate('Dashboard' as any, { screen: 'Brackets' } as any);
  };

  const handleABTEvents = () => {
    navigation.navigate('Events' as any, { initialViewType: 'ABT' } as any);
  };

  const handleOnlineEvents = () => {
    navigation.navigate('Events' as any, { initialViewType: 'ONLINE' } as any);
  };

  const handleCalendar = () => {
    navigation.navigate('ABTCalendar' as any);
  };

  const handleSchedule = () => {
    navigation.navigate('Schedule' as any);
  };

  return (
		<View style={styles.wrapper}>
		<SafeAreaView style={styles.container} edges={['top', 'left','right']}>
        <View style={{ marginTop: 10, zIndex: 1000, elevation: 1000, backgroundColor: '#FFFFFF' }}>
      <AppHeader padTop={false} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.featureGrid}>
          {/* Row 1: ABT Matches, Online Matches */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleABTMatches}
            >
              <Image source={require('../assets/icons/Matches.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>ABT Matches</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleOnlineMatches}
            >
              <Ionicons name="laptop-outline" size={48} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Online Matches</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: ABT Events, Online Events */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleABTEvents}
            >
              <Text style={[styles.abtIconText]}>ABT</Text>
              <Text style={styles.buttonText}>ABT Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleOnlineEvents}
            >
              <Image
                source={require('../assets/USBGF_logo_white.png')}
                style={[styles.buttonImage, styles.buttonImageLarge]}
                resizeMode="contain"
              />
              <Text style={styles.buttonText}>Online Events</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3: Brackets, Stats */}
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
              onPress={handleStats}
            >
              <Image source={require('../assets/icons/Stats.png')} style={styles.buttonImage} resizeMode="contain" />
              <Text style={styles.buttonText}>Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4: Calendar, ABT Schedule */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleCalendar}
            >
              <Ionicons name="calendar-outline" size={48} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleSchedule}
            >
              <Ionicons name="list-outline" size={48} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>ABT Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

			</ScrollView>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Explicitly set white to prevent gradient
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Explicitly set white to prevent gradient
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Explicitly set white to prevent gradient
  },
  scrollContent: {
    paddingHorizontal: theme.spacing['3xl'],
    backgroundColor: '#FFFFFF', // Explicitly set white to prevent gradient
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
		height: buttonWidth * 0.9, // slightly shorter to fit 4 rows
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
    width: 42,
    height: 42,
    marginBottom: theme.spacing.sm,
  },
  buttonImageLarge: {
    width: 78,
    height: 78,
  },
  buttonIcon: {
    marginBottom: theme.spacing.sm,
  },
  abtIconText: {
    ...theme.typography.heading,
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.heading.fontFamily,
    transform: [{ skewX: '-10deg' }, { scaleX: 1.12 }],
  },
  buttonText: {
    ...theme.typography.heading,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: theme.colors.surface,
    fontFamily: theme.typography.heading.fontFamily,
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
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
  },
});
