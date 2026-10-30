import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { Colors, useStyles } from '../theme';

export default function LearnMenu() {
  const router = useRouter();
  const { s } = useStyles(makeStyles);

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={s.content}>
        <Text style={s.title}>Learn the keyboard</Text>
        <Pressable style={s.button} onPress={() => router.push('/learn-guide' as any)}>
          <Text style={s.buttonTitle}>Learn the keyboard</Text>
          <Text style={s.buttonSub}>Step by step, learn how the flick keys work</Text>
        </Pressable>
        <Pressable style={s.button} onPress={() => router.push('/your-keyboard' as any)}>
          <Text style={s.buttonTitle}>Your keyboard</Text>
          <Text style={s.buttonSub}>See which hiragana are strong and which need practice</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { alignItems: 'center' },
  top: { width: '100%', paddingHorizontal: 16, paddingVertical: 8 },
  content: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: c.text, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 28 },
  button: { width: '100%', maxWidth: 440, backgroundColor: c.key, borderRadius: 20, padding: 22, marginBottom: 14, alignItems: 'center' },
  buttonTitle: { color: c.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  buttonSub: { color: c.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
});
