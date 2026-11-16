import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'uts.refreshToken';

// Tokens never go to AsyncStorage (docs/Conventions.md §5).
export const loadRefreshToken = () =>
  SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
export const saveRefreshToken = (token: string) =>
  SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
export const clearRefreshToken = () =>
  SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
