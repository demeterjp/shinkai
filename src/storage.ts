import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROWS, toKatakana } from './kana';

// seen = ile razy znak się pojawił, err = ostatnie błędy (0 do 1), ms = typowy czas odpowiedzi
// bad = znak jest na liście błędów, fix = ile razy z rzędu wpisano go poprawnie od ostatniego błędu
export type Stat = {
  seen: number;
  err: number;
  ms: number;
  bad?: boolean;
  fix?: number;
  correctCount?: number;
  wrongCount?: number;
};
export type Stats = Record<string, Stat>;

const STATS_KEY = 'shinkai.stats.v1';
const ONBOARD_KEY = 'shinkai.onboarded.v1';
const RECENT_KEY = 'shinkai.recent.v1';
const BASIC_CHARS = new Set(ROWS.flatMap((row) => row.keys.filter((c): c is string => !!c).flatMap((c) => [c, toKatakana(c)])));

// Ile razy z rzędu trzeba wpisać znak poprawnie, żeby zniknął z listy błędów
export const FIX_STREAK = 2;

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

// Znaki z ostatnich rund "10 losowych" (osobno dla hiragany i katakany)
export async function loadRecent(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveRecent(recent: Record<string, string[]>) {
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent));
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

export function countBad(stats: Stats): number {
  return Object.entries(stats).filter(([char, stat]) => stat.bad && BASIC_CHARS.has(char)).length;
}

// Nowsze odpowiedzi liczą się bardziej, więc znak, który opanujesz, szybko przestaje być "słaby"
export function updateStat(stats: Stats, key: string, wrong: boolean, ms: number) {
  const t = Math.min(ms, 10000);
  const prev = stats[key];
  const base =
    prev && prev.seen > 0
      ? { seen: prev.seen + 1, err: prev.err * 0.7 + (wrong ? 0.3 : 0), ms: prev.ms * 0.7 + t * 0.3 }
      : { seen: 1, err: wrong ? 1 : 0, ms: t };

  // Keep exact totals for the keyboard overview. Older saved stats only have a
  // smoothed error rate, so seed their counters with the closest available estimate.
  const oldCorrect = prev?.correctCount ?? (prev ? Math.round(prev.seen * (1 - prev.err)) : 0);
  const oldWrong = prev?.wrongCount ?? (prev ? Math.max(0, prev.seen - oldCorrect) : 0);
  const correctCount = oldCorrect + (wrong ? 0 : 1);
  const wrongCount = oldWrong + (wrong ? 1 : 0);

  // Lista błędów: pomyłka dodaje znak, poprawne odpowiedzi z rzędu usuwają go
  let bad = prev?.bad ?? false;
  let fix = prev?.fix ?? 0;
  if (wrong) {
    bad = true;
    fix = 0;
  } else if (bad) {
    fix += 1;
    if (fix >= FIX_STREAK) {
      bad = false;
      fix = 0;
    }
  }
  stats[key] = { ...base, bad, fix, correctCount, wrongCount };
}

// Im wyższa liczba, tym częściej znak wraca. Nieznane znaki mają średnio wysoką wagę.
export function weakness(stat?: Stat): number {
  if (!stat || stat.seen === 0) return 1.5;
  return 0.2 + stat.err * 2 + Math.min(stat.ms / 4000, 1);
}
