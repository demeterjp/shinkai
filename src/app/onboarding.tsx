import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../Screen';
import { setOnboarded } from '../storage';
import { colors } from '../theme';

const PAGES = [
  {
    icon: 'あ',
    title: 'Make typing kana automatic',
    body:
      'Shinkai trains you to type Japanese on the flick keyboard used on phones. Short rounds and lots of repetition, until your thumb knows where every character is without you having to think about it.',
  },
  {
    icon: '← ↑ →',
    title: 'Type with flicks',
    body:
      'This keyboard is built into the app. Tap a key to type its main character. To type the others, swipe from the key in the direction where the character sits: left, up, right or down. The small hints on the keys show you where. Switch them off when you want to test your memory.',
  },
  {
    icon: '20',
    title: 'Ways to practice',
    body:
      'Hiragana and Katakana give you rounds of 20 characters. Review weakest is a separate mode that focuses only on the characters you find hardest. Characters you struggled with in earlier rounds come back more often.',
  },
  {
    icon: '✓',
    title: 'Practice that adapts',
    body:
      'Shinkai notices which characters take you the longest and which ones trip you up, so it can give those more practice and show the ones you already know well less often. This is only used to shape your practice. It stays on your phone and is never sent anywhere.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const p = PAGES[page];

  async function finish() {
    await setOnboarded();
    if (router.canGoBack()) router.back();
    else router.replace('/' as any);
  }

  return (
    <Screen style={s.screen}>
      <View style={s.top}>
        <Pressable onPress={finish}>
          <Text style={s.skip}>Skip</Text>
        </Pressable>
      </View>

      <View style={s.content}>
        <Text style={s.icon}>{p.icon}</Text>
        <Text style={s.title}>{p.title}</Text>
        <Text style={s.body}>{p.body}</Text>
      </View>

      <View style={s.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[s.dot, i === page && s.dotOn]} />
        ))}
      </View>

      <Pressable style={s.btn} onPress={() => (last ? finish() : setPage(page + 1))}>
        <Text style={s.btnText}>{last ? 'Finish' : 'Next'}</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { paddingHorizontal: 24, paddingBottom: 16 },
  top: { alignItems: 'flex-start', paddingTop: 8 },
  skip: { color: colors.muted, fontSize: 16, padding: 8 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { color: colors.accent, fontSize: 80, marginBottom: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  body: { color: colors.textSoft, fontSize: 17, lineHeight: 25, textAlign: 'center', maxWidth: 480 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.key, marginHorizontal: 5 },
  dotOn: { backgroundColor: colors.accent },
  btn: {
    backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', width: '100%', maxWidth: 480, alignSelf: 'center',
  },
  btnText: { color: colors.onAccent, fontSize: 18, fontWeight: '600' },
});