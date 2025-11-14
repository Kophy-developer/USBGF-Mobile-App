import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ABTDataFetcher } from '../components/ABTDataFetcher';

import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingCarousel } from '../screens/OnboardingCarousel';
import { SignInScreen } from '../screens/SignInScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { LegalWebview } from '../screens/LegalWebview';
import { HomePlaceholderScreen } from '../screens/HomePlaceholderScreen';

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
import {   ABTCalendarScreen } from '../screens/ABTCalendarScreen';
import { CurrentEntriesScreen } from '../screens/CurrentEntriesScreen';
import { EventDetailsScreen } from '../screens/EventDetailsScreen';
import type { EventSummary } from '../services/api';

export type AuthStackParamList = {
  SignIn: undefined;
  PrivacyPolicy: undefined;
  LegalWebview: { type: 'bylaws' };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Matches: undefined;
  Profile: undefined;
  Messages: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  AuthStack: undefined;
  MainApp: undefined;
  Events: undefined;
  EventDetails: { eventId: number; eventName?: string; clubId?: number; status?: 'ACCEPTING' | 'IN_PROGRESS' | 'COMPLETED'; initialEvent?: EventSummary | null };
  MembershipProfile: undefined;
  AccountBalance: undefined;
  MembershipPlans: undefined;
  Registration: undefined;
  Payment: { planKey: string; billing: 'annual' | 'monthly' };
  Contact: { name: string; message: string };
  ABTCalendar: undefined;
  CurrentEntries?: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator();

const BackButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      paddingHorizontal: 20,
      paddingVertical: 8,
      marginLeft: 4,
    }}
  >
    <Text style={{ fontSize: 24, color: '#FFFFFF' }}>←</Text>
  </TouchableOpacity>
);

const AuthStackNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1B365D',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'DunbarTall-Regular',
          fontSize: 20,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
        gestureEnabled: true,
        headerLeft: ({ canGoBack }) => 
          canGoBack ? (
            <BackButton onPress={() => navigation.goBack()} />
          ) : null,
      })}
    >
      <AuthStack.Screen 
        name="SignIn" 
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <AuthStack.Screen name="LegalWebview" component={LegalWebview} />
    </AuthStack.Navigator>
  );
};

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator 
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1B365D',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'DunbarTall-Regular',
          fontSize: 20,
          fontWeight: '600',
          color: '#FFFFFF',
        },
        headerBackTitleVisible: false,
        gestureEnabled: true,
        headerLeft: ({ canGoBack }) => 
          canGoBack ? (
            <BackButton onPress={() => navigation.goBack()} />
          ) : null,
      })}
    >
      <HomeStack.Screen 
        name="Home" 
        component={MainDashboardScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen name="Events" component={EventsScreen} />
      <HomeStack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ title: 'Event Details' }}
      />
      <HomeStack.Screen name="Registration" component={RegistrationScreen} />
      <HomeStack.Screen
        name="AccountBalance"
        component={AccountBalanceScreen}
        options={{ title: 'Account Balance' }}
      />
      <HomeStack.Screen
        name="MembershipPlans"
        component={MembershipPlansScreen}
        options={{ title: 'Membership Plans' }}
      />
      <HomeStack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ headerLeft: () => null }}
      />
      <HomeStack.Screen name="Stats" component={StatsScreen} />
      <HomeStack.Screen name="Brackets" component={BracketsScreen} />
      <HomeStack.Screen
        name="CurrentEntries"
        component={CurrentEntriesScreen}
        options={{ title: 'Current Entries' }}
      />
      <HomeStack.Screen 
        name="ABTCalendar" 
        component={ABTCalendarScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <>
      <ABTDataFetcher />
      <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1B365D',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'DunbarTall-Regular',
          fontSize: 20,
          fontWeight: '600',
          color: '#FFFFFF',
        },
        headerBackTitleVisible: false,
        gestureEnabled: true,
        headerLeft: ({ canGoBack }) => 
          canGoBack ? (
            <BackButton onPress={() => navigation.goBack()} />
          ) : null,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
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
          marginTop: -2,
          fontFamily: 'CaslonPro3-Regular',
        },
        tabBarActiveTintColor: '#1B365D',
        tabBarInactiveTintColor: '#5A5A5A',
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 22, color, marginBottom: -2 }}>🌐</Text>
            ),
            headerShown: false,
          }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={({ navigation }) => ({
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color, marginBottom: -2 }}>🎲</Text>
          ),
          title: 'Matches',
          headerLeft: () => (
            <BackButton onPress={() => navigation.goBack()} />
          ),
        })}
      />
      <Tab.Screen 
        name="Profile" 
        component={MembershipProfileScreen}
        options={({ navigation }) => ({
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color, marginBottom: -2 }}>👤</Text>
          ),
          title: 'Profile',
          headerLeft: () => (
            <BackButton onPress={() => navigation.goBack()} />
          ),
        })}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={({ navigation }) => ({
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color, marginBottom: -2 }}>💬</Text>
          ),
          title: 'Messages',
          headerLeft: () => (
            <BackButton onPress={() => navigation.goBack()} />
          ),
        })}
      />
    </Tab.Navigator>
    </>
  );
};

export const Navigation: React.FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#1A1A2E" />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={({ navigation }) => ({
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1B365D',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontFamily: 'DunbarTall-Regular',
              fontSize: 20,
              fontWeight: '600',
              color: '#FFFFFF',
            },
            headerBackTitleVisible: false,
            gestureEnabled: true,
            headerLeft: ({ canGoBack }) => 
              canGoBack ? (
                <BackButton onPress={() => navigation.goBack()} />
              ) : null,
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
          })}
        >
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingCarousel} options={{ headerShown: false }} />
          <Stack.Screen name="AuthStack" component={AuthStackNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="MainApp" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
          <Stack.Screen name="AccountBalance" component={AccountBalanceScreen} options={{ title: 'Account Balance' }} />
          <Stack.Screen name="MembershipPlans" component={MembershipPlansScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="Registration" component={RegistrationScreen} />
          <Stack.Screen name="HomePlaceholder" component={HomePlaceholderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
