export type AvatarStyle = 'soft' | 'orb' | 'wave';

export type TimerPhase = 'focus' | 'break';

export interface TimerState {
  phase: TimerPhase;
  isRunning: boolean;
  endsAt: number | null;
  pausedRemainingMs: number;
  focusDurationMs: number;
  breakDurationMs: number;
}

export interface RoomUser {
  socketId: string;
  userId: string;
  displayName: string;
  avatarStyle: AvatarStyle;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  at: number;
}
