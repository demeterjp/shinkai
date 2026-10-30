import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeId = 'deepsea' | 'dark' | 'light' | 'sakura' | 'forest';
export type Settings = { haptics: boolean; hints: boolean; theme: ThemeId };

const SETTINGS_KEY = 'shinkai.settings.v1';
const DEFAULTS: Settings = { haptics: true, hints: true, theme: 'deepsea' };
const THEME_IDS: ThemeId[] = ['deepsea', 'dark', 'light', 'sakura', 'forest'];

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const d = JSON.parse(raw);
    // Wcześniejsza wersja miała poziomy; 'off' i false = wyłączone
    const haptics = !(d.haptics === false || d.haptics === 'off');
    return {
      haptics,
      hints: typeof d.hints === 'boolean' ? d.hints : DEFAULTS.hints,
      theme: THEME_IDS.includes(d.theme) ? d.theme : DEFAULTS.theme,
    };
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

const EXT_INTRO_KEY = 'shinkai.extintro.v1';

export async function seenExtIntro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(EXT_INTRO_KEY)) === '1';
  } catch {
    return true;
  }
}

export async function setSeenExtIntro() {
  try {
    await AsyncStorage.setItem(EXT_INTRO_KEY, '1');
  } catch {}
}
