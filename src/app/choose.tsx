import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { Colors, useStyles } from '../theme';

export default function Choose() {
  const { s } = useStyles(makeStyles);
  const router = useRouter();
  const { script } = useLocalSearchParams<{ script?: string }>();
  const kata = script === 'kata';
  const mode = kata ? 'kata' : 'hira';

  // replace, żeby "← Menu" w ćwiczeniu wracało do menu, a nie do tego ekranu
  const go = (count: '10' | 'all' | 'ext') =>
    router.replace({ pathname: '/practice', params: { mode, count } } as any);

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
      </View>

      <View style={s.content}>
        <Text style={s.kana}>{kata ? 'ア' : 'あ'}</Text>
        <Text style={s.title}>{kata ? 'Katakana' : 'Hiragana'}</Text>

        <Pressable style={s.btn} onPress={() => go('10')}>
          <Text style={s.btnTitle}>10 random characters</Text>
          <Text style={s.btnSub}>10 characters, different ones each time</Text>
        </Pressable>

        <Pressable style={s.btn} onPress={() => go('all')}>
          <Text style={s.btnTitle}>All 46 characters</Text>
          <Text style={s.btnSub}>Every character once, in a new random order</Text>
        </Pressable>

        <Pressable style={s.btn} onPress={() => go('ext')}>
          <Text style={s.btnTitle}>{kata ? 'ガ ッ ャ ー and more' : 'が っ ゃ ー and more'}</Text>
          <Text style={s.btnSub}>Dakuten, small kana and ー: 10 random, typed with the 小゛゜ key</Text>
        </Pressable>
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
  title: { color: colors.textSoft, fontSize: 22, marginBottom: 28 },
  btn: {
    width: '100%', maxWidth: 420, backgroundColor: colors.key, borderRadius: 20,
    paddingVertical: 20, paddingHorizontal: 16, marginBottom: 14, alignItems: 'center',
  },
  btnTitle: { color: colors.text, fontSize: 20, fontWeight: '600' },
  btnSub: { color: colors.muted, fontSize: 14, marginTop: 4, textAlign: 'center' },
});