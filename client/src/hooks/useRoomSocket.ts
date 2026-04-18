import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarStyle, getDisplayName } from '../lib/prefs';
import type { ChatMessage, RoomUser, TimerState } from '../types/room';

export function useRoomSocket(roomId: string | undefined) {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomId || !session?.access_token) return;

    const apiBase = import.meta.env.VITE_API_URL || undefined;
    const socket = io(apiBase, {
      path: '/socket.io',
      auth: { token: session.access_token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    setJoinError(null);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (e) => setJoinError(e.message));
    socket.on('presence:update', (p: { users: RoomUser[] }) => setUsers(p.users));
    socket.on('chat:history', (h: ChatMessage[]) => setMessages(h));
    socket.on('chat:message', (m: ChatMessage) => setMessages((prev) => [...prev, m]));
    socket.on('timer:state', (t: TimerState) => setTimer(t));
    socket.on('room:host', (h: { hostUserId: string }) => setHostUserId(h.hostUserId));

    socket.emit(
      'room:join',
      {
        roomId,
        displayName: getDisplayName(),
        avatarStyle: getAvatarStyle(),
      },
      (err: string | null) => {
        if (err) setJoinError(err);
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [roomId, session?.access_token]);

  const sendChat = useCallback((text: string) => {
    const s = socketRef.current;
    if (!s || !roomId) return;
    s.emit('chat:send', { roomId, text });
  }, [roomId]);

  const timerCommand = useCallback(
    (action: 'start' | 'pause' | 'reset' | 'skip') => {
      const s = socketRef.current;
      if (!s || !roomId) return;
      s.emit('timer:command', { roomId, action });
    },
    [roomId]
  );

  return {
    connected,
    joinError,
    users,
    messages,
    timer,
    hostUserId,
    sendChat,
    timerCommand,
  };
}
