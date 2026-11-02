import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEEK_ORDER } from './weekdays';

type StreakData = {
  count: number;
  best: number;
  last: string;
  days: string[];
  frozenDays: string[];
  freezes: 0 | 1;
  freezeUsedAt: number | null;
};

const STREAK_KEY = 'shinkai.streak.v1';
const KEEP_DAYS = 800;
export const FREEZE_REFILL_MS = 48 * 60 * 60 * 1000;
export const FREEZE_CHALLENGE_SECONDS = 80;

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function dayOffset(now: Date, offset: number) {
  return dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset));
}

async function save(d: StreakData) {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(d));
  } catch {}
}

async function load(): Promise<StreakData> {
  let d: StreakData = { count: 0, best: 0, last: '', days: [], frozenDays: [], freezes: 1, freezeUsedAt: null };
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      d = {
        count: stored.count ?? 0,
        best: stored.best ?? 0,
        last: stored.last ?? '',
        days: Array.isArray(stored.days) ? stored.days : stored.last ? [stored.last] : [],
        frozenDays: Array.isArray(stored.frozenDays) ? stored.frozenDays : [],
        freezes: stored.freezes === 0 ? 0 : 1,
        freezeUsedAt: typeof stored.freezeUsedAt === 'number' ? stored.freezeUsedAt : null,
      };
    }
  } catch {}

  let changed = false;
  const now = new Date();

  // A spent freeze refills after 48 hours. Inventory is capped at one.
  if (d.freezes === 0 && d.freezeUsedAt !== null && Date.now() - d.freezeUsedAt >= FREEZE_REFILL_MS) {
    d.freezes = 1;
    d.freezeUsedAt = null;
    changed = true;
  }

  // Apply one freeze only when exactly yesterday was missed.
  const yesterday = dayOffset(now, -1);
  const twoDaysAgo = dayOffset(now, -2);
  if (d.last === twoDaysAgo && d.freezes === 1 && !d.frozenDays.includes(yesterday)) {
    d.freezes = 0;
    d.freezeUsedAt = Date.now();
    d.frozenDays = [...d.frozenDays.filter((x) => x !== yesterday), yesterday].slice(-KEEP_DAYS);
    d.last = yesterday;
    changed = true;
  }

  if (changed) await save(d);
  return d;
}

export type StreakInfo = { count: number; best: number; doneToday: boolean };
export type FreezeInfo = { available: 0 | 1; refillAt: number | null };

export async function getStreak(): Promise<StreakInfo> {
  const d = await load();
  const today = dayOffset(new Date(), 0);
  const yesterday = dayOffset(new Date(), -1);
  if (d.last === today) return { count: d.count, best: d.best, doneToday: true };
  if (d.last === yesterday) return { count: d.count, best: d.best, doneToday: false };
  return { count: 0, best: d.best, doneToday: false };
}

export async function getFreezeInfo(): Promise<FreezeInfo> {
  const d = await load();
  return {
    available: d.freezes,
    refillAt: d.freezes === 0 && d.freezeUsedAt !== null ? d.freezeUsedAt + FREEZE_REFILL_MS : null,
  };
}

export async function earnFreezeFromChallenge(): Promise<boolean> {
  const d = await load();
  if (d.freezes === 1) return false;
  d.freezes = 1;
  d.freezeUsedAt = null;
  await save(d);
  return true;
}

export async function getDays(): Promise<string[]> {
  return (await load()).days;
}

export async function getFrozenDays(): Promise<string[]> {
  return (await load()).frozenDays;
}

export type WeekCell = { dow: number; done: boolean; frozen: boolean; isToday: boolean };

export async function getWeek(): Promise<WeekCell[]> {
  const d = await load();
  const now = new Date();
  const todayDow = now.getDay();
  const sinceMonday = (todayDow + 6) % 7;
  return WEEK_ORDER.map((dow, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday + i);
    const key = dayKey(date);
    return { dow, done: d.days.includes(key), frozen: d.frozenDays.includes(key), isToday: dow === todayDow };
  });
}

export async function recordPractice(): Promise<{ count: number; best: number; increased: boolean }> {
  const d = await load();
  const today = dayOffset(new Date(), 0);
  const yesterday = dayOffset(new Date(), -1);

  if (d.last === today) return { count: d.count, best: d.best, increased: false };
  if (d.last > today) return { count: d.count, best: d.best, increased: false };

  const count = d.last === yesterday ? d.count + 1 : 1;
  const best = Math.max(d.best, count);
  const days = [...d.days.filter((x) => x !== today), today].slice(-KEEP_DAYS);
  await save({ ...d, count, best, last: today, days });
  return { count, best, increased: true };
}
