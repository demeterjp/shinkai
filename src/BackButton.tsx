import { StyleSheet, Text } from 'react-native';
import { TapPressable } from './TapPressable';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from './theme';

// Przycisk powrotu z narysowaną strzałką (znak "←" wygląda w czcionce systemowej krzywo)
export function BackButton({ onPress, label = 'Menu' }: { onPress: () => void; label?: string }) {
  const { colors } = useTheme();
  return (
    <TapPressable onPress={onPress} hitSlop={10} style={s.row}>
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d="M15 4.5 L7.5 12 L15 19.5"
          stroke={colors.accent}
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={[s.text, { color: colors.accent }]}>{label}</Text>
    </TapPressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingRight: 8 },
  text: { fontSize: 16, fontWeight: '500', marginLeft: 2 },
});
