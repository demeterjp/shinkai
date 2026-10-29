import AsyncStorage from '@react-native-async-storage/async-storage';

// last = ostatni dzień ćwiczeń w lokalnym czasie, 'YYYY-MM-DD'
type StreakData = { count: number; best: number; last: string };

const STREAK_KEY = 'shinkai.streak.v1';

function dayKey(d: Date): string {
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
      return { count: d.count ?? 0, best: d.best ?? 0, last: d.last ?? '' };
    }
  } catch {}
  return { count: 0, best: 0, last: '' };
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

// Wołane po skończonej rundzie. increased = dziś pierwszy raz podniosło serię.
export async function recordPractice(): Promise<{ count: number; best: number; increased: boolean }> {
  const d = await load();
  const { today, yesterday } = todayAndYesterday();

  if (d.last === today) return { count: d.count, best: d.best, increased: false };
  // Zegar cofnięty do tyłu: nie psujemy serii
  if (d.last > today) return { count: d.count, best: d.best, increased: false };

  const count = d.last === yesterday ? d.count + 1 : 1;
  const best = Math.max(d.best, count);
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count, best, last: today }));
  } catch {}
  return { count, best, increased: true };
}
