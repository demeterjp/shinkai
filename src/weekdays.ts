// Indeks = Date.getDay() (0 = niedziela). Każdy dzień tygodnia w Japonii ma swój żywioł.
export type WeekDay = {
  kanji: string;
  reading: string;
  name: string;
  color: string;
  flame: [string, string, string]; // zewnętrzny, środkowy i wewnętrzny język płomienia
};

export const WEEKDAYS: WeekDay[] = [
  { kanji: '日', reading: 'nichiyōbi', name: 'Sun', color: '#ff8a1f', flame: ['#ff8a1f', '#ffb347', '#fff1b8'] },
  { kanji: '月', reading: 'getsuyōbi', name: 'Moon', color: '#9a8cff', flame: ['#7a6cff', '#a99cff', '#e6e1ff'] },
  { kanji: '火', reading: 'kayōbi', name: 'Fire', color: '#ff4d2e', flame: ['#e8321a', '#ff7a1f', '#ffd86b'] },
  { kanji: '水', reading: 'suiyōbi', name: 'Water', color: '#3a9bff', flame: ['#1f7fe8', '#4fb0ff', '#d9f0ff'] },
  { kanji: '木', reading: 'mokuyōbi', name: 'Wood', color: '#34c77b', flame: ['#1fa860', '#47d68a', '#d4f7e3'] },
  { kanji: '金', reading: "kin'yōbi", name: 'Gold', color: '#e6c04a', flame: ['#d9a521', '#f2cf5a', '#fff3c4'] },
  { kanji: '土', reading: 'doyōbi', name: 'Earth', color: '#b8804f', flame: ['#9a6035', '#c98d5a', '#f1d9bf'] },
];

// Kolejność w tygodniu: poniedziałek pierwszy
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
