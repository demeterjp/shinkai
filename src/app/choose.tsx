import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { Colors, useStyles } from '../theme';

export default function Choose() {
  const { s } = useStyles(makeStyles);
  const router = useRouter();
  const { script, blind: blindParam } = useLocalSearchParams<{ script?: string; blind?: string }>();
  const blind = blindParam === '1';
  const [pick, setPick] = useState<'hira' | 'kata'>(script === 'kata' ? 'kata' : 'hira');
  const kata = pick === 'kata';

  // replace, żeby "← Menu" w ćwiczeniu wracało do menu, a nie do tego ekranu
  const go = (count: '10' | 'all') =>
    router.replace({
      pathname: '/practice',
      params: blind ? { mode: pick, count, blind: '1' } : { mode: pick, count },
    } as any);

  const goWords = () => router.replace({ pathname: '/practice', params: { mode: 'words' } } as any);

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
      </View>

      <View style={s.content}>
        <Text style={s.kana}>{kata ? 'ア' : 'あ'}</Text>
        <Text style={s.title}>{blind ? (kata ? 'Blind · Katakana' : 'Blind · Hiragana') : kata ? 'Katakana' : 'Hiragana'}</Text>

        {blind && (
          <>
            <View style={s.seg}>
              {(['hira', 'kata'] as const).map((v) => (
                <Pressable key={v} style={[s.segBtn, pick === v && s.segBtnOn]} onPress={() => setPick(v)}>
                  <Text style={[s.segText, pick === v && s.segTextOn]}>{v === 'hira' ? 'あ  Hiragana' : 'ア  Katakana'}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.note}>The keys are empty. You have to remember where every character is.</Text>
          </>
        )}

        <Pressable style={s.btn} onPress={() => go('10')}>
          <Text style={s.btnTitle}>10 random characters</Text>
          <Text style={s.btnSub}>10 characters, different ones each time</Text>
        </Pressable>

        <Pressable style={s.btn} onPress={() => go('all')}>
          <Text style={s.btnTitle}>All 46 characters</Text>
          <Text style={s.btnSub}>Every character once, in a new random order</Text>
        </Pressable>

        {!blind && !kata && (
          <Pressable style={s.btn} onPress={goWords}>
            <Text style={s.btnTitle}>Words</Text>
            <Text style={s.btnSub}>Type whole words, one kana at a time</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: { width: '100%', paddingHorizontal: 16, paddingVertical: 8 },
  link: { color: colors.accent, fontSize: 15, padding: 6 },
  content: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 },
  kana: { color: colors.text, fontSize: 72 },
  title: { color: colors.textSoft, fontSize: 22, marginBottom: 20 },
  seg: {
    flexDirection: 'row', backgroundColor: colors.key, borderRadius: 12, padding: 3,
    width: '100%', maxWidth: 420, marginBottom: 10,
  },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segBtnOn: { backgroundColor: colors.accent },
  segText: { color: colors.textSoft, fontSize: 15, fontWeight: '500' },
  segTextOn: { color: colors.onAccent, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 16, maxWidth: 420 },
  btn: {
    width: '100%', maxWidth: 420, backgroundColor: colors.key, borderRadius: 20,
    paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12, alignItems: 'center',
  },
  btnTitle: { color: colors.text, fontSize: 20, fontWeight: '600' },
  btnSub: { color: colors.muted, fontSize: 14, marginTop: 4, textAlign: 'center' },
});
