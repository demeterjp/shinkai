import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { loadSettings } from '../settings';
import { setSoundsEnabled } from '../sounds';
import { ThemeProvider, useTheme } from '../theme';

function Shell() {
  const { colors } = useTheme();
  useEffect(() => {
    loadSettings().then((cfg) => setSoundsEnabled(cfg.sounds));
  }, []);
  return (
    <>
      <StatusBar style={colors.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          contentStyle: { backgroundColor: colors.bgBottom },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
