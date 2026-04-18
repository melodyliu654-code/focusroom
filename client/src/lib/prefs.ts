const NAME_KEY = 'focusroom_display_name';
const AVATAR_KEY = 'focusroom_avatar';

export type AvatarStyle = 'soft' | 'orb' | 'wave';

export function getDisplayName(): string {
  return localStorage.getItem(NAME_KEY)?.trim() || 'Student';
}

export function setDisplayName(name: string) {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 40) || 'Student');
}

export function getAvatarStyle(): AvatarStyle {
  const v = localStorage.getItem(AVATAR_KEY);
  if (v === 'orb' || v === 'wave' || v === 'soft') return v;
  return 'soft';
}

export function setAvatarStyle(style: AvatarStyle) {
  localStorage.setItem(AVATAR_KEY, style);
}
