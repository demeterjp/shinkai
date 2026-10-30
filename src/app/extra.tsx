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
    width: '100%', maxWidth: 420, minHeight: 180, backgroundColor: c.key,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  kana: { color: c.text, fontSize: 72 },
  label: { color: c.textSoft, fontSize: 20, marginTop: 2 },
});
