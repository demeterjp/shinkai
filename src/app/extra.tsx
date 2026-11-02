import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { Colors, useStyles } from '../theme';

export default function ExtraMenu() {
  const { s } = useStyles(makeStyles);
  const router = useRouter();

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={s.content}>
        <Text style={s.title}>Extra</Text>
        <Pressable style={s.button} onPress={() => router.push({ pathname: '/choose', params: { script: 'kata' } } as any)}>
          <Text style={s.kana}>ア</Text>
          <Text style={s.label}>Katakana</Text>
        </Pressable>
        <Pressable
          style={[s.button, s.buttonGap]}
          onPress={() => router.push({ pathname: '/choose', params: { script: 'hira', blind: '1' } } as any)}
        >
          <Text style={s.kana}>?</Text>
          <Text style={s.label}>Blind keyboard</Text>
          <Text style={s.sub}>The keys are empty. Type from memory.</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: { width: '100%', paddingHorizontal: 16, paddingVertical: 8 },
  content: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: c.text, fontSize: 30, fontWeight: '700', marginBottom: 28 },
  button: {
    width: '100%', maxWidth: 420, minHeight: 150, backgroundColor: c.key,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
  },
  buttonGap: { marginTop: 14 },
  kana: { color: c.text, fontSize: 64 },
  label: { color: c.textSoft, fontSize: 20, marginTop: 2 },
  sub: { color: c.muted, fontSize: 14, marginTop: 4 },
});
