import { ActionSheetIOS, Alert, Platform } from 'react-native';

export interface MenuOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

/** Cross-platform overflow menu: native action sheet on iOS, alert buttons elsewhere. */
export function showMenu(title: string, options: MenuOption[]) {
  if (Platform.OS === 'ios') {
    const labels = [...options.map((o) => o.label), 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: options.flatMap((o, i) => (o.destructive ? [i] : [])),
      },
      (index) => options[index]?.onPress(),
    );
    return;
  }
  Alert.alert(title, undefined, [
    ...options.map((o) => ({ text: o.label, onPress: o.onPress, style: o.destructive ? ('destructive' as const) : undefined })),
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void, destructive = true) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
