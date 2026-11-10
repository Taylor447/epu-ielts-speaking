const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_NAME = 32;
const MAX_PROMPTS = 8;
const MAX_ANSWER = 1600;
const MAX_NOTE = 240;
const MAX_CHAT_MESSAGE = 500;
const MAX_SOCKET_MESSAGE = 2 * 1024 * 1024;
const MAX_COOP_AUDIO_BYTES = 550 * 1024;

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});

function makeCode() {
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return [...bytes].map(value => CODE_CHARS[value % CODE_CHARS.length]).join('');
}

function makeSecret(byteCount = 24) {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function cleanName(value) {
  return typeof value === 'string' ? value.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, MAX_NAME) : '';
}

function cleanChatMessage(value) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX_CHAT_MESSAGE) : '';
}

function cleanAudioDataUrl(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:audio\/[a-z0-9.+-]+;base64,([a-z0-9+/]+={0,2})$/i);
  if (!match) return null;
  const encoded = match[1];
  const bytes = Math.floor(encoded.length * 3 / 4) - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
  return bytes > 0 && bytes <= MAX_COOP_AUDIO_BYTES ? value : null;
}

function cleanCallSignal(value) {
  if (!value || typeof value !== 'object') return null;
  if (['offer', 'answer'].includes(value.kind) && value.description?.type === value.kind && typeof value.description.sdp === 'string' && value.description.sdp.length <= 16000) {
    return { kind: value.kind, description: { type: value.kind, sdp: value.description.sdp } };
  }
  if (value.kind === 'candidate' && value.candidate && typeof value.candidate.candidate === 'string' && value.candidate.candidate.length <= 2048) {
    return { kind: 'candidate', candidate: {
      candidate: value.candidate.candidate,
      sdpMid: typeof value.candidate.sdpMid === 'string' ? value.candidate.sdpMid.slice(0, 128) : null,
      sdpMLineIndex: Number.isInteger(value.candidate.sdpMLineIndex) ? value.candidate.sdpMLineIndex : null,
      usernameFragment: typeof value.candidate.usernameFragment === 'string' ? value.candidate.usernameFragment.slice(0, 128) : null
    } };
  }
  if (['hangup', 'reject'].includes(value.kind)) return { kind: value.kind };
  return null;
}

function cleanPrompts(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_PROMPTS) return null;
  const prompts = value.map(item => typeof item === 'string' ? item.trim().slice(0, 360) : '');
  return prompts.every(Boolean) ? prompts : null;
}

function publicState(state, onlineIds = new Set()) {
  return {
    code: state.code,
    part: state.part,
    topic: state.topic,
    prompts: state.prompts,
    phase: state.phase,
    turn: state.turn,
    currentAnswer: state.currentAnswer,
    answers: state.answers,
    chat: Array.isArray(state.chat) ? state.chat : [],
    createdAt: state.createdAt,
    expiresAt: state.expiresAt,
    players: state.players.map(player => ({ id: player.id, name: player.name, online: onlineIds.has(player.id) }))
  };
}

function sameOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return !origin || origin === env.ALLOWED_ORIGIN;
}

function withCors(request, response, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  headers.append('Vary', 'Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function callRoom(env, code, path, body = null) {
  const id = env.COOP_ROOMS.idFromName(code);
  const stub = env.COOP_ROOMS.get(id);
  return stub.fetch('https://coop.internal' + path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
}

export default {
  async fetch(request, env) {
    if (!sameOrigin(request, env)) return json({ error: 'Nguồn truy cập không được phép.' }, 403);
    if (request.method === 'OPTIONS') {
      return withCors(request, new Response(null, { status: 204 }), env);
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return withCors(request, json({ ok: true, service: 'epu-speaking-coop' }), env);
    }

    if (request.method === 'POST' && url.pathname === '/api/rooms') {
      let input;
      try { input = await request.json(); } catch { return withCors(request, json({ error: 'Dữ liệu phòng không hợp lệ.' }, 400), env); }
      const name = cleanName(input?.displayName);
      const prompts = cleanPrompts(input?.prompts);
      const part = Number(input?.part);
      const topic = typeof input?.topic === 'string' ? input.topic.trim().slice(0, 80) : '';
      if (!name || !prompts || ![1, 2, 3].includes(part) || !topic) {
        return withCors(request, json({ error: 'Hãy nhập tên, chủ đề và câu hỏi hợp lệ.' }, 400), env);
      }
      for (let attempt = 0; attempt < 4; attempt++) {
        const code = makeCode();
        const id = makeSecret(8);
        const token = makeSecret();
        const result = await callRoom(env, code, '/create', { code, part, topic, prompts, host: { id, token, name } });
        if (result.status === 409) continue;
        const payload = await result.json().catch(() => ({ error: 'Backend chưa tạo được phòng.' }));
        if (!result.ok) return withCors(request, json(payload, result.status), env);
        return withCors(request, json({ ...payload, playerId: id, playerToken: token, roomCode: code }), env);
      }
      return withCors(request, json({ error: 'Chưa tạo được mã phòng. Hãy thử lại.' }, 503), env);
    }

    const joinMatch = url.pathname.match(/^\/api\/rooms\/([A-HJ-NP-Z2-9]{7})\/join$/i);
    if (request.method === 'POST' && joinMatch) {
      let input;
      try { input = await request.json(); } catch { return withCors(request, json({ error: 'Dữ liệu tham gia không hợp lệ.' }, 400), env); }
      const name = cleanName(input?.displayName);
      if (!name) return withCors(request, json({ error: 'Hãy nhập tên hiển thị.' }, 400), env);
      const id = makeSecret(8);
      const token = makeSecret();
      const result = await callRoom(env, joinMatch[1].toUpperCase(), '/join', { id, token, name });
      return withCors(request, new Response(result.body, { status: result.status, headers: result.headers }), env);
    }

    const socketMatch = url.pathname.match(/^\/api\/rooms\/([A-HJ-NP-Z2-9]{7})\/socket$/i);
    if (request.method === 'GET' && socketMatch && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      // Forward the original request so Cloudflare preserves the WebSocket upgrade.
      const id = env.COOP_ROOMS.idFromName(socketMatch[1].toUpperCase());
      return env.COOP_ROOMS.get(id).fetch(request);
    }

    return withCors(request, json({ error: 'Không tìm thấy đường dẫn coop.' }, 404), env);
  }
};

export class CoopRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/create') return this.create(request);
    if (request.method === 'POST' && url.pathname === '/join') return this.join(request);
    if (request.method === 'GET' && (url.pathname === '/socket' || /^\/api\/rooms\/[A-HJ-NP-Z2-9]{7}\/socket$/i.test(url.pathname))) return this.connect(request);
    return json({ error: 'Không tìm thấy phòng.' }, 404);
  }

  async readState() {
    return this.ctx.storage.get('room');
  }

  async create(request) {
    const input = await request.json();
    if (await this.readState()) return json({ error: 'Mã phòng đã tồn tại.' }, 409);
    const now = Date.now();
    const state = {
      code: input.code,
      part: input.part,
      topic: input.topic,
      prompts: input.prompts,
      phase: 'waiting',
      turn: 0,
      currentAnswer: null,
      answers: [],
      chat: [],
      chatLastSentAt: {},
      players: [{ id: input.host.id, tokenHash: await digest(input.host.token), name: input.host.name }],
      createdAt: now,
      updatedAt: now,
      expiresAt: now + ROOM_TTL_MS
    };
    await this.ctx.storage.put('room', state);
    await this.ctx.storage.setAlarm(state.expiresAt);
    return json({ state: publicState(state) });
  }

  async join(request) {
    const input = await request.json();
    const state = await this.readState();
    if (!state || state.expiresAt <= Date.now()) return json({ error: 'Không tìm thấy phòng hoặc phòng đã hết hạn.' }, 404);
    if (state.players.some(player => player.id === input.id)) return json({ error: 'Bạn đã ở trong phòng.' }, 409);
    if (state.players.length >= 2) return json({ error: 'Phòng đã đủ hai người.' }, 409);
    state.players.push({ id: input.id, tokenHash: await digest(input.token), name: input.name });
    state.phase = 'answer';
    state.updatedAt = Date.now();
    await this.ctx.storage.put('room', state);
    await this.broadcast(state);
    return json({ state: publicState(state), playerId: input.id, playerToken: input.token, roomCode: state.code });
  }

  async connect(request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'Cần kết nối WebSocket.' }, 426);
    const url = new URL(request.url);
    const id = url.searchParams.get('playerId') || '';
    const token = url.searchParams.get('token') || '';
    const state = await this.readState();
    if (!state || state.expiresAt <= Date.now()) return json({ error: 'Phòng đã hết hạn.' }, 410);
    const player = state.players.find(item => item.id === id);
    if (!player || !token || player.tokenHash !== await digest(token)) return json({ error: 'Mã tham gia không hợp lệ.' }, 403);

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    for (const oldSocket of this.ctx.getWebSockets(id)) {
      try { oldSocket.close(4001, 'Reconnected from another tab'); } catch {}
    }
    this.ctx.acceptWebSocket(server, [id]);
    server.serializeAttachment({ playerId: id });
    await this.broadcast(state);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket, message) {
    const attachment = socket.deserializeAttachment();
    const playerId = attachment?.playerId;
    const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);
    if (raw.length > MAX_SOCKET_MESSAGE) {
      socket.send(JSON.stringify({ type: 'error', error: 'Tin nhắn vượt quá giới hạn.' }));
      return;
    }
    let input;
    try { input = JSON.parse(raw); }
    catch { socket.send(JSON.stringify({ type: 'error', error: 'Tin nhắn không hợp lệ.' })); return; }

    const state = await this.readState();
    if (!state || state.expiresAt <= Date.now()) {
      socket.send(JSON.stringify({ type: 'error', error: 'Phòng đã hết hạn.' }));
      return;
    }
    if (!state.players.some(player => player.id === playerId)) {
      socket.send(JSON.stringify({ type: 'error', error: 'Bạn không còn trong phòng.' }));
      return;
    }

    let outgoingAudio = null;
    if (input?.type === 'signal') {
      const targetId = typeof input.targetPlayerId === 'string' ? input.targetPlayerId : '';
      const signal = cleanCallSignal(input.signal);
      if (!targetId || targetId === playerId || !state.players.some(player => player.id === targetId) || !signal) {
        socket.send(JSON.stringify({ type: 'error', error: 'Tín hiệu cuộc gọi không hợp lệ.' }));
        return;
      }
      const payload = JSON.stringify({ type: 'signal', from: playerId, signal });
      let delivered = false;
      for (const peerSocket of this.ctx.getWebSockets(targetId)) {
        try { peerSocket.send(payload); delivered = true; } catch {}
      }
      if (!delivered) socket.send(JSON.stringify({ type: 'error', error: 'Bạn học chưa kết nối. Hãy đợi bạn ấy vào phòng rồi thử gọi lại.' }));
      return;
    } else if (input?.type === 'chat') {
      const text = cleanChatMessage(input.text);
      const now = Date.now();
      state.chat ||= [];
      state.chatLastSentAt ||= {};
      if (!text) {
        socket.send(JSON.stringify({ type: 'error', error: 'Hãy nhập tin nhắn trước khi gửi.' }));
        return;
      }
      if (now - Number(state.chatLastSentAt[playerId] || 0) < 600) {
        socket.send(JSON.stringify({ type: 'error', error: 'Bạn gửi hơi nhanh. Hãy chờ một chút rồi gửi tiếp.' }));
        return;
      }
      state.chatLastSentAt[playerId] = now;
      state.chat.push({ playerId, text, sentAt: now });
      if (state.chat.length > 50) state.chat.splice(0, state.chat.length - 50);
      state.updatedAt = now;
      await this.ctx.storage.put('room', state);
      await this.broadcast(state);
      return;
    } else if (input?.type === 'answer') {
      const active = state.players[state.turn % 2];
      const answer = typeof input.answer === 'string' ? input.answer.trim().slice(0, MAX_ANSWER) : '';
      if (input.audio != null) {
        outgoingAudio = cleanAudioDataUrl(input.audio);
        if (!outgoingAudio) {
          socket.send(JSON.stringify({ type: 'error', error: 'Bản ghi không hợp lệ hoặc quá lớn. Hãy thu ngắn hơn rồi gửi lại.' }));
          return;
        }
      }
      if (state.phase !== 'answer' || active?.id !== playerId || answer.length < 10) {
        socket.send(JSON.stringify({ type: 'error', error: 'Chưa đến lượt bạn hoặc câu trả lời quá ngắn.' }));
        return;
      }
      state.currentAnswer = { playerId, text: answer, question: state.prompts[state.turn], submittedAt: Date.now() };
      state.phase = 'review';
    } else if (input?.type === 'review') {
      const reviewer = state.players[(state.turn + 1) % 2];
      const current = state.currentAnswer;
      const checks = input.checks && typeof input.checks === 'object' ? input.checks : {};
      if (state.phase !== 'review' || reviewer?.id !== playerId || !current || ![current.playerId, reviewer.id].includes(playerId)) {
        socket.send(JSON.stringify({ type: 'error', error: 'Bạn chưa thể gửi góp ý cho lượt này.' }));
        return;
      }
      current.review = {
        by: reviewer.id,
        onTopic: checks.onTopic === true,
        reasonExample: checks.reasonExample === true,
        clear: checks.clear === true,
        note: typeof input.note === 'string' ? input.note.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, MAX_NOTE) : '',
        submittedAt: Date.now()
      };
      state.answers.push(current);
      state.currentAnswer = null;
      state.turn++;
      state.phase = state.turn >= state.prompts.length ? 'complete' : 'answer';
    } else {
      socket.send(JSON.stringify({ type: 'error', error: 'Thao tác không được hỗ trợ.' }));
      return;
    }

    state.updatedAt = Date.now();
    await this.ctx.storage.put('room', state);
    await this.broadcast(state);
    if (outgoingAudio) await this.broadcastAudio(state.turn, playerId, outgoingAudio);
  }

  async onlineIds() {
    return new Set(this.ctx.getWebSockets().map(socket => socket.deserializeAttachment()?.playerId).filter(Boolean));
  }

  async broadcast(state) {
    const payload = JSON.stringify({ type: 'state', state: publicState(state, await this.onlineIds()) });
    for (const socket of this.ctx.getWebSockets()) {
      try { socket.send(payload); } catch {}
    }
  }

  async broadcastAudio(turn, senderId, audio) {
    const payload = JSON.stringify({ type: 'audio', turn, audio });
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.deserializeAttachment()?.playerId === senderId) continue;
      try { socket.send(payload); } catch {}
    }
  }

  async webSocketClose() {
    const state = await this.readState();
    if (state) await this.broadcast(state);
  }

  async webSocketError() {
    const state = await this.readState();
    if (state) await this.broadcast(state);
  }

  async alarm() {
    for (const socket of this.ctx.getWebSockets()) {
      try { socket.send(JSON.stringify({ type: 'expired', message: 'Phòng coop đã hết hạn.' })); socket.close(1000, 'Room expired'); } catch {}
    }
    await this.ctx.storage.deleteAll();
  }
}
