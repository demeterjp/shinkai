import AsyncStorage from '@react-native-async-storage/async-storage';

export type Settings = { haptics: boolean; hints: boolean };

const SETTINGS_KEY = 'shinkai.settings.v1';
const DEFAULTS: Settings = { haptics: true, hints: true };

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(settings: Settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

// Czyści postęp (statystyki, ostatnie rundy, streak). Ustawienia i tutorial zostają.
export async function resetProgress() {
  try {
    await AsyncStorage.multiRemove(['shinkai.stats.v1', 'shinkai.recent.v1', 'shinkai.streak.v1']);
  } catch {}
}
