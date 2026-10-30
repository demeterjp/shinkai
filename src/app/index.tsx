import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flame } from '../Flame';
import { Screen } from '../Screen';
import { countBad, isOnboarded, loadStats } from '../storage';
import { StreakInfo, getStreak } from '../streak';
import { Colors, useStyles } from '../theme';
import { WEEKDAYS } from '../weekdays';

// Kanji nazwy aplikacji (zmień tutaj, jeśli chcesz inne znaki)
const APP_KANJI = '深海';

export default function Menu() {
  const router = useRouter();
  const { s } = useStyles(makeStyles);
  const [ready, setReady] = useState(false);
  const [badCount, setBadCount] = useState(0);
  const [streak, setStreak] = useState<StreakInfo>({ count: 0, best: 0, doneToday: false });
  const [today] = useState(() => WEEKDAYS[new Date().getDay()]);

  // Pierwsze uruchomienie: najpierw tutorial
  useEffect(() => {
    isOnboarded().then((done) => {
      if (done) setReady(true);
      else router.replace('/onboarding' as any);
    });
  }, []);

  // Przy każdym powrocie do menu odśwież liczbę błędów i serię
  useFocusEffect(
    useCallback(() => {
      loadStats().then((st) => setBadCount(countBad(st)));
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
          <Text style={s.gear}>⚙</Text>
        </Pressable>
      </View>

      <View style={s.screen}>
        <Text style={s.kanji}>{APP_KANJI}</Text>
        <Text style={s.title}>Shinkai</Text>
        <Text style={s.sub}>What do you want to practice?</Text>

        <Pressable style={[s.btn, s.btnLearn]} onPress={() => router.push('/learn' as any)}>
          <Text style={s.learnTitle}>Learn the keyboard</Text>
          <Text style={s.learnSub}>How the flick keys work, step by step</Text>
        </Pressable>

        <Pressable style={s.btn} onPress={() => choose('hira')}>
          <Text style={s.kana}>あ</Text>
          <Text style={s.label}>Hiragana</Text>
        </Pressable>

        <Pressable style={s.btn} onPress={() => choose('kata')}>
          <Text style={s.kana}>ア</Text>
          <Text style={s.label}>Katakana</Text>
        </Pressable>

        <Pressable style={[s.btn, s.btnWeak]} onPress={() => router.push('/mistakes' as any)}>
          <Text style={s.weakTitle}>Review mistakes</Text>
          <Text style={s.weakSub}>
            {badCount > 0
              ? `${badCount} ${badCount === 1 ? 'character' : 'characters'} to fix`
              : 'Nothing to fix right now'}
          </Text>
        </Pressable>
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
    gear: { color: colors.muted, fontSize: 26, padding: 4 },
    screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 0 },
    kanji: { color: colors.text, fontSize: 60, fontWeight: '300', letterSpacing: 8 },
    title: { color: colors.accent, fontSize: 22, fontWeight: '600', letterSpacing: 4, marginTop: 2 },
    sub: { color: colors.muted, fontSize: 16, marginTop: 10, marginBottom: 20 },
    btn: {
      width: '100%', maxWidth: 420, backgroundColor: colors.key, borderRadius: 20,
      paddingVertical: 14, marginBottom: 12, alignItems: 'center',
    },
    btnLearn: { borderWidth: 1.5, borderColor: colors.accent },
    btnWeak: { paddingVertical: 18 },
    learnTitle: { color: colors.text, fontSize: 20, fontWeight: '600' },
    learnSub: { color: colors.muted, fontSize: 14, marginTop: 4 },
    kana: { color: colors.text, fontSize: 42 },
    label: { color: colors.textSoft, fontSize: 18, marginTop: 2 },
    weakTitle: { color: colors.text, fontSize: 20, fontWeight: '600' },
    weakSub: { color: colors.muted, fontSize: 14, marginTop: 4 },
  });
