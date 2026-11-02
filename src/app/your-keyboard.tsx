import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BackButton } from '../BackButton';
import { LAYOUT, ROWS, Row } from '../kana';
import { Stats, Stat, loadStats } from '../storage';
import { Colors, useStyles } from '../theme';
import { Screen } from '../Screen';

type Level = 'unknown' | 'learning' | 'strong' | 'weak';
type KanaInfo = { char: string; stat?: Stat; level: Level; correct: number; wrong: number; estimated: boolean };
const CROSS: (number | null)[][] = [[null, 2, null], [1, 0, 3], [null, 4, null]];

function getLevel(stat?: Stat): Level {
  if (!stat || stat.seen === 0) return 'unknown';
  if (stat.bad || stat.err >= 0.4) return 'weak';
  if (stat.seen >= 5 && stat.err < 0.2) return 'strong';
  return 'learning';
}

function totals(stat?: Stat) {
  if (!stat) return { correct: 0, wrong: 0, estimated: false };
  if (stat.correctCount !== undefined && stat.wrongCount !== undefined) {
    return { correct: stat.correctCount, wrong: stat.wrongCount, estimated: false };
  }
  const correct = Math.round(stat.seen * (1 - stat.err));
  return { correct, wrong: Math.max(0, stat.seen - correct), estimated: stat.seen > 0 };
}

export default function YourKeyboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, s } = useStyles(makeStyles);
  const [stats, setStats] = useState<Stats>({});

  useFocusEffect(useCallback(() => {
    loadStats().then(setStats);
  }, []));

  const info = useMemo(() => {
    const byChar: Record<string, KanaInfo> = {};
    for (const row of ROWS) {
      for (const char of row.keys) {
        if (!char) continue;
        const stat = stats[char];
        const count = totals(stat);
        byChar[char] = { char, stat, level: getLevel(stat), ...count };
      }
    }
    return byChar;
  }, [stats]);

  const list = Object.values(info);
  const legacy = list.some((item) => item.estimated);
  const boardWidth = Math.min(width - 32, 440);
  const keyWidth = (boardWidth - 16) / 3;
  const cellSize = Math.max(24, Math.min(36, Math.floor((keyWidth - 12) / 3)));
  const summary = {
    strong: list.filter((item) => item.level === 'strong').length,
    learning: list.filter((item) => item.level === 'learning').length,
    weak: list.filter((item) => item.level === 'weak').length,
    unknown: list.filter((item) => item.level === 'unknown').length,
  };

  function fill(level: Level) {
    if (level === 'strong') return colors.ok;
    if (level === 'learning') return colors.warn;
    if (level === 'weak') return colors.bad;
    return colors.key;
  }

  function label(level: Level) {
    if (level === 'strong') return 'Strong';
    if (level === 'learning') return 'Learning';
    if (level === 'weak') return 'Needs practice';
    return 'Not tried';
  }

  function miniCell(row: Row, dir: number | null, key: string) {
    if (dir === null) return <View key={key} style={{ width: cellSize, height: cellSize, margin: 1 }} />;
    const char = row.keys[dir];
    if (!char) return <View key={key} style={[s.mapCell, s.mapEmpty, { width: cellSize, height: cellSize }]} />;
    const item = info[char];
    const unknown = item.level === 'unknown';
    return (
      <View key={key} style={[s.mapCell, { width: cellSize, height: cellSize, backgroundColor: fill(item.level) }, unknown && s.mapUnknown]}>
        <Text style={[s.mapChar, { fontSize: cellSize * 0.55, color: unknown ? colors.textSoft : colors.onAccent }]}>{char}</Text>
      </View>
    );
  }

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.header}>Your keyboard</Text>
        <View style={s.topSpacer} />
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.intro}>Your hiragana, shown in the flick-key layout.</Text>

        <View style={[s.map, { width: boardWidth }]}>
          {LAYOUT.flatMap((line, rowIndex) => line.map((rowId, columnIndex) => {
            if (!rowId) return <View key={`blank-${rowIndex}-${columnIndex}`} style={{ width: '32%', aspectRatio: 1 }} />;
            const row = ROWS.find((item) => item.id === rowId)!;
            return (
              <View key={row.id} style={[s.keySlot, { width: '32%' }]}>
                {CROSS.map((positions, i) => (
                  <View key={i} style={s.crossRow}>
                    {positions.map((dir, j) => miniCell(row, dir, `cross-${i}-${j}`))}
                  </View>
                ))}
              </View>
            );
          }))}
        </View>

        <View style={s.legend}>
          {(['strong', 'learning', 'weak', 'unknown'] as Level[]).map((level) => (
            <View key={level} style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: fill(level), borderColor: level === 'unknown' ? colors.keyHint : fill(level) }]} />
              <Text style={s.legendText}>{label(level)}</Text>
            </View>
          ))}
        </View>
        <Text style={s.summary}>{summary.strong} strong · {summary.learning} learning · {summary.weak} need practice · {summary.unknown} not tried</Text>

        <Text style={s.sectionTitle}>Character details</Text>
        <Text style={s.sectionIntro}>Correct answers, mistakes, and total attempts for each regular hiragana.</Text>
        {legacy && <Text style={s.estimateNote}>Older totals are estimated from saved performance. New totals are counted exactly.</Text>}
        <View style={s.detailsGrid}>
          {list.map((item) => {
            const total = item.correct + item.wrong;
            const accuracy = total ? Math.round((item.correct / total) * 100) : null;
            const unknown = item.level === 'unknown';
            return (
              <View key={item.char} style={[s.detailCard, { borderLeftColor: fill(item.level) }]}>
                <View style={s.detailTop}>
                  <Text style={s.detailKana}>{item.char}</Text>
                  <Text style={[s.detailLevel, { color: unknown ? colors.muted : fill(item.level) }]}>{label(item.level)}</Text>
                </View>
                <Text style={s.detailCounts}>Correct {item.correct} · Mistakes {item.wrong}</Text>
                <Text style={s.detailCounts}>Total {total} · Accuracy {accuracy === null ? '—' : `${accuracy}%`}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  header: { color: c.text, fontSize: 19, fontWeight: '700' },
  topSpacer: { width: 34 },
  scroll: { flex: 1, width: '100%' },
  content: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 32 },
  intro: { color: c.muted, fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  map: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 5 },
  keySlot: { aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  crossRow: { flexDirection: 'row' },
  mapCell: { margin: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  mapEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: c.keyHint, opacity: 0.38 },
  mapUnknown: { borderWidth: 1, borderColor: c.keyHint },
  mapChar: { fontWeight: '600' },
  legend: { width: '100%', maxWidth: 440, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
  legendText: { color: c.textSoft, fontSize: 12 },
  summary: { color: c.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  sectionTitle: { color: c.text, fontSize: 22, fontWeight: '700', marginTop: 28 },
  sectionIntro: { color: c.muted, fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 10 },
  estimateNote: { color: c.warn, fontSize: 12, textAlign: 'center', marginBottom: 10 },
  detailsGrid: { width: '100%', maxWidth: 520, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  detailCard: { width: '48.5%', minHeight: 100, backgroundColor: c.key, borderRadius: 12, padding: 10, borderLeftWidth: 3 },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  detailKana: { color: c.text, fontSize: 25, fontWeight: '600' },
  detailLevel: { fontSize: 10, fontWeight: '700', textAlign: 'right', maxWidth: '65%' },
  detailCounts: { color: c.textSoft, fontSize: 11, lineHeight: 17 },
});
