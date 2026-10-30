import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { BackButton } from '../BackButton';
import { Screen } from '../Screen';
import { good } from '../haptics';
import { Settings, ThemeId, loadSettings, resetProgress, saveSettings } from '../settings';
import { Colors, THEMES, THEME_ORDER, useStyles, useTheme } from '../theme';

const PRIVACY_URL = 'https://github.com/demeterjp/shinkai/blob/main/PRIVACY.md';
const ISSUES_URL = 'https://github.com/demeterjp/shinkai/issues/new';
const MAIL_URL = 'mailto:dmytropoli30@gmail.com?subject=Shinkai%20feedback';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, s } = useStyles(makeStyles);
  const { setTheme } = useTheme();
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

  function pickTheme(id: ThemeId) {
    setTheme(id);
    change({ theme: id });
  }

  function toggleHaptics(on: boolean) {
    change({ haptics: on });
    good(on); // krótka próbka
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
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.title}>Settings</Text>

        <Text style={s.section}>Theme</Text>
        <View style={s.card}>
          {THEME_ORDER.map((id, i) => {
            const t = THEMES[id];
            const on = settings?.theme === id;
            return (
              <View key={id}>
                {i > 0 && <View style={s.sep} />}
                <Pressable style={s.row} onPress={() => pickTheme(id)}>
                  <View style={[s.swatch, { backgroundColor: t.colors.bgTop, borderColor: t.colors.accent }]}>
                    <View style={[s.swatchDot, { backgroundColor: t.colors.accent }]} />
                  </View>
                  <View style={s.rowText}>
                    <Text style={s.rowTitle}>{t.name}</Text>
                  </View>
                  {on ? <Text style={s.check}>✓</Text> : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text style={s.section}>Typing</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Haptic feedback</Text>
              <Text style={s.rowSub}>A light tap when you answer</Text>
            </View>
            <Switch
              value={settings?.haptics ?? true}
              onValueChange={toggleHaptics}
              trackColor={{ false: colors.cell, true: colors.accent }}
              thumbColor={colors.dark ? colors.text : '#ffffff'}
            />
          </View>
        </View>

        <Text style={s.section}>Help</Text>
        <View style={s.card}>
          <Pressable style={s.row} onPress={() => open(ISSUES_URL)}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Report on GitHub</Text>
              <Text style={s.rowSub}>Open a new issue (needs a free GitHub account)</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => open(MAIL_URL)}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Send feedback by email</Text>
              <Text style={s.rowSub}>No account needed</Text>
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
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => open(PRIVACY_URL)}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Privacy policy</Text>
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

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    top: { width: '100%', paddingHorizontal: 16, paddingVertical: 8 },
    link: { color: colors.accent, fontSize: 15, padding: 6 },
    body: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 520, alignSelf: 'center' },
    title: { color: colors.text, fontSize: 30, fontWeight: '700', marginBottom: 12 },
    section: { color: colors.muted, fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 6 },
    card: { backgroundColor: colors.key, borderRadius: 18, marginBottom: 16, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    rowText: { flex: 1, paddingRight: 12 },
    rowTitle: { color: colors.text, fontSize: 17, fontWeight: '500' },
    rowSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
    chev: { color: colors.muted, fontSize: 26 },
    check: { color: colors.accent, fontSize: 22, fontWeight: '700' },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.cell, marginLeft: 16 },
    version: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8 },
    swatch: {
      width: 30, height: 30, borderRadius: 15, borderWidth: 2, marginRight: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    swatchDot: { width: 12, height: 12, borderRadius: 6 },
  });
