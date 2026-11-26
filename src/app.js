import { WORLD } from './world.js';
import { SAVE_KEY, createState, sanitizeState, reduce, getSceneView, localDateKey } from './engine.js';
import { createAmbience } from './sound.js';
import { sceneImagePath, ACTION_ART } from './art.js';

const SOURCE_URL = 'https://github.com/StarrySea1412/chaosheng';
const TIME_NAMES = ['夕阳未落', '蓝调时分', '灯火渐暖'];
const TIME_CLOCKS = ['18:10', '18:35', '19:00'];
const SCENE_TRAVEL = [
  { location: 'bookshop', label: '进旧书店', x: 24, y: 55 },
  { location: 'workshop', label: '去修车铺', x: 84, y: 69 },
  { location: 'grocery', label: '到小卖部', x: 52, y: 56 },
  { location: 'ferry', label: '往渡口走', x: 66, y: 45 },
];

const icons = {
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  rain: '<path d="M6 15a4 4 0 1 1 .6-8A6 6 0 0 1 18 9a3 3 0 0 1 0 6M8 18l-1 3m6-3-1 3m6-3-1 3"/>',
  sound: '<path d="m10 5-5 4H2v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m10 5-5 4H2v6h3l5 4V5Zm5 4 6 6m0-6-6 6"/>',
  book: '<path d="M4 3h14a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V3Zm0 14h16M8 7h7m-7 4h5"/>',
  down: '<path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a4 4 0 0 0-1-3c4 0 7-2 7-6 0-2-1-3-2-4 0-1 0-2-1-3-2 0-3 1-4 1a12 12 0 0 0-5 0C8 2 6 1 4 2c-1 1-1 2-1 3-1 1-2 2-2 4 0 4 3 6 7 6a4 4 0 0 0-1 3v4"/>',
  leaf: '<path d="M20 3C9 2 3 7 5 14s12 6 15-11ZM5 20 16 9"/>',
  moon: '<path d="M20 15A8 8 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
};
const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

let state;
let saveWorks = true;
try { state = sanitizeState(localStorage.getItem(SAVE_KEY)); } catch { state = createState(); saveWorks = false; }
let tab = 'now';
let toastTimer;
let momentImage=null;
const ambience = createAmbience();

document.querySelector('#app').innerHTML = `
  <div class="page-shell">
    <header class="masthead">
      <a class="brand" href="#" aria-label="潮生，回到长堤街" data-home>
        <svg class="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle cx="22" cy="13" r="6" fill="currentColor"/><path d="M5 26q8-7 17 0t17 0M5 34q8-7 17 0t17 0" stroke="currentColor" stroke-width="1.5"/></svg>
        <span class="brand-name">潮生<span>DUSK TOWN</span></span>
      </a>
      <nav class="header-links" aria-label="小城信息">
        <a class="album-link" href="./gallery.html">小城画册</a>
        <button class="text-button about-button" data-about aria-label="关于小城"><span class="about-label">关于小城</span><span class="about-symbol" aria-hidden="true">i</span></button>
        <button class="sound-button" data-sound aria-pressed="false">${icon('mute')}<span>听海风</span></button>
        <a class="source-link" href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 查看开源项目">${icon('github')}<span>GitHub</span>${icon('arrow', 'external-arrow')}</a>
      </nav>
    </header>

    <section class="introduction" aria-labelledby="page-title">
      <div>
        <p class="eyebrow"><span class="eyebrow-line"></span> 一本可以走进去的图画小说 <span class="edition">VOL. 01</span></p>
        <h1 id="page-title">天色将晚，<br class="mobile-break">去城里走走<span class="title-dot">。</span></h1>
        <p class="intro-copy">沿着海边的小路，遇见几个人，捡起一些差点被忘掉的小事。</p>
      </div>
      <div class="chapter-note">
        <span class="chapter-kicker">第一章 · ${WORLD.chapterNumber}</span>
        <span class="chapter-name">${WORLD.chapter}</span>
        <p>不必赶路。<br>这里的傍晚，可以长一点。</p>
      </div>
    </section>

    <main id="town" tabindex="-1">
      <div class="town-layout">
        <section class="painting-column" aria-label="小城街景">
          <div class="scene-heading">
            <div class="scene-place"><span id="scene-number" class="scene-number"></span><h2 id="scene-title"></h2><span id="scene-subtitle" class="scene-subtitle"></span></div>
            <div class="scene-clock"><span class="live-dot"></span><span id="day-label"></span><span class="clock-divider">/</span><time id="clock-label"></time></div>
          </div>
          <div class="scene-frame" id="scene-frame" data-time="0" data-weather="clear" data-art-mode="painted">
            <img id="scene-image" class="scene-image" src="${sceneImagePath(state)}" alt="" width="1536" height="1024" fetchpriority="high" draggable="false" />
            <div class="light-overlay" aria-hidden="true"></div>
            <div class="rain-layer" aria-hidden="true"><div></div><div></div><div></div></div>
            <div class="hotspot-layer" id="hotspots"></div>
            <span class="scene-stamp" aria-hidden="true">潮生 · 夏</span>
            <p class="image-failure" id="image-failure" hidden>画面暂时没能打开。<br>你仍然可以在右边读故事和散步。</p>
          </div>
          <div class="painting-caption">
            <span class="caption-instruction"><span class="small-cross">＋</span> 轻点画面里的光点，停一停，或往前走。</span>
            <div class="sky-controls" aria-label="街景氛围">
              <button class="sky-button" data-time title="切换天色：夕阳、蓝调、灯火">${icon('sun')}<span id="time-name"></span></button>
              <span class="control-divider"></span>
              <button class="sky-button" data-weather aria-pressed="false">${icon('rain')}<span id="weather-name"></span></button>
            </div>
          </div>
          <nav class="town-nav" id="town-nav" aria-label="沿街散步"></nav>
        </section>

        <aside class="story-sheet" aria-label="故事和随身手记">
          <div class="sheet-tabs" role="tablist" aria-label="随身手记">
            <button class="sheet-tab" id="tab-now" role="tab" aria-controls="story-content" aria-selected="true" data-tab="now">此时此地</button>
            <button class="sheet-tab" id="tab-journal" role="tab" aria-controls="story-content" aria-selected="false" data-tab="journal">${icon('book')}随身手记<span id="journal-count" class="journal-count">0</span></button>
          </div>
          <div id="story-content" class="story-content" role="tabpanel" aria-labelledby="tab-now"></div>
          <div class="sheet-footer">
            <div class="keepsake-progress"><span>收下的小事</span><div id="progress-dots" class="progress-dots" aria-label=""></div><span id="progress-label" class="progress-label"></span></div>
            <div class="return-row"><span id="save-status"><span class="save-dot"></span>手记已替你收好</span><button class="next-day-button" data-nextday>明天再来 ${icon('arrow')}</button></div>
          </div>
        </aside>
      </div>
      <div class="town-afterword"><span>海风吹过。灯还亮着。</span><span class="keyboard-hint"><kbd>←</kbd><kbd>→</kbd> 沿街散步 <span>·</span> <kbd>J</kbd> 翻开手记</span></div>
    </main>

    <footer class="site-footer"><span>一座虚构的小城，一些真实的心情。</span><span>自由散步 · 免费开源 <a href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">CHAOSHENG ${icon('arrow')}</a></span></footer>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <dialog class="about-dialog" id="about-dialog" aria-labelledby="about-title">
    <button class="dialog-close" data-close aria-label="关闭">${icon('close')}</button>
    <p class="eyebrow">DUSK TOWN · VOL. 01</p><h2 id="about-title">有空，再回来看看。</h2>
    <p>潮生是一座虚构的海边小城。你可以点进六个地方，听几句话，把遇见的小事收进手记。第一章从一本蓝布日记开始，最后留给你一个小小的选择。</p>
    <p>画面里的光点可以点，下面的地名也可以走。换个天色，等一场雨，或点「明天再来」，看看熟悉的人又会说些什么。</p>
    <p>手记会保存在这台设备的当前浏览器里。你也可以把它下载带走。隔天回来时，小城会记得你来过。</p>
    <div class="about-credit">用 AI Image Studio 绘制街景，用代码把它们连成一座小城。<br>代码与故事 MIT · 场景素材 CC BY 4.0<br><a href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">查看源码、素材提示词与创作记录 ${icon('arrow')}</a></div>
    <div class="dialog-actions"><button class="primary-button" data-export>${icon('down')} 把手记带走</button><button class="text-button reset-button" data-reset>重新来过</button></div>
    <div id="reset-confirm" class="reset-confirm" hidden><p>这会清空当前浏览器里的散步记录，从第一个傍晚重新开始。</p><button class="primary-button" data-confirm-reset>重新开始</button><button class="text-button" data-cancel-reset>还是继续走吧</button></div>
  </dialog>
`;

const elements = Object.fromEntries(['scene-title', 'scene-number', 'scene-subtitle', 'day-label', 'clock-label', 'scene-frame', 'scene-image', 'hotspots', 'time-name', 'weather-name', 'town-nav', 'story-content', 'journal-count', 'progress-dots', 'progress-label', 'save-status', 'toast', 'about-dialog', 'reset-confirm', 'image-failure'].map((id) => [id, document.getElementById(id)]));

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saveWorks = true; } catch { saveWorks = false; }
  elements['save-status'].innerHTML = saveWorks ? '<span class="save-dot"></span>手记已替你收好' : '此浏览器暂时无法保存手记';
}

function tell(text) {
  clearTimeout(toastTimer);
  elements.toast.textContent = text;
  elements.toast.classList.add('is-visible');
  toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), 3200);
}

function renderStory(view) {
  const panel = elements['story-content'];
  panel.setAttribute('aria-labelledby', tab === 'now' ? 'tab-now' : 'tab-journal');
  if (tab === 'journal') {
    panel.innerHTML = `<div class="journal-heading"><span class="note-eyebrow">POCKET NOTES</span><h3>留在口袋里的傍晚</h3><p>记下一点，下次就能接着想起。</p></div>${state.journal.length ? `<ol class="journal-list">${state.journal.map((entry, index) => `<li><span class="journal-index">${String(index + 1).padStart(2, '0')}</span><div><span class="journal-day">第 ${entry.day} 个傍晚</span><p>${escape(entry.text)}</p></div></li>`).join('')}</ol><button class="journal-export" data-export>${icon('down')}把这些小事带走</button>` : `<div class="journal-empty">${icon('leaf')}<p>手记还空着。<br>去街上走走，有些小事值得记下来。</p><button class="text-button" data-tab="now">回到此时此地 ${icon('arrow')}</button></div>`}`;
    return;
  }
  const result = state.lastEvent;
  panel.innerHTML = `
    <p class="note-eyebrow">${result ? 'A MOMENT TO KEEP' : 'RIGHT HERE, RIGHT NOW'}</p>
    <h3>${escape(result ? result.title : view.subtitle)}</h3>
    <p class="scene-prose">${escape(result ? result.text : view.description)}</p>
    ${result && momentImage ? `<a class="moment-picture" href="./gallery.html?image=${momentImage}" aria-label="翻开手记里的插画"><img src="./public/thumbs/${momentImage}.webp" width="480" height="320" alt="${escape(result.title)}"/><span>翻开手记里的插画 ↗</span></a>` : ''}
    ${!result ? `<div class="dialogue"><span class="speaker-name"><span></span>${escape(view.speaker)}</span><p>${escape(view.dialogue)}</p></div>` : '<div class="event-rule"><span>·</span><span>·</span><span>·</span></div>'}
    <div class="scene-actions" aria-label="在这里做点什么">${view.actions.length ? view.actions.map((action) => `<button class="action-button ${action.kind === 'primary' ? 'action-primary' : ''}" data-action="${escape(action.id)}"><span>${escape(action.label)}<small>${escape(action.hint || '')}</small></span>${icon('arrow')}</button>`).join('') : `<div class="quiet-note">这个角落的小事，都已经收好了。<br>再坐一会儿，或去别处看看。</div>`}</div>
    ${state.flags.chapterComplete ? `<div class="chapter-complete"><span class="completion-mark">✓</span><div><span>第一章 · 傍晚的约定</span><p>${state.flags.diaryReturned ? '日记回到了许舟手里。' : '你们约好，明天在渡口见。'}<br>还想走走的话，街上的灯都亮着。</p></div></div>` : ''}
  `;
}

function render() {
  const focused = document.activeElement;
  const focusWasReplaced = focused && (elements['town-nav'].contains(focused) || elements.hotspots.contains(focused) || elements['story-content'].contains(focused));
  const focusAction = focusWasReplaced ? focused.dataset.action : null;
  const focusPlace = focusWasReplaced ? focused.dataset.visit : null;
  const focusWasHotspot = focusWasReplaced && focused.classList.contains('hotspot');
  const view = getSceneView(state);
  const scene = WORLD.scenes.find((item) => item.id === state.location);
  elements['scene-title'].textContent = view.title;
  elements['scene-number'].textContent = scene.number;
  elements['scene-subtitle'].textContent = view.subtitle;
  elements['day-label'].textContent = `第 ${state.day} 个傍晚`;
  elements['clock-label'].textContent = TIME_CLOCKS[state.time];
  elements['clock-label'].dateTime = TIME_CLOCKS[state.time];
  elements['time-name'].textContent = TIME_NAMES[state.time];
  elements['weather-name'].textContent = state.weather === 'rain' ? '雨落下了' : '等一场雨';
  document.querySelector('button[data-weather]').setAttribute('aria-pressed', String(state.weather === 'rain'));
  elements['scene-frame'].dataset.time = state.time;
  elements['scene-frame'].dataset.weather = state.weather;
  ambience.setWeather(state.weather);
  const source = sceneImagePath(state);
  if (elements['scene-image'].getAttribute('src') !== source) {
    elements['scene-image'].setAttribute('src', source);
    elements['image-failure'].hidden = true;
  }
  elements['scene-image'].alt = `${view.title}，${TIME_NAMES[state.time]}，${state.weather==='rain'?'雨天':'晴天'}的小城手绘街景`;
  const hotspots = view.id === 'street' ? SCENE_TRAVEL : view.hotspots.filter((spot) => !['return-diary', 'keep-diary'].includes(spot.actionId));
  elements.hotspots.innerHTML = hotspots.map((spot) => `<button class="hotspot ${spot.x > 78 ? 'hotspot-right' : spot.x < 20 ? 'hotspot-left' : ''}" style="--x:${spot.x}%;--y:${spot.y}%" ${spot.location ? `data-visit="${spot.location}"` : `data-action="${escape(spot.actionId)}"`} aria-label="${escape(spot.label)}"><span class="hotspot-dot"></span><span class="hotspot-label">${escape(spot.label)} ${icon('arrow')}</span></button>`).join('');
  elements['town-nav'].innerHTML = WORLD.scenes.map((item) => `<button class="place-button ${item.id === state.location ? 'is-current' : ''} ${state.visited.includes(item.id) ? 'is-visited' : ''}" data-visit="${item.id}" ${item.id === state.location ? 'aria-current="location"' : ''}><span class="place-number">${item.number}</span><span class="place-name">${escape(item.name)}</span><span class="place-dot"></span></button>`).join('');
  elements['journal-count'].textContent = state.journal.length;
  for (const button of document.querySelectorAll('[data-tab]')) {
    if (button.getAttribute('role') === 'tab') {
      const selected = button.dataset.tab === tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
  }
  elements['progress-dots'].innerHTML = WORLD.scenes.map((item, index) => `<span class="${state.discoveries.length > index ? 'is-filled' : ''}"></span>`).join('');
  elements['progress-dots'].setAttribute('aria-label', `已收下 ${state.discoveries.length} 件小事，共 ${WORLD.discoveryCount} 件`);
  elements['progress-label'].textContent = `${state.discoveries.length} / ${WORLD.discoveryCount}`;
  renderStory(view);
  persist();
  if (focusWasReplaced) {
    let target;
    if (focusPlace) target = document.querySelector(`${focusWasHotspot ? '#hotspots' : '#town-nav'} [data-visit="${CSS.escape(focusPlace)}"]`);
    if (focusAction) target = document.querySelector(`${focusWasHotspot ? '#hotspots' : '#story-content'} [data-action="${CSS.escape(focusAction)}"]`);
    target ||= document.querySelector('#story-content [data-action]') || document.getElementById(`tab-${tab}`);
    target.focus({ preventScroll: true });
  }
}

function reconcileDate() {
  if (localDateKey() === state.date) return;
  const oldDay = state.day;
  state = sanitizeState(state);
  render();
  if (state.day > oldDay) tell('又一个傍晚。小城记得你来过。');
}

function dispatch(event) {
  if (event.type !== 'reset') reconcileDate();
  const next = reduce(state, event);
  if (next === state) return;
  const oldLocation = state.location;
  const journalCount = state.journal.length;
  state = next;
  momentImage=event.type==='action' ? ACTION_ART[event.id]||null : null;
  tab = 'now';
  render();
  if (event.type === 'action' && state.journal.length > journalCount) tell('一件小事，已经放进手记。');
  if (event.type === 'nextDay') tell(`第 ${state.day} 个傍晚。去看看熟悉的人吧。`);
  if (event.type === 'visit' && oldLocation !== state.location) elements['scene-frame'].animate([{ opacity: 0.72 }, { opacity: 1 }], { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350 });
}

function exportJournal() {
  const text = `潮生 · 随身手记\n第一章：${WORLD.chapter}\n第 ${state.day} 个傍晚\n\n${state.journal.length ? state.journal.map((entry, index) => `${String(index + 1).padStart(2, '0')} · 第 ${entry.day} 个傍晚\n${entry.text}`).join('\n\n') : '手记还空着。海风吹过，灯还亮着。'}\n\n小城：https://starrysea1412.github.io/chaosheng/\n`;
  const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `潮生-第${state.day}个傍晚的手记.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  tell('手记已经带走。以后有空，再回来。');
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('button,a[data-home]');
  if (!button) return;
  if (button.hasAttribute('data-home')) { event.preventDefault(); dispatch({ type: 'visit', location: 'street' }); return; }
  if (button.dataset.visit) { dispatch({ type: 'visit', location: button.dataset.visit }); return; }
  if (button.dataset.action) {
    dispatch({ type: 'action', id: button.dataset.action });
    if (button.classList.contains('hotspot') && window.matchMedia('(max-width: 760px)').matches) document.querySelector('.story-sheet').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (button.dataset.tab) { tab = button.dataset.tab; render(); return; }
  if (button.hasAttribute('data-time')) { dispatch({ type: 'time' }); return; }
  if (button.hasAttribute('data-weather')) { dispatch({ type: 'weather' }); return; }
  if (button.hasAttribute('data-nextday')) { dispatch({ type: 'nextDay' }); return; }
  if (button.hasAttribute('data-about')) { elements['reset-confirm'].hidden = true; elements['about-dialog'].showModal(); return; }
  if (button.hasAttribute('data-close')) { elements['about-dialog'].close(); return; }
  if (button.hasAttribute('data-export')) { exportJournal(); return; }
  if (button.hasAttribute('data-reset')) { elements['reset-confirm'].hidden = false; document.querySelector('[data-confirm-reset]').focus(); return; }
  if (button.hasAttribute('data-cancel-reset')) { elements['reset-confirm'].hidden = true; return; }
  if (button.hasAttribute('data-confirm-reset')) { dispatch({ type: 'reset' }); elements['about-dialog'].close(); tell('回到第一个傍晚。长堤街还在等你。'); return; }
  if (button.hasAttribute('data-sound')) {
    try {
      const sound = await ambience.toggle();
      button.setAttribute('aria-pressed', String(sound.enabled));
      button.innerHTML = `${icon(sound.enabled ? 'sound' : 'mute')}<span>${sound.enabled ? '海风轻响' : '听海风'}</span>`;
      if (!sound.supported) tell('这个浏览器暂时不能播放海风。');
    } catch { tell('海风暂时没能响起来，稍后再试试。'); }
  }
});

document.addEventListener('keydown', (event) => {
  if (elements['about-dialog'].open || event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input,textarea,select,[contenteditable="true"]')) return;
  if (event.target.closest('[role="tablist"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    tab = event.key === 'Home' ? 'now' : event.key === 'End' ? 'journal' : tab === 'now' ? 'journal' : 'now';
    render();
    document.getElementById(`tab-${tab}`).focus();
    return;
  }
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const current = WORLD.scenes.findIndex((item) => item.id === state.location);
    const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + WORLD.scenes.length) % WORLD.scenes.length;
    dispatch({ type: 'visit', location: WORLD.scenes[next].id });
  }
  if (event.key.toLowerCase() === 'j') { tab = tab === 'now' ? 'journal' : 'now'; render(); document.getElementById(`tab-${tab}`).focus(); }
});

elements['scene-image'].addEventListener('error', () => { elements['image-failure'].hidden = false; });
elements['scene-image'].addEventListener('load', () => { elements['image-failure'].hidden = true; });
elements['about-dialog'].addEventListener('click', (event) => { if (event.target === elements['about-dialog']) { const rect = elements['about-dialog'].getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) elements['about-dialog'].close(); } });
document.addEventListener('visibilitychange', () => { ambience.quiet(!document.hidden); if (!document.hidden) reconcileDate(); });
window.addEventListener('pageshow', reconcileDate);
render();

// A small public diagnostic hook is useful to browser tests and to story modders.
window.duskTown = Object.freeze({ getState: () => structuredClone(state), version: '0.2.0' });
