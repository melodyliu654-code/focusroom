import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import Stripe from 'stripe';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { getUserIdFromAuthHeader, verifySocketToken } from './auth.ts';
import {
  appendChat,
  createRoom,
  deleteRoomIfEmpty,
  getRoom,
  joinRoom,
  leaveRoom,
  type AvatarStyle,
  type Room,
} from './rooms.ts';

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || '';

/** Checkout uses the secret key; webhooks use STRIPE_WEBHOOK_SECRET (keep both server-only). */
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

function adminSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchIsPro(userId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;
  const sb = adminSupabase();
  const { data, error } = await sb.from('profiles').select('is_pro').eq('id', userId).maybeSingle();
  if (error) return false;
  return data?.is_pro === true;
}

async function getOrCreateStripeCustomer(userId: string, email: string | undefined): Promise<string | null> {
  if (!stripe || !SUPABASE_URL) return null;
  const sb = adminSupabase();
  const { data: profile } = await sb.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { supabase_user_id: userId },
  });

  await sb.from('profiles').upsert(
    { id: userId, stripe_customer_id: customer.id, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
  return customer.id;
}

const app = express();
const httpServer = createServer(app);

/** Allow both localhost and 127.0.0.1 — opening Vite via either should work when using a direct API URL. */
const BROWSER_ORIGINS = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: BROWSER_ORIGINS,
    credentials: true,
  })
);

// Stripe webhook must receive raw body for signature verification
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    res.status(503).send('Stripe not configured');
    return;
  }
  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing signature');
    return;
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(503).json({ error: 'Supabase not configured' });
    return;
  }

  const sb = adminSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (userId && session.mode === 'subscription') {
          await sb.from('profiles').upsert(
            { id: userId, is_pro: true, updated_at: new Date().toISOString() },
            { onConflict: 'id' }
          );
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) break;
        const active = sub.status === 'active' || sub.status === 'trialing';
        const { data: rows } = await sb.from('profiles').select('id').eq('stripe_customer_id', customerId).limit(1);
        const uid = rows?.[0]?.id;
        if (uid) {
          await sb.from('profiles').update({ is_pro: active, updated_at: new Date().toISOString() }).eq('id', uid);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Webhook handler error', e);
    res.status(500).json({ received: true, error: 'handler_failed' });
    return;
  }

  res.json({ received: true });
});

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

/** Current user flags (Pro status from Supabase `profiles`, updated by Stripe webhooks). */
app.get('/api/me', async (req, res) => {
  const userId = await requireUser(req, res);
  if (!userId) return;
  const isPro = await fetchIsPro(userId);
  res.json({ isPro });
});

async function requireUser(req: express.Request, res: express.Response): Promise<string | null> {
  if (!SUPABASE_URL?.trim() || !SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    res.status(503).json({
      error:
        'API missing Supabase credentials. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env and restart the server.',
    });
    return null;
  }
  const uid = await getUserIdFromAuthHeader(req.headers.authorization, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!uid) {
    res.status(401).json({
      error:
        'Unauthorized. Use the same Supabase project in client/.env and server/.env, or sign in again.',
    });
    return null;
  }
  return uid;
}

/** Create a new study room (host = caller). */
app.post('/api/rooms', async (req, res) => {
  const userId = await requireUser(req, res);
  if (!userId) return;

  const isPrivate = Boolean(req.body?.isPrivate);
  if (isPrivate) {
    const pro = await fetchIsPro(userId);
    if (!pro) {
      res.status(403).json({ error: 'Pro required for private rooms' });
      return;
    }
  }

  const room = createRoom(userId, isPrivate);
  res.json({ roomId: room.id, isPrivate: room.isPrivate });
});

/** Lightweight room lookup before joining. */
app.get('/api/rooms/:roomId', async (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({
    exists: true,
    isPrivate: room.isPrivate,
    userCount: room.users.size,
    full: room.users.size >= 10,
  });
});

/** Stripe Checkout for Pro subscription (secret key stays on server). */
app.post('/api/billing/checkout-session', async (req, res) => {
  const userId = await requireUser(req, res);
  if (!userId) return;
  if (!stripe || !STRIPE_PRICE_PRO) {
    res.status(503).json({ error: 'Billing not configured' });
    return;
  }

  const sb = adminSupabase();
  const { data: userData, error: userErr } = await sb.auth.admin.getUserById(userId);
  if (userErr) {
    res.status(500).json({ error: 'Could not load user' });
    return;
  }
  const email = userData.user?.email;

  const customerId = await getOrCreateStripeCustomer(userId, email);
  if (!customerId) {
    res.status(500).json({ error: 'Could not create customer' });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: STRIPE_PRICE_PRO, quantity: 1 }],
    success_url: `${CLIENT_URL}/billing?success=1`,
    cancel_url: `${CLIENT_URL}/billing?canceled=1`,
    metadata: { supabase_user_id: userId },
    subscription_data: {
      metadata: { supabase_user_id: userId },
    },
  });

  if (!session.url) {
    res.status(500).json({ error: 'No session URL' });
    return;
  }
  res.json({ url: session.url });
});

const io = new Server(httpServer, {
  cors: { origin: BROWSER_ORIGINS, credentials: true },
});

function broadcastTimer(roomId: string, room: Room) {
  io.to(roomId).emit('timer:state', room.timer);
}

function reassignHostIfNeeded(room: Room, leftUserId: string) {
  if (room.hostUserId !== leftUserId) return;
  const first = room.users.values().next();
  if (!first.done) {
    room.hostUserId = first.value.userId;
    io.to(room.id).emit('room:host', { hostUserId: room.hostUserId });
  }
}

function applyTimerStart(room: Room) {
  const t = room.timer;
  if (t.isRunning) return;
  const now = Date.now();
  t.endsAt = now + t.pausedRemainingMs;
  t.isRunning = true;
}

function applyTimerPause(room: Room) {
  const t = room.timer;
  if (!t.isRunning) return;
  if (t.endsAt) {
    t.pausedRemainingMs = Math.max(0, t.endsAt - Date.now());
  }
  t.endsAt = null;
  t.isRunning = false;
}

function applyTimerReset(room: Room) {
  room.timer = {
    phase: 'focus',
    isRunning: false,
    endsAt: null,
    pausedRemainingMs: room.timer.focusDurationMs,
    focusDurationMs: room.timer.focusDurationMs,
    breakDurationMs: room.timer.breakDurationMs,
  };
}

function applyTimerSkip(room: Room) {
  const t = room.timer;
  applyTimerPause(room);
  if (t.phase === 'focus') {
    t.phase = 'break';
    t.pausedRemainingMs = t.breakDurationMs;
  } else {
    t.phase = 'focus';
    t.pausedRemainingMs = t.focusDurationMs;
  }
}

/** One interval per room; clears itself when the room is removed. */
const roomIntervals = new Map<string, ReturnType<typeof setInterval>>();

function ensureRoomTimerLoop(roomId: string) {
  if (roomIntervals.has(roomId)) return;
  const id = setInterval(() => {
    const room = getRoom(roomId);
    if (!room) {
      clearInterval(id);
      roomIntervals.delete(roomId);
      return;
    }
    const t = room.timer;
    if (t.isRunning && t.endsAt && Date.now() >= t.endsAt) {
      applyTimerPause(room);
      if (t.phase === 'focus') {
        t.phase = 'break';
        t.pausedRemainingMs = t.breakDurationMs;
      } else {
        t.phase = 'focus';
        t.pausedRemainingMs = t.focusDurationMs;
      }
      broadcastTimer(roomId, room);
    }
  }, 500);
  roomIntervals.set(roomId, id);
}

io.use(async (socket, next) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    next(new Error('Server auth not configured'));
    return;
  }
  const token = socket.handshake.auth?.token as string | undefined;
  const user = await verifySocketToken(token, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  if (!user) {
    next(new Error('Unauthorized'));
    return;
  }
  socket.data.userId = user.id;
  socket.data.email = user.email;
  next();
});

io.on('connection', (socket) => {
  const userId = socket.data.userId as string;

  socket.on(
    'room:join',
    (
      payload: {
        roomId: string;
        displayName: string;
        avatarStyle: AvatarStyle;
      },
      ack?: (err: string | null) => void
    ) => {
      const { roomId, displayName, avatarStyle } = payload || ({} as typeof payload);
      if (!roomId || !displayName) {
        ack?.('Invalid payload');
        return;
      }

      const room = getRoom(roomId);
      if (!room) {
        ack?.('Room not found');
        return;
      }

      const result = joinRoom(room, socket.id, {
        userId,
        displayName: String(displayName).slice(0, 40),
        avatarStyle: (['soft', 'orb', 'wave'] as const).includes(avatarStyle) ? avatarStyle : 'soft',
      });
      if (!result.ok) {
        ack?.(result.reason);
        return;
      }

      socket.join(roomId);
      ensureRoomTimerLoop(roomId);

      socket.data.roomId = roomId;

      io.to(roomId).emit('presence:update', {
        users: Array.from(room.users.values()),
      });
      socket.emit('chat:history', room.chat.slice(-50));
      socket.emit('timer:state', room.timer);
      socket.emit('room:host', { hostUserId: room.hostUserId });

      ack?.(null);
    }
  );

  socket.on(
    'chat:send',
    (payload: { roomId: string; text: string }) => {
      const roomId = payload?.roomId || socket.data.roomId;
      const text = String(payload?.text || '').trim().slice(0, 500);
      if (!roomId || !text) return;

      const room = getRoom(roomId);
      if (!room || !room.users.has(socket.id)) return;

      const u = room.users.get(socket.id)!;
      const msg = appendChat(room, {
        userId: u.userId,
        displayName: u.displayName,
        text,
        at: Date.now(),
      });
      io.to(roomId).emit('chat:message', msg);
    }
  );

  socket.on(
    'timer:command',
    (payload: { roomId: string; action: 'start' | 'pause' | 'reset' | 'skip' }) => {
      const roomId = payload?.roomId || socket.data.roomId;
      const action = payload?.action;
      if (!roomId || !action) return;

      const room = getRoom(roomId);
      if (!room || !room.users.has(socket.id)) return;
      if (room.hostUserId !== userId) return;

      switch (action) {
        case 'start':
          applyTimerStart(room);
          break;
        case 'pause':
          applyTimerPause(room);
          break;
        case 'reset':
          applyTimerReset(room);
          break;
        case 'skip':
          applyTimerSkip(room);
          break;
        default:
          return;
      }
      broadcastTimer(roomId, room);
    }
  );

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId as string | undefined;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room) return;
    const u = room.users.get(socket.id);
    leaveRoom(room, socket.id);
    if (u) reassignHostIfNeeded(room, u.userId);
    io.to(roomId).emit('presence:update', { users: Array.from(room.users.values()) });
    deleteRoomIfEmpty(roomId);
  });
});

if (!SUPABASE_URL?.trim() || !SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  console.warn(
    '[focusroom] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — protected API routes and Socket.io auth will fail. Copy server/.env.example to server/.env.'
  );
}

httpServer.listen(PORT, () => {
  console.log(`FocusRoom API + Socket.io on http://localhost:${PORT}`);
});
