import { randomBytes } from 'node:crypto';

export const MAX_USERS = 10;

export type AvatarStyle = 'soft' | 'orb' | 'wave';

export type TimerPhase = 'focus' | 'break';

export interface TimerState {
  phase: TimerPhase;
  isRunning: boolean;
  /** When running, wall-clock time when current segment ends */
  endsAt: number | null;
  /** When paused, remaining ms in current phase */
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

export interface Room {
  id: string;
  hostUserId: string;
  isPrivate: boolean;
  users: Map<string, RoomUser>; // socketId -> user
  timer: TimerState;
  chat: ChatMessage[];
}

const rooms = new Map<string, Room>();

const DEFAULT_FOCUS_MS = 25 * 60 * 1000;
const DEFAULT_BREAK_MS = 5 * 60 * 1000;

function defaultTimer(): TimerState {
  return {
    phase: 'focus',
    isRunning: false,
    endsAt: null,
    pausedRemainingMs: DEFAULT_FOCUS_MS,
    focusDurationMs: DEFAULT_FOCUS_MS,
    breakDurationMs: DEFAULT_BREAK_MS,
  };
}

export function generateRoomId(): string {
  return randomBytes(4).toString('hex');
}

export function createRoom(hostUserId: string, isPrivate: boolean): Room {
  const id = generateRoomId();
  const room: Room = {
    id,
    hostUserId,
    isPrivate,
    users: new Map(),
    timer: defaultTimer(),
    chat: [],
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function deleteRoomIfEmpty(roomId: string): void {
  const r = rooms.get(roomId);
  if (r && r.users.size === 0) rooms.delete(roomId);
}

export function joinRoom(
  room: Room,
  socketId: string,
  user: Omit<RoomUser, 'socketId'>
): { ok: true } | { ok: false; reason: string } {
  if (room.users.size >= MAX_USERS) {
    return { ok: false, reason: 'Room is full' };
  }
  room.users.set(socketId, { ...user, socketId });
  return { ok: true };
}

export function leaveRoom(room: Room, socketId: string): void {
  room.users.delete(socketId);
}

export function getHostSocketId(room: Room): string | undefined {
  for (const u of room.users.values()) {
    if (u.userId === room.hostUserId) return u.socketId;
  }
  return undefined;
}

export function appendChat(room: Room, msg: Omit<ChatMessage, 'id'>): ChatMessage {
  const full: ChatMessage = {
    ...msg,
    id: randomBytes(8).toString('hex'),
  };
  room.chat.push(full);
  if (room.chat.length > 200) room.chat.splice(0, room.chat.length - 200);
  return full;
}
