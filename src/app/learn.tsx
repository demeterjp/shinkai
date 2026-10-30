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
  a: 'The first key holds the five vowels on their own. Their order (a, i, u, e, o) is the pattern that every other key follows.',
  ka: 'Same directions, new consonant. From now on only the first sound changes, the vowel positions stay exactly the same.',
  sa: 'Watch out: し is read "shi", not "si". It still sits in the "i" position, so swipe left.',
  ta: 'ち is read "chi" and つ is read "tsu". They still sit in the "i" and "u" positions.',
  na: 'Here na, ni, nu, ne and no live together on one key. Tap for な, then swipe left, up, right or down for the other four. Five characters, one key.',
  ha: 'ふ is read "fu" and sits in the "u" position, so swipe up.',
  ma: 'Nothing unusual here: ma, mi, mu, me, mo in the usual positions.',
  ya: 'This key has only three characters: ya, yu and yo. The left and right positions are empty.',
  ra: 'Nothing unusual here: ra, ri, ru, re, ro in the usual positions.',
  wa: 'Three characters: わ (wa), を (wo) and ん (n). を is mostly used as a grammar particle, and ん is a standalone sound. The next page shows the last piece: the 小゛゜ key.',
};

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
  const total = ROWS.length + 2; // intro + 10 klawiszy + klawisz 小゛゜
  const last = page === total - 1;

  const isMod = page === total - 1;
  const row = page > 0 && !isMod ? ROWS[page - 1] : null;
  const rom = row ? ROMAJI[row.id] : [];

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.stat}>
          {page + 1} / {total}
        </Text>
        {page > 0 ? (
          <Pressable onPress={() => setKata(!kata)} style={s.kataBtn}>
            <Text style={s.link}>{kata ? 'ア → あ' : 'あ → ア'}</Text>
          </Pressable>
        ) : (
          <View style={s.kataBtn} />
        )}
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scroll}>
        {isMod ? (
          <>
            <Text style={s.title}>The 小゛゜ key</Text>
            <View style={s.modRow}>
              {['は', 'ば', 'ぱ'].map((c, i) => (
                <View key={c} style={s.modItem}>
                  <View style={[s.cell, s.modCell, i === 0 && s.cellCenter]}>
                    <Text style={[s.cellMain, { fontSize: 34 }]}>{show(c)}</Text>
                  </View>
                  {i < 2 && <Text style={s.modArrow}>→ 小゛゜</Text>}
                </View>
              ))}
            </View>
            <Text style={s.body}>
              Dakuten (゛), handakuten (゜) and small kana are typed in two steps. Flick the base
              character, then tap the 小゛゜ key until it changes: は, then once for ば, twice for ぱ.
            </Text>
            <Text style={s.body}>
              Small kana work the same way: や then 小゛゜ gives ゃ, and つ then 小゛゜ gives っ. The long
              mark ー is a plain flick right on the わ key. Practice all of these in the
              "Dakuten, small kana" round.
            </Text>
          </>
        ) : page === 0 || !row ? (
          <>
            <Text style={s.title}>One key, five characters</Text>
            <Cross
              size={size}
              cells={[
                { main: 'a', sub: '• tap' },
                { main: 'i', sub: '← left' },
                { main: 'u', sub: '↑ up' },
                { main: 'e', sub: '→ right' },
                { main: 'o', sub: '↓ down' },
              ]}
            />
            <Text style={s.body}>
              The keyboard has 10 keys, one per consonant. Each key holds up to five characters
              with that consonant: tap for the first, swipe for the others.
            </Text>
            <Text style={s.body}>
              The vowel pattern is always the same: tap = a, left = i, up = u, right = e, down = o.
              Learn it once and it works on every key.
            </Text>
          </>
        ) : (
          <>
            <Text style={s.title}>{show(row.keys[0]!)} key</Text>
            <Cross
              size={size}
              cells={row.keys.map((c, d) => (c ? { main: show(c), sub: `${ARROWS[d]} ${rom[d]}` } : null))}
            />
            <Text style={s.body}>{NOTES[row.id]}</Text>
          </>
        )}
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
  modRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  modItem: { flexDirection: 'row', alignItems: 'center' },
  modCell: { width: 64, height: 64 },
  modArrow: { color: colors.muted, fontSize: 13, marginHorizontal: 8 },
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