import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Flame } from '../Flame';
import { Screen } from '../Screen';
import { isOnboarded } from '../storage';
import { StreakInfo, getStreak } from '../streak';
import { Colors, useStyles } from '../theme';
import { WEEKDAYS } from '../weekdays';

// Kanji nazwy aplikacji (zmień tutaj, jeśli chcesz inne znaki)
const APP_KANJI = '深海';

function SettingsIcon({ color, background }: { color: string; background: string }) {
  return (
    <Svg width={27} height={27} viewBox="0 0 24 24">
      <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.4" fill={background} stroke={color} strokeWidth="1.8" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="16" cy="12" r="2.4" fill={background} stroke={color} strokeWidth="1.8" />
      <Line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="10" cy="18" r="2.4" fill={background} stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function FlickIcon({ color }: { color: string }) {
  const places = [sIcon.up, sIcon.left, sIcon.center, sIcon.right, sIcon.down];
  return (
    <View style={sIcon.flick}>
      {places.map((place, i) => <View key={i} style={[sIcon.square, place, { borderColor: color }]} />)}
    </View>
  );
}

function WeakestIcon({ color, accent }: { color: string; accent: string }) {
  return (
    <View style={sIcon.bars}>
      <View style={[sIcon.bar, { height: 48, left: 7, backgroundColor: color }]} />
      <View style={[sIcon.bar, { height: 34, left: 34, backgroundColor: color }]} />
      <View style={[sIcon.bar, { height: 20, left: 61, backgroundColor: accent }]} />
      <View style={[sIcon.barBase, { backgroundColor: color }]} />
    </View>
  );
}

const sIcon = StyleSheet.create({
  flick: { width: 88, height: 88, position: 'relative' },
  square: { width: 24, height: 24, borderWidth: 3, borderRadius: 4, position: 'absolute' },
  up: { top: 0, left: 30 },
  left: { top: 30, left: 2 },
  center: { top: 30, left: 30 },
  right: { top: 30, left: 58 },
  down: { top: 60, left: 30 },
  bars: { width: 88, height: 88, position: 'relative' },
  bar: { position: 'absolute', width: 18, bottom: 10, borderRadius: 4 },
  barBase: { position: 'absolute', left: 4, right: 4, bottom: 5, height: 3, borderRadius: 2 },
});

export default function Menu() {
  const router = useRouter();
  const { s, colors } = useStyles(makeStyles);
  const [ready, setReady] = useState(false);
  const [streak, setStreak] = useState<StreakInfo>({ count: 0, best: 0, doneToday: false });
  const [today] = useState(() => WEEKDAYS[new Date().getDay()]);

  // Pierwsze uruchomienie: najpierw tutorial
  useEffect(() => {
    isOnboarded().then((done) => {
      if (done) setReady(true);
      else router.replace('/onboarding' as any);
    });
  }, []);

  // Przy każdym powrocie do menu odśwież serię
  useFocusEffect(
    useCallback(() => {
      getStreak().then(setStreak);
    }, [])
  );

  const choose = (script: 'hira' | 'kata') =>
    router.push({ pathname: '/choose', params: { script } } as any);

  if (!ready) return <Screen />;

  return (
    <Screen>
      <View style={s.bar}>
        <Pressable style={s.chip} onPress={() => router.push('/streak' as any)} hitSlop={6}>
          <Flame size={26} active={streak.doneToday} />
          <Text style={[s.chipNum, !streak.doneToday && s.chipDim]}>{streak.count}</Text>
        </Pressable>

        <Pressable style={s.chip} onPress={() => router.push('/streak' as any)} hitSlop={6}>
          <Text
            style={[
              s.dayKanji,
              streak.doneToday
                ? { color: today.color, textShadowColor: today.color, textShadowRadius: 10 }
                : s.chipDim,
            ]}
          >
            {today.kanji}
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <Pressable onPress={() => router.push('/settings' as any)} hitSlop={10}>
          <SettingsIcon color={colors.muted} background={colors.bgTop} />
        </Pressable>
      </View>

      <View style={s.screen}>
        <View style={s.menuContent}>
          <View style={s.brand}>
            <Text style={s.kanji}>{APP_KANJI}</Text>
            <Text style={s.title}>Shinkai</Text>
          </View>

          <View style={s.grid}>
          <Pressable style={s.tile} onPress={() => router.push('/learn' as any)}>
            <FlickIcon color={colors.accent} />
            <Text style={s.tileLabel}>Learn the keyboard</Text>
          </Pressable>

          <Pressable style={s.tile} onPress={() => choose('hira')}>
            <Text style={s.kana}>あ</Text>
            <Text style={s.tileLabel}>Classic</Text>
          </Pressable>

          <Pressable style={s.tile} onPress={() => router.push('/extra' as any)}>
            <Text style={s.kana}>ア</Text>
            <Text style={s.tileLabel}>Extra</Text>
          </Pressable>

          <Pressable style={s.tile} onPress={() => router.push('/weakest' as any)}>
            <WeakestIcon color={colors.textSoft} accent={colors.accent} />
            <Text style={s.tileLabel}>Practice weakest</Text>
          </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    bar: {
      width: '100%', flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 6, paddingBottom: 2,
    },
    chip: { flexDirection: 'row', alignItems: 'center', marginRight: 6 },
    chipNum: { color: colors.warn, fontSize: 19, fontWeight: '700', marginLeft: -8 },
    chipDim: { color: colors.muted },
    dayKanji: { fontSize: 24, fontWeight: '600', textShadowOffset: { width: 0, height: 0 } },
    screen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 12 },
    menuContent: { width: '100%', alignItems: 'center', transform: [{ translateY: -26 }] },
    brand: { alignItems: 'center', marginBottom: 48 },
    kanji: { color: colors.text, fontSize: 60, fontWeight: '300', letterSpacing: 8 },
    title: { color: colors.accent, fontSize: 22, fontWeight: '600', letterSpacing: 4, marginTop: 2 },
    grid: { width: '100%', maxWidth: 520, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
    tile: {
      width: '48.2%', aspectRatio: 0.88, backgroundColor: colors.key, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center', padding: 16,
    },
    kana: { color: colors.text, fontSize: 88, lineHeight: 100 },
    tileLabel: { color: colors.text, fontSize: 19, lineHeight: 25, textAlign: 'center', marginTop: 8 },
    tileSub: { color: colors.muted, fontSize: 13, marginTop: 3 },
  });
