import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';

// Navigation types
type MainDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

interface MainDashboardScreenProps {
  navigation: MainDashboardScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const buttonWidth = (width - theme.spacing['3xl'] * 2 - theme.spacing.lg) / 2;

export const MainDashboardScreen: React.FC<MainDashboardScreenProps> = ({ navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleMatches = () => {
    navigation.navigate('Matches' as any);
  };

  const handleRegister = () => {
    navigation.navigate('Dashboard' as any, { screen: 'Registration' } as any);
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

  const handleAccountBalance = () => {
    navigation.navigate('Dashboard' as any, { screen: 'AccountBalance' } as any);
  };

  const handleMembershipPlans = () => {
    navigation.navigate('Dashboard' as any, { screen: 'MembershipPlans' } as any);
  };

  return (
		<SafeAreaView style={styles.container} edges={['top', 'left','right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen((v) => !v)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/USBGF_com_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="USBGF Logo"
          />
        </View>
        
        {/* Invisible spacer to balance the hamburger menu and center the logo */}
        <View style={styles.spacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          {/* Row 1 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleMatches}
            >
              <Text style={styles.buttonIcon}>🎲</Text>
              <Text style={styles.buttonText}>Matches</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleEvents}
            >
              <Text style={styles.buttonIcon}>📅</Text>
              <Text style={styles.buttonText}>Events</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleProfile}
            >
              <Text style={styles.buttonIcon}>👤</Text>
              <Text style={styles.buttonText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleStats}
            >
              <Text style={styles.buttonIcon}>📊</Text>
              <Text style={styles.buttonText}>Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.featureButton, styles.greyButton]} 
              onPress={handleBrackets}
            >
              <Text style={styles.buttonIcon}>🏆</Text>
              <Text style={styles.buttonText}>Brackets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.featureButton, styles.blueButton]} 
              onPress={handleMessage}
            >
              <Text style={styles.buttonIcon}>💬</Text>
              <Text style={styles.buttonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

				{/* Quick Actions removed as requested */}
			</ScrollView>

      {isMenuOpen && (
        <>
          {/* Overlay to capture outside taps */}
          <Pressable style={styles.backdrop} onPress={() => setIsMenuOpen(false)} accessibilityLabel="Close menu" />
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('Dashboard' as any, { screen: 'Events' } as any);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.menuItemText}>View Events</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
          <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('Dashboard' as any, { screen: 'AccountBalance' } as any);
              }}
              accessibilityRole="button"
          >
              <Text style={styles.menuItemText}>Account Balance</Text>
          </TouchableOpacity>
            <View style={styles.menuDivider} />
          <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('Dashboard' as any, { screen: 'MembershipPlans' } as any);
              }}
              accessibilityRole="button"
          >
              <Text style={styles.menuItemText}>Membership Plan</Text>
          </TouchableOpacity>
            <View style={styles.menuDivider} />
          <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.reset({ index: 0, routes: [{ name: 'AuthStack' as any }] });
              }}
              accessibilityRole="button"
          >
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
          </TouchableOpacity>
        </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface, // White background as per design
    minHeight: 80, // Reduced height
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 900,
  },
  menuButton: {
    padding: theme.spacing.sm,
    width: 50, // Fixed width to balance with spacer
    zIndex: 10, // Ensure it's above the logo container
  },
  menuIcon: {
		fontSize: 30,
    color: theme.colors.primary, // Dark blue icon for white background
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    pointerEvents: 'none', // Allow touches to pass through to buttons below
  },
  logo: {
		width: 180,
		height: 60,
	},
  menuDropdown: {
    position: 'absolute',
    top: 80, // below header
    left: theme.spacing['3xl'],
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    backgroundColor: '#FFFFFF',
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  logoutText: {
    color: '#B91C1C',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  spacer: {
    width: 50, // Same width as menuButton to balance
    zIndex: 10, // Ensure it's above the logo container
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
  buttonIcon: {
		fontSize: 44,
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  buttonText: {
    ...theme.typography.button,
    fontSize: 18,
    color: theme.colors.surface,
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
