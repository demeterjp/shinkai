import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEEK_ORDER } from './weekdays';

// last = ostatni dzień ćwiczeń (lokalny czas, 'YYYY-MM-DD'), days = ostatnie dni ćwiczeń
type StreakData = { count: number; best: number; last: string; days: string[] };

const STREAK_KEY = 'shinkai.streak.v1';
const KEEP_DAYS = 800;

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function todayAndYesterday() {
  const now = new Date();
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return { today: dayKey(now), yesterday: dayKey(y) };
}

async function load(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const last: string = d.last ?? '';
      const days: string[] = Array.isArray(d.days) ? d.days : last ? [last] : [];
      return { count: d.count ?? 0, best: d.best ?? 0, last, days };
    }
  } catch {}
  return { count: 0, best: 0, last: '', days: [] };
}

export type StreakInfo = { count: number; best: number; doneToday: boolean };

// Do menu: seria żyje, jeśli ćwiczyłeś dziś albo wczoraj
export async function getStreak(): Promise<StreakInfo> {
  const d = await load();
  const { today, yesterday } = todayAndYesterday();
  if (d.last === today) return { count: d.count, best: d.best, doneToday: true };
  if (d.last === yesterday) return { count: d.count, best: d.best, doneToday: false };
  return { count: 0, best: d.best, doneToday: false };
}

// Wszystkie zapamiętane dni ćwiczeń ('YYYY-MM-DD')
export async function getDays(): Promise<string[]> {
  return (await load()).days;
}

export type WeekCell = { dow: number; done: boolean; isToday: boolean };

// Bieżący tydzień (poniedziałek-niedziela): w które dni ćwiczyłeś
export async function getWeek(): Promise<WeekCell[]> {
  const d = await load();
  const now = new Date();
  const todayDow = now.getDay();
  const sinceMonday = (todayDow + 6) % 7;
  return WEEK_ORDER.map((dow, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday + i);
    return { dow, done: d.days.includes(dayKey(date)), isToday: dow === todayDow };
  });
}

// Wołane po skończonej rundzie. increased = dziś pierwszy raz podniosło serię.
export async function recordPractice(): Promise<{ count: number; best: number; increased: boolean }> {
  const d = await load();
  const { today, yesterday } = todayAndYesterday();

  if (d.last === today) return { count: d.count, best: d.best, increased: false };
  // Zegar cofnięty do tyłu: nie psujemy serii
  if (d.last > today) return { count: d.count, best: d.best, increased: false };

  const count = d.last === yesterday ? d.count + 1 : 1;
  const best = Math.max(d.best, count);
  const days = [...d.days.filter((x) => x !== today), today].slice(-KEEP_DAYS);
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count, best, last: today, days }));
  } catch {}
  return { count, best, increased: true };
}
