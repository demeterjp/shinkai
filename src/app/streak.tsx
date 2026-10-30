import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Flame } from '../Flame';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { FreezeInfo, StreakInfo, WeekCell, dayKey, getDays, getFreezeInfo, getFrozenDays, getStreak, getWeek } from '../streak';
import { Colors, useStyles } from '../theme';
import { WEEKDAYS, WEEK_ORDER } from '../weekdays';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const FIRE = '#ff8a1f';

type Day = { n: number; key: string; done: boolean; frozen: boolean; isToday: boolean; future: boolean };

export default function StreakScreen() {
  const router = useRouter();
  const { s } = useStyles(makeStyles);
  const [info, setInfo] = useState<StreakInfo>({ count: 0, best: 0, doneToday: false });
  const [week, setWeek] = useState<WeekCell[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [frozenDays, setFrozenDays] = useState<string[]>([]);
  const [freeze, setFreeze] = useState<FreezeInfo>({ available: 1, refillAt: null });
  const [freezeModal, setFreezeModal] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [offset, setOffset] = useState(0); // 0 = ten miesiąc, -1 = poprzedni
  const [today] = useState(() => WEEKDAYS[new Date().getDay()]);

  useFocusEffect(useCallback(() => {
    getStreak().then(setInfo);
    getWeek().then(setWeek);
    getDays().then(setDays);
    getFrozenDays().then(setFrozenDays);
    getFreezeInfo().then(setFreeze);
  }, []));

  useEffect(() => {
    if (!freezeModal || freeze.refillAt === null) return;
    const refillAt = freeze.refillAt;
    const timer = setInterval(() => {
      const now = Date.now();
      setClockNow(now);
      if (now >= refillAt) getFreezeInfo().then(setFreeze);
    }, 1000);
    return () => clearInterval(timer);
  }, [freezeModal, freeze.refillAt]);

  const doneCount = week.filter((w) => w.done).length;

  // Kalendarz wybranego miesiąca, tydzień od poniedziałku
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // puste pola przed 1. dniem
  const todayKey = dayKey(now);
  const set = new Set(days);
  const frozenSet = new Set(frozenDays);

  const cells: (Day | null)[] = Array.from({ length: lead }, () => null);
  for (let n = 1; n <= lastDay; n++) {
    const key = dayKey(new Date(first.getFullYear(), first.getMonth(), n));
    cells.push({ n, key, done: set.has(key), frozen: frozenSet.has(key), isToday: key === todayKey, future: key > todayKey });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Day | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  // Statystyki miesiąca: ile dni i najdłuższa seria z rzędu
  let monthDone = 0;
  let longest = 0;
  let run = 0;
  for (const c of cells) {
    if (c && (c.done || c.frozen)) {
      if (c.done) monthDone++;
      run++;
      longest = Math.max(longest, run);
    } else if (c) {
      run = 0;
    }
  }

  const canNext = offset < 0;

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
        <Pressable style={s.freezeBadge} onPress={() => { setClockNow(Date.now()); setFreezeModal(true); }}>
          <Text style={s.freezeBadgeText}>Freeze {freeze.available}/1</Text>
        </Pressable>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Flame size={96} active={info.doneToday} />
        <Text style={s.count}>{info.count}</Text>
        <Text style={s.countLabel}>{info.count === 1 ? 'day streak' : 'days streak'}</Text>
        <Text style={s.best}>Best: {Math.max(info.best, info.count)}</Text>

        <View style={s.todayBox}>
          <Text
            style={[
              s.todayKanji,
              { color: today.color, textShadowColor: today.color },
              !info.doneToday && s.todayOff,
            ]}
          >
            {today.kanji}
          </Text>
          <Text style={s.todayText}>Today is {today.name} day</Text>
          <Text style={s.todayRead}>{today.reading}</Text>
          <Text style={s.todayHint}>
            {info.doneToday
              ? "Today's streak is safe. Come back tomorrow."
              : `Finish a round to keep your streak and light up ${today.kanji}.`}
          </Text>
        </View>

        <View style={s.seg}>
          {(['week', 'month'] as const).map((v) => (
            <Pressable key={v} style={[s.segBtn, view === v && s.segBtnOn]} onPress={() => setView(v)}>
              <Text style={[s.segText, view === v && s.segTextOn]}>{v === 'week' ? 'Week' : 'Month'}</Text>
            </Pressable>
          ))}
        </View>

        {view === 'week' ? (
          <>
            <View style={s.week}>
              {week.map((w) => {
                const d = WEEKDAYS[w.dow];
                return (
                  <View
                    key={w.dow}
                    style={[
                      s.cell,
                      w.done && { borderColor: d.color, backgroundColor: `${d.color}26` },
                      w.frozen && s.cellFrozen,
                      w.isToday && !w.done && s.cellToday,
                    ]}
                  >
                    <Text
                      style={[
                        s.cellKanji,
                        w.done
                          ? { color: d.color, textShadowColor: d.color, textShadowRadius: 8 }
                          : s.cellOff,
                      ]}
                    >
                      {d.kanji}
                    </Text>
                    <Text style={[s.cellName, w.done && { color: d.color }]}>{d.name}</Text>
                    {w.frozen && <Text style={s.freezeTag}>FREEZE</Text>}
                  </View>
                );
              })}
            </View>
            <Text style={s.note}>
              {doneCount === 7 ? 'A perfect week!' : `${doneCount} of 7 days lit this week`}
            </Text>
          </>
        ) : (
          <View style={s.month}>
            <View style={s.monthHead}>
              <Pressable onPress={() => setOffset(offset - 1)} hitSlop={10}>
                <Text style={s.arrow}>‹</Text>
              </Pressable>
              <Text style={s.monthTitle}>
                {MONTHS[first.getMonth()]} {first.getFullYear()}
              </Text>
              <Pressable onPress={() => canNext && setOffset(offset + 1)} hitSlop={10}>
                <Text style={[s.arrow, !canNext && s.arrowOff]}>›</Text>
              </Pressable>
            </View>

            <View style={s.calRow}>
              {WEEK_ORDER.map((dow) => (
                <View key={dow} style={s.calCell}>
                  <Text style={s.calHead}>{WEEKDAYS[dow].kanji}</Text>
                </View>
              ))}
            </View>

            {rows.map((row, ri) => (
              <View key={ri} style={s.calRow}>
                {row.map((c, ci) => {
                  if (!c) return <View key={ci} style={s.calCell} />;
                  const prev = ci > 0 ? row[ci - 1] : null;
                  const next = ci < 6 ? row[ci + 1] : null;
                  const joinL = c.done && !!prev && prev.done;
                  const joinR = c.done && !!next && next.done;
                  return (
                    <View key={ci} style={s.calCell}>
                      <View
                        style={[
                          s.pill,
                          c.done && s.pillOn,
                          c.frozen && s.pillFrozen,
                          c.done && {
                            borderTopLeftRadius: joinL ? 0 : 16,
                            borderBottomLeftRadius: joinL ? 0 : 16,
                            borderTopRightRadius: joinR ? 0 : 16,
                            borderBottomRightRadius: joinR ? 0 : 16,
                          },
                        ]}
                      />
                      <View style={[s.dayRing, c.isToday && s.dayRingToday]}>
                        <Text style={[s.dayNum, c.future && s.dayFuture, c.done && s.dayDone, c.frozen && s.dayFrozen]}>{c.n}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            <Text style={s.note}>
              {monthDone === 0
                ? 'No practice days this month'
                : `${monthDone} ${monthDone === 1 ? 'day' : 'days'} practiced · longest run ${longest}`}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={freezeModal} transparent animationType="fade" onRequestClose={() => setFreezeModal(false)}>
        <View style={s.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFreezeModal(false)} />
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Streak freeze</Text>
              <Pressable onPress={() => setFreezeModal(false)} hitSlop={10}>
                <Text style={s.modalClose}>×</Text>
              </Pressable>
            </View>
            <Text style={s.modalInventory}>Available: {freeze.available}/1</Text>

            <View style={s.optionCard}>
              <Text style={s.optionTitle}>Option 1 · Quick challenge</Text>
              <Text style={s.optionText}>Type all 46 hiragana correctly within 80 seconds to refill your freeze.</Text>
              <Pressable
                disabled={freeze.available === 1}
                style={[s.challengeButton, freeze.available === 1 && s.challengeButtonLocked]}
                onPress={() => {
                  setFreezeModal(false);
                  router.push({ pathname: '/practice', params: { mode: 'freeze' } } as any);
                }}
              >
                <Text style={[s.challengeButtonText, freeze.available === 1 && s.challengeButtonTextLocked]}>
                  {freeze.available === 1 ? 'Locked · inventory full' : 'Start challenge'}
                </Text>
              </Pressable>
            </View>

            <View style={s.optionCard}>
              <Text style={s.optionTitle}>Option 2 · Wait 48 hours</Text>
              <Text style={s.optionText}>
                {freeze.available === 1
                  ? 'The 48-hour timer starts automatically when your freeze is used.'
                  : freeze.refillAt
                    ? `Freeze refills in ${formatRemaining(Math.max(0, freeze.refillAt - clockNow))}.`
                    : 'Your freeze will refill 48 hours after it is used.'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: { alignItems: 'center' },
    top: { width: '100%', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    link: { color: colors.accent, fontSize: 15, padding: 6 },
    scroll: { flex: 1, width: '100%' },
    content: {
      width: '100%', maxWidth: 480, alignSelf: 'center', alignItems: 'center',
      paddingHorizontal: 16, paddingBottom: 32,
    },
    count: { color: colors.text, fontSize: 52, fontWeight: '800', marginTop: -4 },
    countLabel: { color: colors.warn, fontSize: 18, fontWeight: '600' },
    best: { color: colors.muted, fontSize: 14, marginTop: 4 },
    freezeBadge: { backgroundColor: colors.key, borderWidth: 1, borderColor: colors.accent, borderRadius: 14, paddingVertical: 7, paddingHorizontal: 12 },
    freezeBadgeText: { color: colors.text, fontSize: 14, fontWeight: '700' },
    modalBackdrop: { flex: 1, backgroundColor: '#0009', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { width: '100%', maxWidth: 440, backgroundColor: colors.bgTop, borderWidth: 1, borderColor: colors.keyHint, borderRadius: 22, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { color: colors.text, fontSize: 23, fontWeight: '800' },
    modalClose: { color: colors.muted, fontSize: 30, lineHeight: 32, paddingHorizontal: 4 },
    modalInventory: { color: colors.accent, fontSize: 14, fontWeight: '700', marginTop: 4, marginBottom: 14 },
    optionCard: { backgroundColor: colors.key, borderRadius: 15, padding: 14, marginTop: 8 },
    optionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    optionText: { color: colors.textSoft, fontSize: 13, lineHeight: 19, marginTop: 5 },
    challengeButton: { backgroundColor: colors.accent, borderRadius: 11, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    challengeButtonLocked: { backgroundColor: colors.bgBottom, borderWidth: 1, borderColor: colors.keyHint },
    challengeButtonText: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
    challengeButtonTextLocked: { color: colors.muted },
    todayBox: { alignItems: 'center', marginTop: 18 },
    todayKanji: {
      fontSize: 64, fontWeight: '300', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 },
    },
    todayOff: { opacity: 0.45, textShadowRadius: 0 },
    todayText: { color: colors.text, fontSize: 18, fontWeight: '600' },
    todayRead: { color: colors.muted, fontSize: 14, marginTop: 2 },
    todayHint: { color: colors.textSoft, fontSize: 14, marginTop: 8, textAlign: 'center' },
    seg: {
      flexDirection: 'row', marginTop: 24, backgroundColor: colors.key, borderRadius: 12,
      padding: 3, width: 200,
    },
    segBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    segBtnOn: { backgroundColor: colors.accent },
    segText: { color: colors.textSoft, fontSize: 15, fontWeight: '500' },
    segTextOn: { color: colors.onAccent, fontWeight: '700' },
    week: { flexDirection: 'row', gap: 6, marginTop: 18, width: '100%' },
    cell: {
      flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
      borderWidth: 1.5, borderColor: colors.key, backgroundColor: colors.key,
    },
    cellToday: { borderColor: colors.accent, backgroundColor: 'transparent' },
    cellFrozen: { borderColor: colors.accent, backgroundColor: `${colors.accent}20` },
    freezeTag: { color: colors.accent, fontSize: 8, fontWeight: '800', marginTop: 2 },
    cellKanji: { fontSize: 24, textShadowOffset: { width: 0, height: 0 } },
    cellOff: { color: colors.muted, opacity: 0.6 },
    cellName: { color: colors.muted, fontSize: 11, marginTop: 2 },
    note: { color: colors.textSoft, fontSize: 14, marginTop: 14, textAlign: 'center' },
    month: { width: '100%', marginTop: 16 },
    monthHead: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 8, marginBottom: 10,
    },
    monthTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
    arrow: { color: colors.accent, fontSize: 30, paddingHorizontal: 10, lineHeight: 32 },
    arrowOff: { opacity: 0.2 },
    calRow: { flexDirection: 'row', marginBottom: 4 },
    calCell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
    calHead: { color: colors.muted, fontSize: 14 },
    pill: { position: 'absolute', left: 0, right: 0, top: 3, bottom: 3 },
    pillOn: { backgroundColor: `${FIRE}33` },
    pillFrozen: { backgroundColor: `${colors.accent}55` },
    dayRing: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: 'transparent',
    },
    dayRingToday: { borderColor: colors.accent },
    dayNum: { color: colors.textSoft, fontSize: 14 },
    dayFuture: { opacity: 0.35 },
    dayDone: { color: FIRE, fontWeight: '700' },
    dayFrozen: { color: colors.accent, fontWeight: '700' },
  });
