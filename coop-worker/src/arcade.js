export const GAME_IDS = ['letter-link', 'word-lock', 'story-relay'];
export const GAME_TEXT_LIMIT = 280;
export const REJOIN_GRACE = 20_000;
const HINT_INTERVAL = 10_000;
const TIMES = { 'letter-link': 12_000, 'word-lock': 30_000, 'story-relay': 35_000 };

// Seed choices come from the same topic lexicon as the app.
const SEEDS = {
  Hometown: 'street road bridge station passenger transport railway tunnel landmark ticket',
  'Study & Work': 'student theory university research homework knowledge exam major degree evidence',
  Technology: 'software technology hardware robot network data application information security accuracy',
  Food: 'food dish delivery taste texture recipe ingredient restaurant preparation aroma',
  Travel: 'travel luggage exploration direction tourism museum map photography heritage itinerary',
  Environment: 'energy environment transition emission efficiency oil demand resource carbon conservation',
  Electricity: 'electricity equipment transformer resistance resistor output input measurement switch frequency',
  'Campus Life': 'dormitory desk kitchen neighbour roommate expense meal laundry grocery facility',
  'Future Careers': 'career responsibility training goal leadership position profession employer interview task',
  Family: 'family daughter relative child friendship relationship parent trust tradition household',
  Hobbies: 'novel language exhibition reading guitar music cinema artist story instrument',
  Sports: 'sport strength balance nutrition treatment exercise recovery fitness stress support',
  Weather: 'weather rain nature ecosystem mountain temperature tree environment river season'
};
const RIDDLES = [
  ['landmark', 'A feature that helps people recognise a place.', 'a historic ____', 'We met beside the most famous ____ in the city.', 'famous', 'building'],
  ['deadline', 'The latest time allowed to complete a task.', 'meet a ____', 'Our project ____ is Friday afternoon.', 'date', 'finish'],
  ['password', 'A private string that lets you sign in to an account.', 'reset a ____', 'I forgot my ____ and could not sign in.', 'account', 'secret'],
  ['recipe', 'Instructions for preparing a dish.', 'follow a ____', 'I followed my grandmother’s ____ for soup.', 'cook', 'ingredients'],
  ['souvenir', 'An object you keep as a reminder of a visit.', 'buy a ____', 'We brought home a small ____ from our holiday.', 'trip', 'gift'],
  ['turbine', 'A machine that turns when moving air, water or steam passes through it.', 'a wind ____', 'A large ____ helps generate electricity.', 'wind', 'blades'],
  ['battery', 'A device that stores energy and supplies electricity.', 'a rechargeable ____', 'My laptop shuts down when the ____ runs out.', 'charge', 'power'],
  ['roommate', 'A person who shares your room or living space.', 'live with a ____', 'My ____ and I take turns cleaning the flat.', 'room', 'share'],
  ['concert', 'An event where musicians perform for an audience.', 'attend a ____', 'We went to an outdoor ____ last Saturday.', 'music', 'live']
];
const STORY_OPENINGS = [
  'On the way to class, Maya found a small key beside an empty bicycle rack.',
  'Just before sunset, Linh noticed a light flashing from an empty classroom.',
  'Alex opened a library book and a tiny map fell out.'
];
const STORY_RULES = [
  ['Dùng từ “message”', 'She found a message under the bench.', /\bmessage\b/i],
  ['Dùng từ nối “because”', 'She called a friend because the message looked unusual.', /\b[a-z]+ [a-z]+.*\bbecause\b.*\b[a-z]+ [a-z]+\b/i],
  ['Dùng một động từ ở quá khứ đơn', 'They walked back to the school together.', /\b[a-z]+\s+(?:(?:then|finally|suddenly)\s+)?(?:was|were|did|had|went|saw|took|found|said|came|ran|made|left|got|read|wrote|felt|thought|stood|put|heard|spoke|bought|lost|told|kept|[a-z]{2,}ed)\b/i],
  ['Dùng “will” + động từ', 'We will ask the teacher for help.', /\bwill\s+(?:not\s+)?(?!(?:the|a|an|will|not)\b)[a-z]+\b/i],
  ['Dùng từ “window”', 'A light appeared in the window upstairs.', /\bwindow\b/i],
  ['Dùng từ nối “so” để nêu kết quả', 'The door was locked, so they walked around the building.', /\b[a-z]+ [a-z]+.*\bso\b.*\b[a-z]+ [a-z]+\b/i]
];

const pick = rows => rows[Math.floor(Math.random() * rows.length)];
const words = text => text.toLowerCase().match(/[a-z]+(?:['’][a-z]+)*/g) || [];
const sentence = text => words(text).length >= 5 && new Set(words(text)).size >= 4 &&
  /\b[a-z]+\s+(?:(?:often|usually|always|quickly|finally)\s+)?(?:am|is|are|was|were|have|has|had|do|does|did|can|could|will|would|went|found|saw|made|came|took|got|said|ran|left|put|read|wrote|felt|heard|thought|use[sd]?|go(?:es)?|like[sd]?|finds?|live[sd]?|want[sd]?|need[sd]?|work[sd]?|play[sd]?|keeps?|takes?|brings?|sees?|says?|reads?|walks?|[a-z]{2,}ed)\b/i.test(text);
const profanity = /(?<![\p{L}\p{N}])(?:fuck(?:ing|er|s|ed)?|shit(?:ty|head)?|bitch(?:es)?|cunt(?:s)?|địt|đụ|đéo|đm|đcm|lồn|buồi|cặc)(?![\p{L}\p{N}])/giu;
export const filterRoomText = text => text.normalize('NFC').replace(profanity, '•••');
const stripControls = text => text.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ' ').trim();
const wordForms = word => [word, word + 's', word + 'es', word + 'ed', word + 'ing',
  word.replace(/e$/, '') + 'ing', word.replace(/y$/, 'i') + 'es', word.endsWith('e') ? word + 'd' : word];
const wordPattern = word => new RegExp('\\b(?:' + wordForms(word).join('|') + ')\\b', 'gi');

export function validGameTopic(topic) {
  return typeof topic === 'string' && topic.trim().length > 0 && topic.trim().length <= 32 &&
    !/[<>\u0000-\u001f\u007f]/.test(topic) && !/(?:https?:\/\/|www\.)/i.test(topic);
}

function seedChain(payload) {
  if (!Object.hasOwn(SEEDS, payload.topic)) {
    payload.last = '';
    return;
  }
  const available = (SEEDS[payload.topic] || DEFAULT_SEEDS).split(' ').filter(word => !payload.used.includes(word));
  const word = pick(available.filter(word => available.some(next => next !== word && next[0] === word.at(-1)))) || '';
  if (word) payload.used.push(word);
  payload.last = word;
}

function deadline(game, now) {
  game.deadline = now + (game.timeLimitMs || TIMES[game.id]);
  game.payload.startedAt = now;
  game.payload.pause = null;
  game.payload.pauseUsed = false;
  game.payload.step++;
}

export function makeGame(id, topic, runId, players, now, seconds) {
  const order = players.map(player => player.id);
  const payload = {
    runId, order, names: Object.fromEntries(players.map(player => [player.id, player.name])),
    rounds: id === 'word-lock' ? order.length : order.length * 2,
    stage: id === 'word-lock' ? 'describe' : 'answer',
    step: 0, startedAt: now, pause: null, pauseUsed: false, lastResult: null, contributors: []
  };
  const validSeconds = Number.isInteger(seconds) && seconds >= 5 && seconds <= 60 ? seconds : TIMES[id] / 1000;
  const game = { id, round: 1, scores: Object.fromEntries(order.map(playerId => [playerId, 0])), turn: order[0], deadline: null, timeLimitMs: validSeconds * 1000, payload };
  if (id === 'letter-link') {
    Object.assign(payload, { topic, last: '', used: [] });
    seedChain(payload);
  } else if (id === 'word-lock') {
    const pool = RIDDLES.slice();
    payload.deck = order.map(() => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    Object.assign(payload, { hints: 0, description: '', author: null, penalty: 0 });
  } else {
    Object.assign(payload, { opening: pick(STORY_OPENINGS), offset: Math.floor(Math.random() * STORY_RULES.length), lines: [] });
  }
  deadline(game, now);
  return game;
}

function storyRule(game) {
  return STORY_RULES[(game.payload.offset + game.round - 1) % STORY_RULES.length];
}

function clueCount(game, now) {
  const time = game.payload.pause?.at ?? now;
  return Math.min(3, Math.max(game.payload.hints, 1 + Math.floor((time - game.payload.startedAt) / HINT_INTERVAL)));
}

export function visibleGame(game, viewer, now) {
  if (!game) return null;
  const p = game.payload;
  const payload = {
    runId: p.runId, names: p.names, rounds: p.rounds, stage: p.stage, step: p.step,
    lastResult: p.lastResult, pausedUntil: p.pause?.until ?? null,
    remaining: p.pause?.remaining ?? null, completed: p.completed === true, finishedAt: p.finishedAt ?? null,
    earned: p.contributors?.includes(viewer) === true
  };
  if (game.id === 'letter-link') {
    Object.assign(payload, { topic: p.topic, last: p.last, used: p.used });
  } else if (game.id === 'word-lock' && p.stage !== 'done') {
    const [word, definition, collocation, example, ...blocked] = p.deck[game.round - 1];
    if (p.stage === 'describe' && game.turn === viewer) Object.assign(payload, { word, blocked: [word, ...blocked] });
    if (p.stage === 'guess') {
      const count = clueCount(game, now);
      Object.assign(payload, { clues: [definition, collocation, example].slice(0, count), description: p.description,
        author: p.author, penalty: p.penalty, nextHintAt: count < 3 && !p.pause ? p.startedAt + (count === 1 ? 1 : 2) * HINT_INTERVAL : null });
    }
  } else if (game.id === 'story-relay') {
    const [label, example] = storyRule(game);
    Object.assign(payload, { opening: p.opening, lines: p.lines, label, example });
  }
  return { id: game.id, round: game.round, scores: game.scores, turn: game.turn, deadline: game.deadline, payload };
}

function finish(game, completed, now) {
  game.payload.stage = 'done';
  game.payload.completed = completed;
  game.payload.finishedAt = now;
  game.payload.pause = null;
  game.turn = null;
  game.deadline = null;
}

function nextRound(game, now, playerId, points, text) {
  const p = game.payload;
  game.scores[playerId] = (game.scores[playerId] || 0) + points;
  p.lastResult = { playerId, points, text };
  if (game.round >= p.rounds || p.order.length < 2) {
    finish(game, game.round >= p.rounds, now);
    return;
  }
  game.round++;
  game.turn = p.order[(p.order.indexOf(p.roundLeader ?? playerId) + 1) % p.order.length];
  if (game.id === 'word-lock') {
    Object.assign(p, { stage: 'describe', hints: 0, description: '', author: null, penalty: 0, roundLeader: null });
  }
  deadline(game, now);
}

function handoff(game, now, description, penalty) {
  const p = game.payload, speaker = game.turn;
  Object.assign(p, { stage: 'guess', description, author: speaker, penalty, hints: 1, roundLeader: speaker });
  game.turn = p.order[(p.order.indexOf(speaker) + 1) % p.order.length];
  deadline(game, now);
}

export function skipGameTurn(game, now) {
  if (!game.turn || game.payload.stage === 'done') return;
  if (game.id === 'word-lock' && game.payload.stage === 'describe') {
    handoff(game, now, '', 0);
    return;
  }
  const answer = game.id === 'word-lock' ? game.payload.deck[game.round - 1][0] : '';
  if (game.id === 'letter-link' && game.round < game.payload.rounds) seedChain(game.payload);
  nextRound(game, now, game.turn, 0, answer ? 'Đáp án: ' + answer : 'Đã bỏ qua lượt.');
}

export function applyGameAction(game, playerId, action, input, now) {
  const p = game.payload;
  if (p.stage === 'done' || input?.runId !== p.runId || input?.step !== p.step) return 'Lượt này đã thay đổi. Hãy xem đề mới.';
  if (p.pause || !game.deadline || now >= game.deadline) return 'Lượt đang tạm dừng hoặc đã hết thời gian.';
  if (game.turn !== playerId) return 'Chưa đến lượt bạn.';
  if (action === 'hint' && game.id === 'word-lock' && p.stage === 'guess') {
    if (clueCount(game, now) === 3) return 'Đã mở hết manh mối.';
    p.hints = clueCount(game, now) + 1;
    return '';
  }
  if (action === 'skip') {
    skipGameTurn(game, now);
    return '';
  }
  if (action !== 'submit') return 'Thao tác trò chơi không được hỗ trợ.';
  if (typeof input.text !== 'string' || input.text.length > GAME_TEXT_LIMIT) return 'Câu trả lời tối đa 280 ký tự.';
  const text = stripControls(input.text);
  if (!text) return 'Hãy nhập câu trả lời trước.';
  if (filterRoomText(text) !== text.normalize('NFC')) return 'Câu trả lời có từ không phù hợp. Hãy sửa lại.';
  const markContribution = () => {
    p.contributors ||= [];
    if (!p.contributors.includes(playerId)) p.contributors.push(playerId);
  };

  if (game.id === 'letter-link') {
    const match = text.match(/^([a-z]{3,24})(?=$|[\s.!?:,;–—])[\s.!?:,;–—]*(.*)$/is);
    if (!match) return 'Hãy nhập một từ tiếng Anh dài 3–24 chữ cái.';
    const word = match[1].toLowerCase();
    if (p.last && word[0] !== p.last.at(-1)) return 'Từ phải bắt đầu bằng chữ cái cuối của từ trước.';
    if (p.used.includes(word)) return 'Từ này đã được dùng.';
    const bonus = words(match[2]).includes(word) && sentence(match[2]);
    p.used.push(word);
    p.last = word;
    markContribution();
    nextRound(game, now, playerId, bonus ? 12 : 10, text);
  } else if (game.id === 'word-lock') {
    const [word, , , , ...blocked] = p.deck[game.round - 1];
    if (p.stage === 'describe') {
      if (words(text).length < 4) return 'Hãy mô tả bằng ít nhất 4 từ tiếng Anh.';
      let description = text, penalty = 0;
      for (const term of [word, ...blocked]) {
        const pattern = wordPattern(term);
        if (pattern.test(description)) {
          penalty += 2;
          description = description.replace(pattern, '____');
        }
      }
      markContribution();
      handoff(game, now, description, penalty);
    } else {
      if (text.toLowerCase().replace(/[.!?]+$/, '') !== word) return 'Chưa đúng. Bạn có thể thử lại hoặc mở thêm manh mối.';
      const speed = Math.floor(4 * (game.deadline - now) / (game.timeLimitMs || TIMES[game.id]));
      markContribution();
      nextRound(game, now, playerId, Math.max(0, 12 - (clueCount(game, now) - 1) * 3 + speed - p.penalty), word);
    }
  } else {
    const [label, , check] = storyRule(game), line = text.replace(/[.!?]+$/, '').trim();
    if (/[.!?]/.test(line) || !sentence(line)) return 'Hãy gửi một câu tiếng Anh có động từ và ít nhất 5 từ.';
    if (!check.test(line)) return 'Câu chưa đạt luật. ' + label + '.';
    const key = words(line).join(' ');
    if ([p.opening, ...p.lines.map(row => row.text)].some(value => words(value).join(' ') === key)) return 'Câu này đã xuất hiện trong truyện.';
    const points = new Set(words(line)).size >= 9 ? 12 : 10;
    markContribution();
    p.lines.push({ playerId, text: line + (/[!?]$/.test(text) ? text.at(-1) : '.'), points });
    nextRound(game, now, playerId, points, '');
  }
  return '';
}

export function removeGamePlayer(game, playerId, now) {
  if (!game || game.payload.stage === 'done') return;
  const p = game.payload;
  const successor = p.order[(p.order.indexOf(playerId) + 1) % p.order.length];
  p.order = p.order.filter(id => id !== playerId);
  if (p.order.length < 2) { finish(game, false, now); return; }
  if (game.turn === playerId) {
    skipGameTurn(game, now);
    if (game.turn && p.order.includes(successor)) game.turn = successor;
  }
}

export function updateGameClock(game, online, now) {
  if (!game?.turn) return false;
  const p = game.payload;
  if (p.pause) {
    if (now >= p.pause.until) { skipGameTurn(game, now); return true; }
    if (!online.has(game.turn)) return false;
    const duration = now - p.pause.at;
    game.deadline = now + p.pause.remaining;
    p.startedAt += duration;
    p.pause = null;
    return true;
  }
  if (game.deadline <= now) { skipGameTurn(game, now); return true; }
  if (!p.pauseUsed && !online.has(game.turn)) {
    p.pause = { at: now, until: now + REJOIN_GRACE, remaining: game.deadline - now };
    p.pauseUsed = true;
    game.deadline = null;
    return true;
  }
  if (game.id === 'word-lock' && p.stage === 'guess' && clueCount(game, now) > p.hints) {
    p.hints = clueCount(game, now);
    return true;
  }
  return false;
}

export function gameAlarmTime(game) {
  if (!game?.turn) return Infinity;
  const p = game.payload;
  if (p.pause) return p.pause.until;
  const hint = game.id === 'word-lock' && p.stage === 'guess' && p.hints < 3
    ? p.startedAt + p.hints * HINT_INTERVAL : Infinity;
  return Math.min(game.deadline, hint);
}
