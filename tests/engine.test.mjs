import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, sanitizeState, reduce, getSceneView, localDateKey } from '../src/engine.js';
import { WORLD } from '../src/world.js';

const now = new Date(2026, 10, 24, 18, 10);
const visit = (state, location) => reduce(state, { type: 'visit', location });
const act = (state, id) => reduce(state, { type: 'action', id });

function foundDiary() {
  let state = visit(createState(now), 'bookshop');
  state = act(state, 'take-diary');
  return act(state, 'read-diary');
}

test('new arrivals begin in the street with a user-local date and six connected scenes', () => {
  const state = createState(now);
  assert.equal(state.location, 'street');
  assert.equal(state.date, '2026-11-24');
  assert.equal(localDateKey(new Date(2026, 0, 2, 0, 1)), '2026-01-02');
  assert.equal(WORLD.scenes.length, 6);
  assert.equal(getSceneView(state).speaker, '公交司机');
  assert.deepEqual(state.visited, ['street']);
});

test('the diary cannot be read before it is found, or returned from another location', () => {
  let state = createState(now);
  assert.equal(act(state, 'take-diary'), state);
  state = visit(state, 'bookshop');
  assert.equal(act(state, 'read-diary'), state);
  state = act(state, 'take-diary');
  assert.equal(state.flags.holdingDiary, true);
  assert.equal(act(state, 'return-diary'), state);
  state = visit(state, 'ferry');
  assert.equal(act(state, 'return-diary'), state, 'the name must be read first');
  assert.ok(!getSceneView(state).actions.some((action) => action.id === 'return-diary'));
});

test('returning the diary closes the chapter and cannot be repeated', () => {
  let state = visit(foundDiary(), 'ferry');
  const before = structuredClone(state);
  state = act(state, 'return-diary');
  assert.equal(state.flags.diaryReturned, true);
  assert.equal(state.flags.holdingDiary, false);
  assert.equal(state.flags.chapterComplete, true);
  assert.equal(state.lastEvent.title, '把名字还给明天');
  assert.equal(state.journal.filter((entry) => entry.id === 'diary-returned').length, 1);
  assert.equal(before.flags.holdingDiary, true, 'reducer leaves previous state untouched');
  assert.equal(act(state, 'return-diary'), state);
  assert.ok(!getSceneView(state).actions.some((action) => ['return-diary', 'keep-diary'].includes(action.id)));
});

test('keeping the diary is a valid branch, and it can still be returned tomorrow', () => {
  let state = visit(foundDiary(), 'ferry');
  state = act(state, 'keep-diary');
  assert.equal(state.flags.diaryKept, true);
  assert.equal(state.flags.diaryKeptDay, 1);
  assert.equal(state.flags.holdingDiary, true);
  assert.equal(state.flags.chapterComplete, true);
  assert.equal(state.journal.at(-1).id, 'diary-kept');
  assert.equal(act(state, 'keep-diary'), state);
  assert.equal(act(state, 'return-diary'), state, 'the promise lasts until another evening');
  assert.ok(!getSceneView(state).actions.some((action) => action.id === 'return-diary'));
  state = reduce(state, { type: 'nextDay' });
  assert.equal(state.day, 2);
  assert.match(getSceneView(state).dialogue, /约好的地方/);
  state = act(state, 'return-diary');
  assert.equal(state.flags.diaryReturned, true);
  assert.equal(state.flags.diaryKept, false);
  assert.equal(state.flags.diaryKeptDay, undefined);
  assert.ok(state.journal.some((entry) => entry.id === 'diary-kept'));
  assert.ok(state.journal.some((entry) => entry.id === 'diary-returned'));
});

test('the tomorrow promise survives same-day reload and releases after nextDay', () => {
  const kept = act(visit(foundDiary(), 'ferry'), 'keep-diary');
  let restored = sanitizeState(JSON.stringify(kept), now);
  assert.equal(restored.flags.diaryKeptDay, 1);
  assert.equal(restored.flags.diaryRead, true);
  assert.equal(act(restored, 'return-diary'), restored);
  assert.ok(!getSceneView(restored).hotspots.some((hotspot) => hotspot.actionId === 'return-diary'));
  restored = reduce(restored, { type: 'nextDay' });
  assert.ok(getSceneView(restored).actions.some((action) => action.id === 'return-diary'));
  restored = act(restored, 'return-diary');
  assert.equal(restored.flags.diaryReturned, true);
  assert.equal(restored.flags.diaryKeptDay, undefined);
});

test('a later real calendar visit releases the promised diary without manual day advance', () => {
  const kept = act(visit(foundDiary(), 'ferry'), 'keep-diary');
  const restored = sanitizeState(kept, new Date(2026, 10, 25, 8));
  assert.equal(restored.day, 2);
  assert.equal(restored.flags.diaryKeptDay, 1);
  assert.ok(getSceneView(restored).actions.some((action) => action.id === 'return-diary'));
  assert.equal(act(restored, 'return-diary').flags.diaryReturned, true);
});

test('legacy kept saves infer read status and use a recorded or default kept day', () => {
  const legacy = act(visit(foundDiary(), 'ferry'), 'keep-diary');
  delete legacy.flags.diaryKeptDay;
  delete legacy.flags.diaryRead;
  let restored = sanitizeState(legacy, now);
  assert.equal(restored.flags.diaryRead, true);
  assert.equal(restored.flags.diaryKeptDay, 1);
  assert.equal(act(restored, 'return-diary'), restored);

  legacy.day = 3;
  restored = sanitizeState(legacy, now);
  assert.equal(restored.flags.diaryKeptDay, 1, 'the original journal day preserves an older promise');
  assert.ok(getSceneView(restored).actions.some((action) => action.id === 'return-diary'));

  legacy.journal = [];
  legacy.flags.diaryKeptDay = 999;
  restored = sanitizeState(legacy, now);
  assert.equal(restored.flags.diaryKeptDay, 3, 'invalid or missing days fall back to the saved evening');
  assert.equal(act(restored, 'return-diary'), restored);
  restored = reduce(restored, { type: 'nextDay' });
  assert.ok(getSceneView(restored).actions.some((action) => action.id === 'return-diary'));
});

test('all six discoveries can be collected in any order without duplicate entries', () => {
  let state = createState(now);
  const route = [
    ['home', 'listen-piano'], ['grocery', 'fold-star'], ['ferry', 'read-tides'],
    ['workshop', 'ring-bell'], ['street', 'look-timetable'], ['bookshop', 'take-diary'],
  ];
  for (const [scene, action] of route) {
    state = visit(state, scene);
    state = act(state, action);
    const length = state.journal.length;
    assert.equal(act(state, action), state);
    assert.equal(state.journal.length, length);
  }
  assert.equal(state.discoveries.length, WORLD.discoveryCount);
  assert.equal(new Set(state.journal.map((entry) => entry.id)).size, state.journal.length);
  assert.equal(state.visited.length, 6);
});

test('hotspots only refer to available actions in the current scene', () => {
  let state = createState(now);
  for (const scene of WORLD.scenes) {
    state = visit(state, scene.id);
    const view = getSceneView(state);
    assert.equal(view.id, scene.id);
    for (const hotspot of view.hotspots) {
      assert.ok(view.actions.some((action) => action.id === hotspot.actionId));
      assert.ok(hotspot.x >= 0 && hotspot.x <= 100);
      assert.ok(hotspot.y >= 0 && hotspot.y <= 100);
    }
  }
});

test('talking is limited to once per scene each day and changes on a later visit', () => {
  let state = createState(now);
  const yesterday = getSceneView(state).dialogue;
  state = act(state, 'talk-driver');
  assert.equal(act(state, 'talk-driver'), state);
  state = reduce(state, { type: 'nextDay' });
  assert.notEqual(getSceneView(state).dialogue, yesterday);
  assert.ok(getSceneView(state).actions.some((action) => action.id === 'talk-driver'));
  state = act(state, 'talk-driver');
  assert.equal(state.flags.talkStreetDay, 2);
});

test('time and weather change the view while discoveries stay in place', () => {
  let state = act(createState(now), 'look-timetable');
  const original = structuredClone(state);
  state = reduce(state, { type: 'time' });
  assert.equal(state.time, 1);
  state = reduce(state, { type: 'time' });
  assert.equal(state.time, 2);
  assert.match(getSceneView(state).description, /街灯/);
  state = reduce(state, { type: 'time' });
  assert.equal(state.time, 0);
  state = reduce(state, { type: 'weather' });
  assert.equal(state.weather, 'rain');
  assert.match(getSceneView(state).description, /雨/);
  assert.deepEqual(state.discoveries, original.discoveries);
  assert.deepEqual(state.journal, original.journal);
});

test('same-day reload preserves progress and drops transient event output', () => {
  let state = visit(foundDiary(), 'workshop');
  state = act(state, 'ring-bell');
  state = reduce(state, { type: 'weather' });
  state = reduce(state, { type: 'time' });
  const restored = sanitizeState(JSON.stringify(state), now);
  assert.equal(restored.day, state.day);
  assert.equal(restored.location, 'workshop');
  assert.equal(restored.time, 1);
  assert.equal(restored.weather, 'rain');
  assert.equal(restored.flags.holdingDiary, true);
  assert.equal(restored.flags.diaryRead, true);
  assert.deepEqual(restored.discoveries, state.discoveries);
  assert.deepEqual(restored.journal, state.journal);
  assert.equal(restored.lastEvent, null);
});

test('returning on a later calendar day advances the story and keeps the diary', () => {
  let state = foundDiary();
  state = reduce(state, { type: 'time' });
  const restored = sanitizeState(state, new Date(2026, 10, 27, 8));
  assert.equal(restored.day, 4);
  assert.equal(restored.date, '2026-11-27');
  assert.equal(restored.time, 0);
  assert.equal(restored.flags.holdingDiary, true);
  assert.equal(restored.flags.diaryRead, true);
  assert.deepEqual(restored.discoveries, state.discoveries);
});

test('corrupt, future-version, impossible-date and unknown saved values are repaired safely', () => {
  for (const raw of [null, [], '{oops', { version: 99 }, 3]) {
    assert.deepEqual(sanitizeState(raw, now), createState(now));
  }
  const restored = sanitizeState({
    version: 1, day: Infinity, date: '2026-02-30', time: 999, weather: 'snow',
    location: '<script>', visited: ['bookshop', 'bookshop', 'missing'],
    discoveries: ['grocery-star', 'grocery-star', 'forged', { toString: 'invalid' }],
    journal: [
      { id: 'grocery-star', text: '<script>fake</script>', day: -50 },
      { id: 'grocery-star', text: 'duplicate', day: 8 },
      { id: 'diary-returned', text: 'unearned', day: 1 },
      { id: 'unknown', text: 'unknown', day: 1 },
      { id: { toString: 'invalid' }, text: 'invalid', day: 1 },
    ],
    flags: { holdingDiary: true, diaryRead: true, injected: true, talkStreetDay: 999 },
  }, now);
  assert.equal(restored.day, 1);
  assert.equal(restored.date, '2026-11-24');
  assert.equal(restored.time, 2);
  assert.equal(restored.weather, 'clear');
  assert.equal(restored.location, 'street');
  assert.deepEqual(restored.visited, ['bookshop', 'street']);
  assert.deepEqual(restored.discoveries, ['grocery-star']);
  assert.equal(restored.flags.injected, undefined);
  assert.equal(restored.flags.holdingDiary, undefined);
  assert.equal(restored.flags.diaryRead, undefined);
  assert.equal(restored.journal.length, 1);
  assert.match(restored.journal[0].text, /小满/);
  assert.equal(restored.journal[0].day, 1);
});

test('unknown reducer events and scene IDs are no-ops; reset creates a clean arrival', () => {
  const state = foundDiary();
  assert.equal(reduce(state, { type: 'visit', location: 'missing' }), state);
  assert.equal(reduce(state, { type: 'unrecognized' }), state);
  assert.equal(reduce(state, { type: 'action', id: { toString: 'invalid' } }), state);
  assert.equal(reduce(state, null), state);
  assert.deepEqual(reduce(state, { type: 'reset', now }), createState(now));
});
