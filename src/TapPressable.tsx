import { useState } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { play } from './sounds';

const LIP = 4; // wysokość "krawędzi" przycisku 3D
const PRESS = 3; // o ile przycisk wciska się w dół

// Ciemniejsza wersja koloru (dla #rgb, #rrggbb, rgb(), rgba())
function darken(color: string, k = 0.72): string | null {
  let r: number, g: number, b: number;
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    const m = color.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/i);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.9) return null;
    r = +m[1]; g = +m[2]; b = +m[3];
  }
  return `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
}

// Pressable z dźwiękiem kliknięcia. Duże kolorowe przyciski dostają wygląd 3D
// (ciemna krawędź na dole) i wciskają się w dół po dotknięciu.
export function TapPressable({ onPress, style, onPressIn, onPressOut, ...rest }: PressableProps) {
  const [down, setDown] = useState(false);

  let lip: string | null = null;
  if (typeof style !== 'function') {
    const flat = (StyleSheet.flatten(style as StyleProp<ViewStyle>) || {}) as ViewStyle;
    const bg = flat.backgroundColor;
    const radius = typeof flat.borderRadius === 'number' ? flat.borderRadius : 0;
    if (typeof bg === 'string' && radius >= 14 && !flat.borderWidth && !flat.position) {
      lip = darken(bg);
    }
  }

  const style3d: ViewStyle | null = lip
    ? down
      ? { transform: [{ translateY: PRESS }], boxShadow: `0px ${LIP - PRESS}px 0px 0px ${lip}` }
      : { boxShadow: `0px ${LIP}px 0px 0px ${lip}` }
    : null;

  return (
    <Pressable
      {...rest}
      style={typeof style === 'function' ? style : [style, style3d]}
      onPressIn={(e) => {
        setDown(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setDown(false);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        play('tap');
        onPress?.(e);
      }}
    />
  );
}
