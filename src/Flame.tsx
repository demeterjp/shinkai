import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = {
  size?: number;
  active?: boolean; // false = przygaszony płomień (seria czeka na dzisiejsze ćwiczenie)
  pop?: boolean; // true = efekt "wskoczenia" przy powiększeniu serii
};

export function Flame({ size = 40, active = true, pop = false }: Props) {
  const [flicker] = useState(() => new Animated.Value(0)); // 0..1, pętla
  const [glow] = useState(() => new Animated.Value(0));
  const [pops] = useState(() => new Animated.Value(pop ? 0.2 : 1));

  useEffect(() => {
    if (!active) return;
    const f = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const g = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    f.start();
    g.start();
    return () => {
      f.stop();
      g.stop();
    };
  }, [active, flicker, glow]);

  useEffect(() => {
    if (!pop) return;
    Animated.spring(pops, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [pop, pops]);

  const scaleY = flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const scaleX = flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
  const rotate = flicker.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.38] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.2] });

  const box = size * 1.8;

  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {active && (
        <Animated.View
          style={[
            s.glow,
            {
              width: box * 0.8,
              height: box * 0.8,
              borderRadius: box * 0.4,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
      )}
      <Animated.Text
        style={{
          fontSize: size,
          opacity: active ? 1 : 0.35,
          transform: active
            ? [{ scale: pops }, { rotate }, { scaleX }, { scaleY }]
            : [{ scale: pops }],
        }}
      >
        🔥
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  glow: { position: 'absolute', backgroundColor: '#ff8a1f' },
});
