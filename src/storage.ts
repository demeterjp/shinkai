import AsyncStorage from '@react-native-async-storage/async-storage';

// seen = ile razy znak się pojawił, err = ostatnie błędy (0 do 1), ms = typowy czas odpowiedzi
export type Stat = { seen: number; err: number; ms: number };
export type Stats = Record<string, Stat>;

const STATS_KEY = 'shinkai.stats.v1';
const ONBOARD_KEY = 'shinkai.onboarded.v1';

export async function loadStats(): Promise<Stats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveStats(stats: Stats) {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export async function isOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARD_KEY)) === '1';
  } catch {
    return true;
  }
}

export async function setOnboarded() {
  try {
    await AsyncStorage.setItem(ONBOARD_KEY, '1');
  } catch {}
}

// Nowsze odpowiedzi liczą się bardziej, więc znak, który opanujesz, szybko przestaje być "słaby"
export function updateStat(stats: Stats, key: string, wrong: boolean, ms: number) {
  const t = Math.min(ms, 10000);
  const prev = stats[key];
  stats[key] =
    prev && prev.seen > 0
      ? { seen: prev.seen + 1, err: prev.err * 0.7 + (wrong ? 0.3 : 0), ms: prev.ms * 0.7 + t * 0.3 }
      : { seen: 1, err: wrong ? 1 : 0, ms: t };
}

// Im wyższa liczba, tym częściej znak wraca. Nieznane znaki mają średnio wysoką wagę.
export function weakness(stat?: Stat): number {
  if (!stat || stat.seen === 0) return 1.5;
  return 0.2 + stat.err * 2 + Math.min(stat.ms / 4000, 1);
}