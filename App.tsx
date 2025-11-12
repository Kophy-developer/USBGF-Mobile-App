import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import * as Font from 'expo-font';
import { Navigation } from './app/navigation';
import { AuthProvider } from './app/context/AuthContext';
import { clearABTCache } from './app/services/abtCalendarService';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      const timeoutId = setTimeout(() => {
        console.warn('Font loading timeout - proceeding with app load');
        setFontsLoaded(true);
      }, 2000);

      try {
        const fontLoadPromise = Font.loadAsync({
          'DunbarTall-Regular': require('./app/assets/fonts/dunbar-tall-regular.ttf'),
          'CaslonPro3-Regular': require('./app/assets/fonts/ACaslonPro-Regular.otf'),
        });
        
        await Promise.race([
          fontLoadPromise,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        
        clearTimeout(timeoutId);
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Error loading fonts:', error);
        clearTimeout(timeoutId);
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        clearABTCache();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B365D" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});