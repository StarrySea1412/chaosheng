import {
  WORLD, SCENE_IDS, DISCOVERIES, EXTRA_JOURNAL, ACTIONS, TALK_KEYS,
  sceneDescription, sceneDialogue, actionResponse,
} from './world.js';

export const SAVE_KEY = 'dusk-town.save.v1';
const VERSION = 1;
const MAX_DAY = 3650;
const BOOLEAN_FLAGS = ['holdingDiary', 'diaryRead', 'diaryReturned', 'diaryKept', 'chapterComplete'];
const JOURNAL_TEXT = { ...DISCOVERIES, ...EXTRA_JOURNAL };

function asDate(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function localDateKey(now = new Date()) {
  const date = asDate(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateOrdinal(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  if (year < 2000 || year > 9999) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return Math.floor(date.getTime() / 86400000);
}

function boundedInteger(value, fallback, minimum, maximum) {
  return Number.isFinite(value) && Number.isInteger(value) ? Math.max(minimum, Math.min(maximum, value)) : fallback;
}

export function createState(now = new Date()) {
  return {
    version: VERSION,
    day: 1,
    date: localDateKey(now),
    time: 0,
    weather: 'clear',
    location: 'street',
    visited: ['street'],
    discoveries: [],
    journal: [],
    flags: {},
    lastEvent: null,
  };
}

/**
 * Treat a localStorage save as untrusted data. Unknown scenes, flags and story
 * IDs are discarded, canonical journal text is reconstructed, and a return on
 * a later local calendar date moves the story forward without losing progress.
 */
export function sanitizeState(raw, now = new Date()) {
  const fresh = createState(now);
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return fresh; }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== VERSION) return fresh;

  const day = boundedInteger(raw.day, 1, 1, MAX_DAY);
  const oldOrdinal = dateOrdinal(raw.date);
  const todayOrdinal = dateOrdinal(fresh.date);
  const elapsed = oldOrdinal !== null && todayOrdinal !== null ? Math.max(0, todayOrdinal - oldOrdinal) : 0;
  const nextDay = Math.min(MAX_DAY, day + elapsed);
  const location = SCENE_IDS.includes(raw.location) ? raw.location : fresh.location;
  const visited = Array.isArray(raw.visited)
    ? [...new Set(raw.visited.filter((id) => SCENE_IDS.includes(id)))]
    : ['street'];
  if (!visited.includes(location)) visited.push(location);
  const discoveries = Array.isArray(raw.discoveries)
    ? [...new Set(raw.discoveries.slice(0, 100).filter((id) => typeof id === 'string' && Object.hasOwn(DISCOVERIES, id)))]
    : [];

  const flags = {};
  const inputFlags = raw.flags && typeof raw.flags === 'object' && !Array.isArray(raw.flags) ? raw.flags : {};
  for (const key of BOOLEAN_FLAGS) if (inputFlags[key] === true) flags[key] = true;
  for (const key of TALK_KEYS) {
    if (Number.isInteger(inputFlags[key]) && inputFlags[key] >= 1 && inputFlags[key] <= day) flags[key] = inputFlags[key];
  }
  if (flags.diaryReturned) {
    flags.holdingDiary = false;
    flags.diaryKept = false;
    flags.diaryRead = true;
    flags.chapterComplete = true;
    if (!discoveries.includes('bookshop-diary')) discoveries.push('bookshop-diary');
  } else if (discoveries.includes('bookshop-diary')) {
    flags.holdingDiary = true;
    flags.chapterComplete = Boolean(flags.diaryKept);
    if (flags.diaryKept) {
      flags.diaryRead = true;
      const isKeptDay = (value) => Number.isInteger(value) && value >= 1 && value <= day;
      const recordedKeptDay = Array.isArray(raw.journal)
        ? raw.journal.slice(0, 100).find((entry) => entry?.id === 'diary-kept' && isKeptDay(entry.day))?.day
        : undefined;
      flags.diaryKeptDay = isKeptDay(inputFlags.diaryKeptDay)
        ? inputFlags.diaryKeptDay
        : recordedKeptDay ?? day;
    }
  } else {
    delete flags.holdingDiary;
    delete flags.diaryRead;
    delete flags.diaryKept;
    delete flags.chapterComplete;
  }

  const journal = [];
  const journalIds = new Set();
  const addJournal = (id, entryDay = day) => {
    if (!Object.hasOwn(JOURNAL_TEXT, id) || journalIds.has(id)) return;
    journalIds.add(id);
    journal.push({ id, text: JOURNAL_TEXT[id], day: boundedInteger(entryDay, day, 1, nextDay) });
  };
  if (Array.isArray(raw.journal)) {
    for (const entry of raw.journal.slice(0, 100)) {
      if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string') continue;
      if (Object.hasOwn(DISCOVERIES, entry.id) && !discoveries.includes(entry.id)) continue;
      if (entry.id === 'diary-owner' && !flags.diaryRead) continue;
      if (entry.id === 'diary-returned' && !flags.diaryReturned) continue;
      if (entry.id === 'diary-kept' && !flags.diaryKept && !flags.diaryReturned) continue;
      addJournal(entry.id, entry.day);
    }
  }
  for (const id of discoveries) addJournal(id);
  if (flags.diaryRead) addJournal('diary-owner');
  if (flags.diaryReturned) addJournal('diary-returned');
  else if (flags.diaryKept) addJournal('diary-kept');

  return {
    version: VERSION,
    day: nextDay,
    date: fresh.date,
    time: elapsed > 0 ? 0 : boundedInteger(raw.time, 0, 0, 2),
    weather: raw.weather === 'rain' ? 'rain' : 'clear',
    location,
    visited,
    discoveries,
    journal,
    flags,
    lastEvent: null,
  };
}

function isActionAvailable(state, id) {
  if (typeof id !== 'string') return false;
  const action = ACTIONS[id];
  if (!action || action.scene !== state.location) return false;
  if (action.discovery && state.discoveries.includes(action.discovery)) return false;
  if (action.talk && state.flags[action.talk] === state.day) return false;
  switch (id) {
    case 'take-diary': return !state.flags.holdingDiary && !state.flags.diaryReturned;
    case 'read-diary': return Boolean(state.flags.holdingDiary && !state.flags.diaryRead);
    case 'return-diary': return Boolean(
      state.flags.holdingDiary && state.flags.diaryRead && !state.flags.diaryReturned
      && (!state.flags.diaryKept || state.day > (state.flags.diaryKeptDay ?? state.day))
    );
    case 'keep-diary': return Boolean(state.flags.holdingDiary && state.flags.diaryRead && !state.flags.diaryKept && !state.flags.diaryReturned);
    default: return true;
  }
}

export function getSceneView(state) {
  const scene = WORLD.scenes.find((item) => item.id === state.location) ?? WORLD.scenes[0];
  const actions = Object.entries(ACTIONS)
    .filter(([id]) => isActionAvailable(state, id))
    .map(([id, action]) => ({ id, label: action.label, hint: action.hint, ...(action.kind ? { kind: action.kind } : {}) }));
  return {
    id: scene.id,
    title: scene.name,
    subtitle: scene.subtitle,
    description: sceneDescription(scene.id, state),
    speaker: scene.character,
    dialogue: sceneDialogue(scene.id, state),
    actions,
    hotspots: actions.map(({ id }) => ({ actionId: id, label: ACTIONS[id].label, x: ACTIONS[id].x, y: ACTIONS[id].y })),
  };
}

function copyState(state) {
  return {
    ...state,
    visited: [...state.visited],
    discoveries: [...state.discoveries],
    journal: state.journal.map((entry) => ({ ...entry })),
    flags: { ...state.flags },
    lastEvent: null,
  };
}

function addJournal(state, id) {
  if (!state.journal.some((entry) => entry.id === id)) {
    state.journal.push({ id, text: JOURNAL_TEXT[id], day: state.day });
  }
}

/** Immutable, deterministic reducer. Invalid or repeated actions are no-ops. */
export function reduce(state, event) {
  if (!state || state.version !== VERSION) state = createState(event?.now);
  if (!event || typeof event !== 'object') return state;
  switch (event.type) {
    case 'reset': return createState(event.now);
    case 'clearEvent': return state.lastEvent ? { ...state, lastEvent: null } : state;
    case 'visit': {
      if (!SCENE_IDS.includes(event.location) || event.location === state.location) return state;
      const next = copyState(state);
      next.location = event.location;
      if (!next.visited.includes(event.location)) next.visited.push(event.location);
      return next;
    }
    case 'action': {
      if (!isActionAvailable(state, event.id)) return state;
      const next = copyState(state);
      const action = ACTIONS[event.id];
      if (action.discovery) {
        next.discoveries.push(action.discovery);
        addJournal(next, action.discovery);
      }
      if (action.talk) next.flags[action.talk] = next.day;
      if (event.id === 'take-diary') next.flags.holdingDiary = true;
      if (event.id === 'read-diary') {
        next.flags.diaryRead = true;
        addJournal(next, 'diary-owner');
      }
      if (event.id === 'return-diary') {
        next.flags.holdingDiary = false;
        next.flags.diaryReturned = true;
        next.flags.diaryKept = false;
        delete next.flags.diaryKeptDay;
        next.flags.chapterComplete = true;
        addJournal(next, 'diary-returned');
      }
      if (event.id === 'keep-diary') {
        next.flags.diaryKept = true;
        next.flags.diaryKeptDay = next.day;
        next.flags.chapterComplete = true;
        addJournal(next, 'diary-kept');
      }
      next.lastEvent = actionResponse(event.id, next);
      return next;
    }
    case 'time': {
      const next = copyState(state);
      next.time = (state.time + 1) % 3;
      return next;
    }
    case 'weather': {
      const next = copyState(state);
      next.weather = state.weather === 'rain' ? 'clear' : 'rain';
      return next;
    }
    case 'nextDay': {
      const next = copyState(state);
      next.day = Math.min(MAX_DAY, state.day + 1);
      next.time = 0;
      next.lastEvent = {
        title: '又一个傍晚',
        text: next.flags.diaryKept
          ? '街灯又亮起来。蓝布日记还在你的包里，许舟说过，他会在渡口等你。'
          : '海风从昨天的方向吹来。去看看，那家店今天有没有开。',
      };
      return next;
    }
    default: return state;
  }
}
