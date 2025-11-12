import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface StoredUser {
  id: number;
  playerId: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  [key: string]: any;
}

export async function saveAuth(token: string, user: StoredUser): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getStoredAuth(): Promise<{ token: string | null; user: StoredUser | null }> {
  const [[, token], [, userJson]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  return {
    token,
    user: userJson ? JSON.parse(userJson) : null,
  };
}

export async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

