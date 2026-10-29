import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../Screen';
import { Settings, loadSettings, resetProgress, saveSettings } from '../settings';
import { colors } from '../theme';

const PRIVACY_URL = 'https://github.com/demeterjp/shinkai/blob/main/PRIVACY.md';
const FEEDBACK_URL = 'mailto:dmytropoli30@gmail.com?subject=Shinkai%20feedback';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  function change(patch: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  function confirmReset() {
    Alert.alert(
      'Reset progress?',
      'This clears your statistics, your mistakes list and your streak. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            Alert.alert('Done', 'Your progress was reset.');
          },
        },
      ]
    );
  }

  const open = (url: string) => Linking.openURL(url).catch(() => {});
  const version = Constants.expoConfig?.version ?? '';

  return (
    <Screen>
      <View style={s.top}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.link}>← Menu</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.title}>Settings</Text>

        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Haptic feedback</Text>
              <Text style={s.rowSub}>Short vibrations when you type</Text>
            </View>
            <Switch
              value={settings?.haptics ?? true}
              onValueChange={(v) => change({ haptics: v })}
              trackColor={{ false: colors.key, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
          <View style={s.sep} />
          <View style={s.row}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Show hints on keys</Text>
              <Text style={s.rowSub}>Default for every new round</Text>
            </View>
            <Switch
              value={settings?.hints ?? true}
              onValueChange={(v) => change({ hints: v })}
              trackColor={{ false: colors.key, true: colors.accent }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        <View style={s.card}>
          <Pressable style={s.row} onPress={() => open(FEEDBACK_URL)}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Send feedback</Text>
              <Text style={s.rowSub}>Found a bug or have an idea? Write to me</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => open(PRIVACY_URL)}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Privacy policy</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => router.push('/onboarding' as any)}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>How it works</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        </View>

        <View style={s.card}>
          <Pressable style={s.row} onPress={confirmReset}>
            <View style={s.rowText}>
              <Text style={[s.rowTitle, { color: colors.bad }]}>Reset progress</Text>
              <Text style={s.rowSub}>Clear statistics, mistakes and streak</Text>
            </View>
          </Pressable>
        </View>

        {version ? <Text style={s.version}>Shinkai {version}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { width: '100%', paddingHorizontal: 16, paddingVertical: 8 },
  link: { color: colors.accent, fontSize: 15, padding: 6 },
  body: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginBottom: 18 },
  card: { backgroundColor: colors.key, borderRadius: 18, marginBottom: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowText: { flex: 1, paddingRight: 12 },
  rowTitle: { color: colors.text, fontSize: 17, fontWeight: '500' },
  rowSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  chev: { color: colors.muted, fontSize: 26 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.cell, marginLeft: 16 },
  version: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
