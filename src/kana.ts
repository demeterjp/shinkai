// Każdy rząd: [dotyk, w lewo, w górę, w prawo, w dół]
export type Row = { id: string; keys: (string | null)[] };

export const ROWS: Row[] = [
  { id: 'a', keys: ['あ', 'い', 'う', 'え', 'お'] },
  { id: 'ka', keys: ['か', 'き', 'く', 'け', 'こ'] },
  { id: 'sa', keys: ['さ', 'し', 'す', 'せ', 'そ'] },
  { id: 'ta', keys: ['た', 'ち', 'つ', 'て', 'と'] },
  { id: 'na', keys: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { id: 'ha', keys: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  { id: 'ma', keys: ['ま', 'み', 'む', 'め', 'も'] },
  { id: 'ya', keys: ['や', null, 'ゆ', null, 'よ'] },
  { id: 'ra', keys: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { id: 'wa', keys: ['わ', 'を', 'ん', null, null] },
];

export const LAYOUT: (string | null)[][] = [
  ['a', 'ka', 'sa'],
  ['ta', 'na', 'ha'],
  ['ma', 'ya', 'ra'],
  [null, 'wa', null],
];

export const DIRS = ['tap', 'swipe left', 'swipe up', 'swipe right', 'swipe down'];
export const ARROWS = ['•', '←', '↑', '→', '↓'];

// Katakana leży w Unicode równo 0x60 za hiraganą
export const toKatakana = (s: string) =>
  s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));