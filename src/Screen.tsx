import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';

export function Screen({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={s.fill}>
      <SafeAreaView style={[s.fill, style]}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({ fill: { flex: 1 } });