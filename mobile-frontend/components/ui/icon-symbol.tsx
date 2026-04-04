// Vector icon component using MaterialIcons

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

// Icon mapping for consistent naming across the app
const ICONS = {
  home: 'home' as IconName,
  inventory: 'inventory' as IconName,
  history: 'history' as IconName,
  settings: 'settings' as IconName,
  add: 'add' as IconName,
  remove: 'remove' as IconName,
  close: 'close' as IconName,
  chevronRight: 'chevron-right' as IconName,
  chevronLeft: 'chevron-left' as IconName,
  chevronDown: 'keyboard-arrow-down' as IconName,
  check: 'check' as IconName,
  checkAll: 'done-all' as IconName,
  edit: 'edit' as IconName,
  delete: 'delete' as IconName,
  search: 'search' as IconName,
  moreVert: 'more-vert' as IconName,
  calendar: 'calendar-today' as IconName,
  person: 'person' as IconName,
  account: 'account-circle' as IconName,
  attachMoney: 'attach-money' as IconName,
  list: 'list' as IconName,
  folder: 'folder' as IconName,
  print: 'print' as IconName,
  share: 'share' as IconName,
  restaurant: 'restaurant' as IconName,
  localGroceryStore: 'local-grocery-store' as IconName,
  category: 'category' as IconName,
  save: 'save' as IconName,
  pdfExport: 'picture-as-pdf' as IconName,
  accessTime: 'access-time' as IconName,
  help: 'help-outline' as IconName,
  trash: 'delete' as IconName,
  lockClosed: 'lock' as IconName,
} as const;

export type IconKey = keyof typeof ICONS;

interface IconSymbolProps {
  name: IconKey;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}

export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  return <MaterialIcons color={color} size={size} name={ICONS[name]} style={style} />;
}
