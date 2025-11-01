import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingCarousel } from '../screens/OnboardingCarousel';
import { SignInScreen } from '../screens/SignInScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { LegalWebview } from '../screens/LegalWebview';
import { HomePlaceholderScreen } from '../screens/HomePlaceholderScreen';

// Import new main app screens
import { MainDashboardScreen } from '../screens/MainDashboardScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { MembershipProfileScreen } from '../screens/MembershipProfileScreen';
import { AccountBalanceScreen } from '../screens/AccountBalanceScreen';
import { MembershipPlansScreen } from '../screens/MembershipPlansScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { BracketsScreen } from '../screens/BracketsScreen';

// Auth Stack Param List
export type AuthStackParamList = {
  SignIn: undefined;
  PrivacyPolicy: undefined;
  LegalWebview: { type: 'bylaws' };
};

// Main App Tab Param List
export type MainTabParamList = {
  Dashboard: undefined;
  Matches: undefined;
  Profile: undefined;
  Messages: undefined;
};

// Root Stack Param List
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  AuthStack: undefined;
  MainApp: undefined;
  Events: undefined;
  MembershipProfile: undefined;
  AccountBalance: undefined;
  MembershipPlans: undefined;
  Registration: undefined;
  Payment: { planKey: string; billing: 'annual' | 'monthly' };
  Contact: { name: string; message: string };
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator();

// Auth Stack Navigator
const AuthStackNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <AuthStack.Screen name="LegalWebview" component={LegalWebview} />
    </AuthStack.Navigator>
  );
};

// Home stack keeps bottom tabs visible across pages like Events, Registration, etc.
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={MainDashboardScreen} />
      <HomeStack.Screen name="Events" component={EventsScreen} />
      <HomeStack.Screen name="Registration" component={RegistrationScreen} />
      <HomeStack.Screen name="AccountBalance" component={AccountBalanceScreen} />
      <HomeStack.Screen name="MembershipPlans" component={MembershipPlansScreen} />
      <HomeStack.Screen name="Payment" component={PaymentScreen} />
      <HomeStack.Screen name="Stats" component={StatsScreen} />
      <HomeStack.Screen name="Brackets" component={BracketsScreen} />
    </HomeStack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16, // adds clear space from the bottom edge
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: '#111111',
          marginTop: -2, // bring label slightly closer to icon
        },
        tabBarActiveTintColor: '#1A1A2E',
        tabBarInactiveTintColor: '#5A5A5A',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color, marginBottom: -2 }}>🌐</Text>
          ),
          // use global label style for consistent sizing
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color, marginBottom: -2 }}>🎲</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={MembershipProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color, marginBottom: -2 }}>👤</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color, marginBottom: -2 }}>💬</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const Navigation: React.FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#1A1A2E" />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingCarousel} />
          <Stack.Screen name="AuthStack" component={AuthStackNavigator} />
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="AccountBalance" component={AccountBalanceScreen} />
          <Stack.Screen name="MembershipPlans" component={MembershipPlansScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="Registration" component={RegistrationScreen} />
          {/* Keep HomePlaceholder for now as fallback */}
          <Stack.Screen name="HomePlaceholder" component={HomePlaceholderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
