import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingCarousel } from '../screens/OnboardingCarousel';
import { SignInScreen } from '../screens/SignInScreen';
import { LegalWebview } from '../screens/LegalWebview';
import { HomePlaceholderScreen } from '../screens/HomePlaceholderScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  LegalWebview: { type: 'privacy' | 'terms' };
  HomePlaceholder: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

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
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="LegalWebview" component={LegalWebview} />
          <Stack.Screen name="HomePlaceholder" component={HomePlaceholderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
