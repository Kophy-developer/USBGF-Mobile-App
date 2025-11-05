import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import * as Font from 'expo-font';
import { Navigation } from './app/navigation';
import { clearABTCache } from './app/services/abtCalendarService';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      // Set a maximum wait time - always proceed after 2 seconds
      const timeoutId = setTimeout(() => {
        console.warn('Font loading timeout - proceeding with app load');
        setFontsLoaded(true);
      }, 2000); // 2 second timeout - faster app load

      try {
        // Load fonts in parallel with timeout
        const fontLoadPromise = Font.loadAsync({
          'DunbarTall-Regular': require('./app/assets/fonts/dunbar-tall-regular.ttf'),
          'CaslonPro3-Regular': require('./app/assets/fonts/ACaslonPro-Regular.otf'),
        });
        
        // Race between font loading and timeout
        await Promise.race([
          fontLoadPromise,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        
        clearTimeout(timeoutId);
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Error loading fonts:', error);
        clearTimeout(timeoutId);
        // Continue even if fonts fail to load - will use system fallback
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Clear cache when app goes to background (simulating app close)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clear cache when app goes to background
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

  return <Navigation />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});