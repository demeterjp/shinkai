import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { WEEKDAYS } from './weekdays';

// Narysowany płomień z trzech warstw (viewBox 100 x 130). Każda warstwa faluje osobno.
const OUTER =
  'M50 2 C57 22 84 40 87 72 C90 103 72 128 50 128 C28 128 10 104 13 74 C15 56 25 47 33 33 C35 45 42 49 46 41 C50 31 45 16 50 2 Z';
const MID =
  'M50 34 C56 50 74 62 76 86 C78 108 66 124 50 124 C34 124 22 108 24 88 C26 74 34 68 40 58 C42 66 47 68 49 62 C52 54 48 44 50 34 Z';
const CORE =
  'M50 76 C57 88 64 96 62 108 C61 118 56 123 50 123 C44 123 39 118 38 108 C36 96 44 88 50 76 Z';

let glowCounter = 0;

const OFF: [string, string, string] = ['#4a5560', '#66727d', '#8b97a1'];

type Props = {
  size?: number; // wysokość płomienia
  active?: boolean; // false = szary, nieruchomy (seria czeka na dzisiejsze ćwiczenie)
  pop?: boolean; // true = efekt "wskoczenia" przy powiększeniu serii
  day?: number; // 0-6 jak Date.getDay(); domyślnie dziś (kolor płomienia = żywioł dnia)
};

function useLoop(duration: number, delay: number, enabled: boolean) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: duration * 1.15, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [enabled, duration, delay, v]);
  return v;
}

function useSpark(duration: number, delay: number, enabled: boolean) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [enabled, duration, delay, v]);
  return v;
}

export function Flame({ size = 40, active = true, pop = false, day }: Props) {
  const [today] = useState(() => new Date().getDay());
  const [pops] = useState(() => new Animated.Value(pop ? 0.2 : 1));
  const [gid] = useState(() => `shinkaiGlow${++glowCounter}`);
  const palette = active ? WEEKDAYS[day ?? today].flame : OFF;

  const a = useLoop(520, 0, active); // zewnętrzny język
  const b = useLoop(400, 130, active); // środek
  const c = useLoop(310, 60, active); // rdzeń
  const glow = useLoop(900, 0, active);
  const s1 = useSpark(1500, 0, active);
  const s2 = useSpark(1900, 700, active);

  useEffect(() => {
    if (!pop) return;
    Animated.spring(pops, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [pop, pops]);

  const h = size;
  const w = size * 1.0; // szerszy niż oryginalne proporcje (viewBox jest rozciągany)
  const boxW = size * 1.7;
  const boxH = size * 1.4;

  // Skalowanie od dołu płomienia: przesuwamy, skalujemy i wracamy
  const grow = (v: Animated.Value, amount: number, tilt: number) => ({
    transform: [
      { translateY: h / 2 },
      { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + amount] }) },
      { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1 - amount * 0.6] }) },
      { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`${-tilt}deg`, `${tilt}deg`] }) },
      { translateY: -h / 2 },
    ],
  });

  const layer = (path: string, fill: string, style: object) => (
    <Animated.View style={[StyleSheet.absoluteFill, s.center, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 130" preserveAspectRatio="none">
        <Path d={path} fill={fill} />
      </Svg>
    </Animated.View>
  );

  const spark = (v: Animated.Value, left: number, color: string) => (
    <Animated.View
      pointerEvents="none"
      style={[
        s.spark,
        {
          left,
          bottom: boxH * 0.55,
          width: size * 0.09,
          height: size * 0.09,
          borderRadius: size * 0.05,
          backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.5] }) },
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.06] }) },
          ],
        },
      ]}
    />
  );

  return (
    <Animated.View
      style={{ width: boxW, height: boxH, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pops }] }}
    >
      {active && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.1] }) }],
          }}
        >
          <Svg width={size * 2} height={size * 2}>
            <Defs>
              <RadialGradient id={gid} cx="50%" cy="55%" r="50%">
                <Stop offset="0" stopColor={palette[0]} stopOpacity="0.5" />
                <Stop offset="0.6" stopColor={palette[0]} stopOpacity="0.14" />
                <Stop offset="1" stopColor={palette[0]} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={size * 2} height={size * 2} fill={`url(#${gid})`} />
          </Svg>
        </Animated.View>
      )}
      <View style={{ width: w, height: h }}>
        {layer(OUTER, palette[0], active ? grow(a, 0.07, 2.5) : {})}
        {layer(MID, palette[1], active ? grow(b, 0.09, 3) : {})}
        {layer(CORE, palette[2], active ? grow(c, 0.12, 2) : {})}
      </View>
      {active && spark(s1, boxW * 0.38, palette[2])}
      {active && spark(s2, boxW * 0.58, palette[1])}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  spark: { position: 'absolute' },
});
