import * as Haptics from 'expo-haptics';

// Wszystko bezpieczne: brak wibracji w telefonie nigdy nie psuje aplikacji.
// Celowo tylko najlżejsze bodźce, żeby nic nie "waliło".
function run(fn: () => Promise<void>) {
  try {
    fn().catch(() => {});
  } catch {}
}

// Ruch palca po klawiszu: bez wibracji (zostawione dla zgodności z wywołaniami)
export function tick(_enabled: boolean) {}

export function good(enabled: boolean) {
  if (!enabled) return;
  run(() => Haptics.selectionAsync());
}

export function bad(enabled: boolean) {
  if (!enabled) return;
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}
