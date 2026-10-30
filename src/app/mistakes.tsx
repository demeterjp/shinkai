import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { FIX_STREAK, Stats, loadStats } from '../storage';
import { ROWS, toKatakana } from '../kana';
import { Colors, useStyles } from '../theme';

const isKata = (c: string) => /[\u30A0-\u30FF]/.test(c);
const BASIC_CHARS = new Set(ROWS.flatMap((row) => row.keys.filter((c): c is string => !!c).flatMap((c) => [c, toKatakana(c)])));

function Group({ title, chars }: { title: string; chars: string[] }) {
  const { s } = useStyles(makeStyles);
  if (chars.length === 0) return null;
  return (
    <View style={s.group}>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.chips}>
        {chars.map((c) => (
          <View key={c} style={s.chip}>
            <Text style={s.chipText}>{c}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Mistakes() {
  const { s } = useStyles(makeStyles);
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats().then(setStats);
  }, []);

  if (!stats) return <Screen style={s.screen} />;

  const bad = Object.keys(stats).filter((c) => stats[c].bad && BASIC_CHARS.has(c)).sort();
  const hira = bad.filter((c) => !isKata(c));
  const kata = bad.filter(isKata);

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
      </View>

      {bad.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.title}>Nothing to fix</Text>
          <Text style={s.body}>
            You have no open mistakes. Mistakes you make in Hiragana or Katakana rounds will show up here.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView style={s.scrollView} contentContainerStyle={s.scroll}>
            <Text style={s.title}>
              {bad.length} {bad.length === 1 ? 'character' : 'characters'} to fix
            </Text>
            <Text style={s.body}>
              Type each one correctly {FIX_STREAK} times in a row and it leaves this list.
            </Text>
            <Group title="Hiragana" chars={hira} />
            <Group title="Katakana" chars={kata} />
          </ScrollView>

          <View style={s.nav}>
            <Pressable
              style={s.btn}
              onPress={() => router.replace({ pathname: '/practice', params: { mode: 'fix' } } as any)}
            >
              <Text style={s.btnText}>Fix them</Text>
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: { width: '100%', paddingHorizontal: 16, paddingVertical: 8 },
  link: { color: colors.accent, fontSize: 15, padding: 6 },
  scrollView: { flex: 1, width: '100%' },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 8, marginBottom: 8 },
  body: { color: colors.textSoft, fontSize: 16, lineHeight: 23, textAlign: 'center', maxWidth: 420 },
  group: { width: '100%', maxWidth: 480, marginTop: 24 },
  groupTitle: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    width: 64, height: 64, borderRadius: 14, backgroundColor: colors.key,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { color: colors.text, fontSize: 30 },
  nav: { width: '100%', maxWidth: 480, paddingHorizontal: 24, paddingBottom: 16 },
  btn: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: colors.onAccent, fontSize: 18, fontWeight: '600' },
});
