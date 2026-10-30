import { ReactNode, createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeId, loadSettings } from './settings';

export type Colors = {
  bgTop: string;
  bgBottom: string;
  key: string;
  keyHint: string;
  cell: string;
  cellOn: string;
  text: string;
  textSoft: string;
  muted: string;
  accent: string;
  onAccent: string;
  ok: string;
  bad: string;
  warn: string;
  dark: boolean; // true = ciemny motyw (jasny pasek stanu)
};

export const THEMES: Record<ThemeId, { name: string; colors: Colors }> = {
  deepsea: {
    name: 'Deep sea',
    colors: {
      bgTop: '#0b1d2e', bgBottom: '#04101a', key: '#1a3347', keyHint: '#6f8fa3', cell: '#2c5470',
      cellOn: '#4fc3d9', text: '#eaf6fa', textSoft: '#b8d2de', muted: '#7f9db0', accent: '#4fc3d9',
      onAccent: '#04101a', ok: '#4cd9a0', bad: '#ff6b6b', warn: '#ffd60a', dark: true,
    },
  },
  dark: {
    name: 'Midnight',
    colors: {
      bgTop: '#141414', bgBottom: '#000000', key: '#222222', keyHint: '#7a7a7a', cell: '#383838',
      cellOn: '#8ab4f8', text: '#f2f2f2', textSoft: '#c4c4c4', muted: '#8a8a8a', accent: '#8ab4f8',
      onAccent: '#0a0a0a', ok: '#4cd9a0', bad: '#ff6b6b', warn: '#ffd60a', dark: true,
    },
  },
  light: {
    name: 'Daylight',
    colors: {
      bgTop: '#f7fafc', bgBottom: '#e1eaf2', key: '#ffffff', keyHint: '#8a9fb0', cell: '#cfe0ee',
      cellOn: '#1b8fb0', text: '#10242f', textSoft: '#3d5666', muted: '#657d8f', accent: '#1b8fb0',
      onAccent: '#ffffff', ok: '#1f9d6b', bad: '#d63f3f', warn: '#b87400', dark: false,
    },
  },
  sakura: {
    name: 'Sakura',
    colors: {
      bgTop: '#2c1a30', bgBottom: '#140b18', key: '#43284a', keyHint: '#b58fb8', cell: '#62396b',
      cellOn: '#ff8fb8', text: '#fdeef4', textSoft: '#e5c4d4', muted: '#b894a8', accent: '#ff8fb8',
      onAccent: '#1a0c14', ok: '#6fe3b0', bad: '#ff6b6b', warn: '#ffd36b', dark: true,
    },
  },
  forest: {
    name: 'Forest',
    colors: {
      bgTop: '#10281d', bgBottom: '#07140e', key: '#1c3a2c', keyHint: '#78a58c', cell: '#2f5a44',
      cellOn: '#7ddc9a', text: '#eaf7ee', textSoft: '#bcd8c5', muted: '#86a893', accent: '#7ddc9a',
      onAccent: '#07140e', ok: '#7ddc9a', bad: '#ff7b6b', warn: '#ffd60a', dark: true,
    },
  },
};

export const THEME_ORDER: ThemeId[] = ['deepsea', 'dark', 'light', 'sakura', 'forest'];

type Ctx = { id: ThemeId; colors: Colors; setTheme: (id: ThemeId) => void };

const ThemeContext = createContext<Ctx>({
  id: 'deepsea',
  colors: THEMES.deepsea.colors,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children?: ReactNode }) {
  const [id, setId] = useState<ThemeId>('deepsea');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setId(s.theme);
      setLoaded(true);
    });
  }, []);

  const value = useMemo(() => ({ id, colors: THEMES[id].colors, setTheme: setId }), [id]);

  // Czekamy na zapisany motyw, żeby nie mignął domyślny
  if (!loaded) return null;
  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Style zależne od motywu: const { colors, s } = useStyles(makeStyles)
export function useStyles<T>(make: (c: Colors) => T) {
  const { colors } = useContext(ThemeContext);
  const s = useMemo(() => make(colors), [colors]);
  return { colors, s };
}
