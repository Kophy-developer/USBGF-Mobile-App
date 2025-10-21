import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear the onboarding flag to show onboarding again
AsyncStorage.removeItem('onboarding.seen')
  .then(() => {
    console.log('Onboarding flag cleared - app will show onboarding on next launch');
  })
  .catch((error) => {
    console.error('Error clearing onboarding flag:', error);
  });
