import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../BackButton';
import { ROWS } from '../kana';
import { Screen } from '../Screen';
import { Stats, loadStats, weakness } from '../storage';
import { Colors, useStyles } from '../theme';

const ROUND_SIZE = 10;

export default function WeakestPreview() {
  const router = useRouter();
  const { s } = useStyles(makeStyles);
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(useCallback(() => {
    loadStats().then(setStats);
  }, []));

  const entries = useMemo(() => {
    if (!stats) return [];
    return ROWS.flatMap((row) => row.keys.filter((char): char is string => !!char))
      .map((char) => ({ char, stat: stats[char], weakness: weakness(stats[char]) }))
      .sort((a, b) => b.weakness - a.weakness)
      .slice(0, ROUND_SIZE);
  }, [stats]);

  function start() {
    router.replace({ pathname: '/practice', params: { mode: 'weak', chars: entries.map((entry) => entry.char).join(',') } } as any);
  }

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.topTitle}>Practice weakest</Text>
        <View style={s.spacer} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.title}>These are your 10 weakest hiragana</Text>
        <Text style={s.description}>Chosen from your mistakes and answer speed. Characters you haven’t practiced can appear too.</Text>

        <View style={s.grid}>
          {entries.map((entry, index) => {
            const stat = entry.stat;
            const wrong = stat?.wrongCount ?? (stat ? Math.max(0, stat.seen - Math.round(stat.seen * (1 - stat.err))) : 0);
            return (
              <View key={entry.char} style={s.card}>
                <Text style={s.rank}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={s.kana}>{entry.char}</Text>
                <View style={s.cardInfo}>
                  <Text style={s.stat}>{stat ? `${wrong} ${wrong === 1 ? 'mistake' : 'mistakes'}` : 'Not practiced'}</Text>
                  <Text style={s.attempts}>{stat ? `${stat.seen} attempts` : 'yet'}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <Pressable style={[s.button, !stats && s.buttonDisabled]} disabled={!stats} onPress={start}>
          <Text style={s.buttonText}>Practice</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  topTitle: { color: c.text, fontSize: 18, fontWeight: '700' },
  spacer: { width: 34 },
  scroll: { flex: 1, width: '100%' },
  content: { width: '100%', maxWidth: 500, alignSelf: 'center', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 20 },
  title: { color: c.text, fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  description: { color: c.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  card: { width: '48.5%', minHeight: 78, flexDirection: 'row', alignItems: 'center', backgroundColor: c.key, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  rank: { color: c.muted, fontSize: 11, fontWeight: '700', width: 23 },
  kana: { color: c.text, fontSize: 32, width: 38, textAlign: 'center' },
  cardInfo: { flex: 1, marginLeft: 8 },
  stat: { color: c.textSoft, fontSize: 11, fontWeight: '600' },
  attempts: { color: c.muted, fontSize: 10, marginTop: 3 },
  bottom: { width: '100%', maxWidth: 500, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 16 },
  button: { backgroundColor: c.accent, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: c.onAccent, fontSize: 18, fontWeight: '700' },
});
