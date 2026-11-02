import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ARROWS, ROWS, toKatakana } from '../kana';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { Colors, useStyles } from '../theme';

// Zapis łaciński dla każdego rzędu: [dotyk, lewo, góra, prawo, dół]
const ROMAJI: Record<string, (string | null)[]> = {
  a: ['a', 'i', 'u', 'e', 'o'],
  ka: ['ka', 'ki', 'ku', 'ke', 'ko'],
  sa: ['sa', 'shi', 'su', 'se', 'so'],
  ta: ['ta', 'chi', 'tsu', 'te', 'to'],
  na: ['na', 'ni', 'nu', 'ne', 'no'],
  ha: ['ha', 'hi', 'fu', 'he', 'ho'],
  ma: ['ma', 'mi', 'mu', 'me', 'mo'],
  ya: ['ya', null, 'yu', null, 'yo'],
  ra: ['ra', 'ri', 'ru', 're', 'ro'],
  wa: ['wa', 'wo', 'n', null, null],
};

const NOTES: Record<string, string> = {
  a: 'The base key: the five vowels on their own. Tap for あ, then swipe for い, う, え, お. Every other key follows the same pattern.',
  ka: 'Same swipes, new consonant: か き く け こ. Only the first sound changes, the vowel positions stay put.',
  sa: 'し is read "shi", not "si". It still sits in the "i" position, so swipe left.',
  ta: 'Two irregular sounds: ち is "chi" and つ is "tsu". They still sit in the "i" and "u" positions, so swipe left for ち and up for つ.',
  na: 'な に ぬ ね の. Nothing irregular here, so it is a good key to check that the pattern really works.',
  ha: 'ふ is read "fu" and sits in the "u" position, so swipe up. Also note: as a particle, は is read "wa" and へ is read "e".',
  ma: 'ま み む め も. Regular, with no surprises.',
  ya: 'Only three characters: や ゆ よ. There is no left or right swipe on this key, because those sounds do not exist.',
  ra: 'ら り る れ ろ. The sound is between "r" and "l". Regular positions.',
  wa: 'わ, を and ん. を is read "o" and is used as a grammar particle. ん is a lone sound, with no vowel. You find it by swiping up.',
};

type Intro = { title: string; cells?: Cell[]; paras: string[] };

const VOWELS: Cell[] = [
  { main: 'a', sub: '• tap' },
  { main: 'i', sub: '← left' },
  { main: 'u', sub: '↑ up' },
  { main: 'e', sub: '→ right' },
  { main: 'o', sub: '↓ down' },
];

const KA_KEY: Cell[] = [
  { main: 'か', sub: '• ka' },
  { main: 'き', sub: '← ki' },
  { main: 'く', sub: '↑ ku' },
  { main: 'け', sub: '→ ke' },
  { main: 'こ', sub: '↓ ko' },
];

// Wstęp: jak w ogóle działa klawiatura flick
const INTRO: Intro[] = [
  {
    title: 'What is a flick keyboard?',
    cells: KA_KEY,
    paras: [
      'This is how almost everyone in Japan types on a phone. Instead of 46 separate keys, there are only 10. Each key stands for one group of sounds that start with the same consonant: ka, sa, ta and so on.',
      'One key hides up to five characters. The one on the face is the first character of the group. The others are reached by flicking your finger.',
    ],
  },
  {
    title: 'How to flick',
    cells: KA_KEY,
    paras: [
      'Press and hold a key. Four more characters pop up around your finger, one in each direction.',
      'Without lifting, slide a short way toward the character you want and let go. A tap, with no sliding, types the character on the key itself.',
      'You do not need to swipe far. A short, quick flick is enough, and it gets faster with practice.',
    ],
  },
  {
    title: 'One pattern for every key',
    cells: VOWELS,
    paras: [
      'The direction always chooses the vowel: tap = a, left = i, up = u, right = e, down = o.',
      'So to type ku, you find the ka key (the consonant) and flick up (the vowel u). To type mo, use the ma key and flick down. Learn this once and it works on every key.',
    ],
  },
  {
    title: 'How to learn it',
    paras: [
      'The next ten screens go through the keys one at a time. Each one shows the five directions and points out anything unusual, like the irregular sounds shi, chi, tsu and fu.',
      'After that, use Hiragana practice with Hints on. You see the character you need in the answer, so your fingers learn where it lives. When it feels easy, switch Hints off, and later try the Blind keyboard in Extra, where the keys are empty and you have to remember everything.',
    ],
  },
];

type Cell = { main: string; sub: string } | null;

// Pozycje w krzyżyku: góra = 2, lewo = 1, środek = 0, prawo = 3, dół = 4
const GRID: (number | null)[][] = [
  [null, 2, null],
  [1, 0, 3],
  [null, 4, null],
];

function Cross({ cells, size }: { cells: Cell[]; size: number }) {
  const { s } = useStyles(makeStyles);
  return (
    <View>
      {GRID.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          {line.map((d, j) => {
            const box = { width: size, height: size, margin: 3 };
            if (d === null) return <View key={j} style={box} />;
            const c = cells[d];
            if (!c) return <View key={j} style={[box, s.cellEmpty]} />;
            return (
              <View key={j} style={[box, s.cell, d === 0 && s.cellCenter]}>
                <Text style={[s.cellMain, { fontSize: size * 0.42 }]}>{c.main}</Text>
                <Text style={s.cellSub}>{c.sub}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function Learn() {
  const { s } = useStyles(makeStyles);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [kata, setKata] = useState(false);

  const show = (t: string) => (kata ? toKatakana(t) : t);
  const size = Math.max(54, Math.min(96, (width - 48) / 3 - 6, (height - 430) / 3 - 6));
  const total = INTRO.length + ROWS.length; // intro pages + 10 keyboard keys
  const last = page === total - 1;

  const intro = page < INTRO.length ? INTRO[page] : null;
  const row = intro ? null : ROWS[page - INTRO.length];
  const rom = row ? ROMAJI[row.id] : [];

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.stat}>
          {page + 1} / {total}
        </Text>
        {!intro ? (
          <Pressable onPress={() => setKata(!kata)} style={s.kataBtn}>
            <Text style={s.link}>{kata ? 'ア → あ' : 'あ → ア'}</Text>
          </Pressable>
        ) : (
          <View style={s.kataBtn} />
        )}
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scroll}>
        {intro ? (
          <>
            <Text style={s.title}>{intro.title}</Text>
            {intro.cells && <Cross size={size} cells={intro.cells} />}
            {intro.paras.map((t, i) => (
              <Text key={i} style={s.body}>{t}</Text>
            ))}
          </>
        ) : row ? (
          <>
            <Text style={s.title}>{show(row.keys[0]!)} key</Text>
            <Cross
              size={size}
              cells={row.keys.map((c, d) => (c ? { main: show(c), sub: `${ARROWS[d]} ${rom[d]}` } : null))}
            />
            <Text style={s.body}>{NOTES[row.id]}</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={s.nav}>
        {page > 0 ? (
          <Pressable style={[s.navBtn, s.navBtnAlt]} onPress={() => setPage(page - 1)}>
            <Text style={[s.navText, s.navTextAlt]}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Pressable style={s.navBtn} onPress={() => (last ? router.back() : setPage(page + 1))}>
          <Text style={s.navText}>{last ? 'Done' : 'Next'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
  },
  link: { color: colors.accent, fontSize: 15, padding: 6 },
  stat: { color: colors.textSoft, fontSize: 16 },
  scrollView: { flex: 1, width: '100%' },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  sub: { color: colors.muted, fontSize: 14, marginTop: 8 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 4, marginBottom: 10 },
  body: { color: colors.textSoft, fontSize: 15, lineHeight: 21, textAlign: 'center', maxWidth: 480, marginTop: 12 },
  kataBtn: { width: 70, alignItems: 'flex-end' },
  cell: { backgroundColor: colors.key, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cellCenter: { backgroundColor: colors.cell, borderWidth: 2, borderColor: colors.accent },
  cellEmpty: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.key },
  cellMain: { color: colors.text },
  cellSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  nav: { flexDirection: 'row', width: '100%', maxWidth: 480, paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  navBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  navBtnAlt: { backgroundColor: colors.key },
  navText: { color: colors.onAccent, fontSize: 17, fontWeight: '600' },
  navTextAlt: { color: colors.text },
});
