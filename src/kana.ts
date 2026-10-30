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
// ---------- Rozszerzone znaki: dakuten, handakuten, małe kana, ー ----------
// Na prawdziwej klawiaturze pisze się je dwuetapowo: najpierw znak bazowy (flick),
// potem klawisz 小゛゜ tyle razy, aż znak się zmieni. chars[0] to znak bazowy, kolejne to kolejne kroki cyklu.
export type Cycle = { rowId: string; dir: number; chars: string[] };

export const CYCLES: Cycle[] = [
  { rowId: 'a', dir: 0, chars: ['あ', 'ぁ'] },
  { rowId: 'a', dir: 1, chars: ['い', 'ぃ'] },
  { rowId: 'a', dir: 2, chars: ['う', 'ぅ', 'ゔ'] },
  { rowId: 'a', dir: 3, chars: ['え', 'ぇ'] },
  { rowId: 'a', dir: 4, chars: ['お', 'ぉ'] },
  { rowId: 'ka', dir: 0, chars: ['か', 'が'] },
  { rowId: 'ka', dir: 1, chars: ['き', 'ぎ'] },
  { rowId: 'ka', dir: 2, chars: ['く', 'ぐ'] },
  { rowId: 'ka', dir: 3, chars: ['け', 'げ'] },
  { rowId: 'ka', dir: 4, chars: ['こ', 'ご'] },
  { rowId: 'sa', dir: 0, chars: ['さ', 'ざ'] },
  { rowId: 'sa', dir: 1, chars: ['し', 'じ'] },
  { rowId: 'sa', dir: 2, chars: ['す', 'ず'] },
  { rowId: 'sa', dir: 3, chars: ['せ', 'ぜ'] },
  { rowId: 'sa', dir: 4, chars: ['そ', 'ぞ'] },
  { rowId: 'ta', dir: 0, chars: ['た', 'だ'] },
  { rowId: 'ta', dir: 1, chars: ['ち', 'ぢ'] },
  { rowId: 'ta', dir: 2, chars: ['つ', 'っ', 'づ'] },
  { rowId: 'ta', dir: 3, chars: ['て', 'で'] },
  { rowId: 'ta', dir: 4, chars: ['と', 'ど'] },
  { rowId: 'ha', dir: 0, chars: ['は', 'ば', 'ぱ'] },
  { rowId: 'ha', dir: 1, chars: ['ひ', 'び', 'ぴ'] },
  { rowId: 'ha', dir: 2, chars: ['ふ', 'ぶ', 'ぷ'] },
  { rowId: 'ha', dir: 3, chars: ['へ', 'べ', 'ぺ'] },
  { rowId: 'ha', dir: 4, chars: ['ほ', 'ぼ', 'ぽ'] },
  { rowId: 'ya', dir: 0, chars: ['や', 'ゃ'] },
  { rowId: 'ya', dir: 2, chars: ['ゆ', 'ゅ'] },
  { rowId: 'ya', dir: 4, chars: ['よ', 'ょ'] },
  { rowId: 'wa', dir: 0, chars: ['わ', 'ゎ'] },
];

export type ExtChar = { char: string; rowId: string; dir: number; cycle: string[] | null };

// 36 znaków z cyklami + ー (zwykły flick w prawo na klawiszu わ, bez 小゛゜)
export const EXT_CHARS: ExtChar[] = [
  ...CYCLES.flatMap((c) =>
    c.chars.slice(1).map((ch) => ({ char: ch, rowId: c.rowId, dir: c.dir, cycle: c.chars }))
  ),
  { char: 'ー', rowId: 'wa', dir: 3, cycle: null },
];

// Klawisz わ w trybie rozszerzonym ma też ー (w prawo)
export const ROWS_EXT: Row[] = ROWS.map((r) =>
  r.id === 'wa' ? { ...r, keys: ['わ', 'を', 'ん', 'ー', null] } : r
);

export const MOD_LABEL = '小゛゜';
