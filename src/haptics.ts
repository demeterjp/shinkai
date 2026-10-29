import * as Haptics from 'expo-haptics';

// Każda funkcja jest bezpieczna: brak wibracji w telefonie nigdy nie psuje aplikacji.
export function tick(enabled: boolean) {
  if (!enabled) return;
  try {
    Haptics.selectionAsync().catch(() => {});
  } catch {}
}

export function good(enabled: boolean) {
  if (!enabled) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {}
}

export function bad(enabled: boolean) {
  if (!enabled) return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  } catch {}
}
