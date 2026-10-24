import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '../Screen';
import { isOnboarded } from '../storage';
import { colors } from '../theme';

export default function Menu() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Pierwsze uruchomienie: najpierw tutorial
  useEffect(() => {
    isOnboarded().then((done) => {
      if (done) setReady(true);
      else router.replace('/onboarding' as any);
    });
  }, []);

  const go = (mode: 'hira' | 'kata' | 'weak') =>
    router.push({ pathname: '/practice', params: { mode } } as any);

  if (!ready) return <Screen style={s.screen} />;

  return (
    <Screen style={s.screen}>
      <Text style={s.title}>Shinkai</Text>
      <Text style={s.sub}>What do you want to practice?</Text>

      <Pressable style={s.btn} onPress={() => go('hira')}>
        <Text style={s.kana}>あ</Text>
        <Text style={s.label}>Hiragana</Text>
      </Pressable>

      <Pressable style={s.btn} onPress={() => go('kata')}>
        <Text style={s.kana}>ア</Text>
        <Text style={s.label}>Katakana</Text>
      </Pressable>

      <Pressable style={[s.btn, s.btnWeak]} onPress={() => go('weak')}>
        <Text style={s.weakTitle}>Review weakest</Text>
        <Text style={s.weakSub}>Characters that need the most attention</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/onboarding' as any)}>
        <Text style={s.link}>How it works</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: colors.text, fontSize: 40, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 16, marginBottom: 28 },
  btn: {
    width: '100%', maxWidth: 420, backgroundColor: colors.key, borderRadius: 20,
    paddingVertical: 18, marginBottom: 14, alignItems: 'center',
  },
  btnWeak: { paddingVertical: 20 },
  kana: { color: colors.text, fontSize: 48 },
  label: { color: colors.textSoft, fontSize: 18, marginTop: 2 },
  weakTitle: { color: colors.text, fontSize: 20, fontWeight: '600' },
  weakSub: { color: colors.muted, fontSize: 14, marginTop: 4 },
  link: { color: colors.accent, fontSize: 15, marginTop: 12, padding: 8 },
});