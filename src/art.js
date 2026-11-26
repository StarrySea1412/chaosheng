/** Every light/weather state has its own generated painting. */
export function sceneImagePath(state) {
  const suffix=state.time===0 && state.weather==='clear' ? '' : `-t${state.time}-${state.weather}`;
  return `./public/scenes/${state.location}${suffix}.webp`;
}

export const ACTION_ART = Object.freeze({
  'look-timetable':'detail-street-timetable',
  'talk-driver':'street-bus-wait',
  'take-diary':'detail-bookshop-diary',
  'read-diary':'detail-bookshop-ticket',
  'talk-bookseller':'bookshop-sorting-books',
  'ring-bell':'detail-workshop-bell',
  'talk-mechanic':'workshop-fixing-wheel',
  'listen-piano':'home-piano-hands',
  'talk-musician':'home-tea',
  'read-tides':'ferry-boatman-waiting',
  'talk-traveler':'ferry-luggage-down',
  'return-diary':'ferry-accepting-diary',
  'keep-diary':'ferry-tomorrow-meeting',
  'fold-star':'grocery-passing-star',
  'talk-shopkeeper':'grocery-quiet-chat',
});
