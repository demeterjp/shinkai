import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '../Screen';
import { countBad, isOnboarded, loadStats } from '../storage';
import { colors } from '../theme';

// Kanji nazwy aplikacji (zmień tutaj, jeśli chcesz inne znaki)
const APP_KANJI = '深海';

export default function Menu() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [badCount, setBadCount] = useState(0);

  // Pierwsze uruchomienie: najpierw tutorial
  useEffect(() => {
    isOnboarded().then((done) => {
      if (done) setReady(true);
      else router.replace('/onboarding' as any);
    });
  }, []);

  // Przy każdym powrocie do menu odśwież liczbę błędów
  useFocusEffect(
    useCallback(() => {
      loadStats().then((st) => setBadCount(countBad(st)));
    }, [])
  );

  const choose = (script: 'hira' | 'kata') =>
    router.push({ pathname: '/choose', params: { script } } as any);

  if (!ready) return <Screen style={s.screen} />;

  return (
    <Screen style={s.screen}>
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

      <Pressable onPress={() => router.push('/onboarding' as any)}>
        <Text style={s.link}>How it works</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  kanji: { color: colors.text, fontSize: 64, fontWeight: '300', letterSpacing: 8 },
  title: { color: colors.accent, fontSize: 22, fontWeight: '600', letterSpacing: 4, marginTop: 2 },
  sub: { color: colors.muted, fontSize: 16, marginTop: 10, marginBottom: 22 },
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
  link: { color: colors.accent, fontSize: 15, marginTop: 8, padding: 8 },
});