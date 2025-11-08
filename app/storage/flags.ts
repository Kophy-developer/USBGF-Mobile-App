import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'onboarding.seen';

export async function setOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function getOnboardingSeen(): Promise<boolean> {
  try {
    return false;
  } catch {
    return false;
  }
}
