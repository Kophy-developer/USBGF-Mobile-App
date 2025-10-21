import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'onboarding.seen';

export async function setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function getOnboardingSeen(): Promise<boolean> {
  try {
    // Temporarily always return false to show onboarding
    return false;
    // const value = await AsyncStorage.getItem(KEY);
    // return value === 'true';
  } catch {
    return false;
  }
}
