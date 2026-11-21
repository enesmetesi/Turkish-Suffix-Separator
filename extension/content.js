// Content script: shows the suffix card when the mouse rests on a word.
// The analyzer and its data load lazily, on the first hover, so pages that
// are never hovered pay nothing.
(() => {
  'use strict';

  const DEFAULTS = { mode: 'turkish-pages', delay: 300, terms: 'both' };
  // mode: 'turkish-pages' = hover on Turkish pages, Alt + hover elsewhere
  //       'always'        = hover on every page
  //       'alt'           = only Alt + hover
  //       'off'
  let settings = { ...DEFAULTS };
  const WORD_CHAR = /[\p{L}\p{M}'’]/u;
  const COLORS = 6;

  let analyzerPromise = null;
  let cardModule = null;
  let timer = null;
  let lastEvent = null;
  let current = null; // { word, rect }
  let host = null;
  let shadow = null;
  let pointerOnCard = false;

  // --- Settings ---------------------------------------------------------------
  try {
    chrome.storage.sync.get(DEFAULTS, (s) => { settings = { ...DEFAULTS, ...s }; });
    chrome.storage.onChanged.addListener((changes) => {
      for (const [k, v] of Object.entries(changes)) settings[k] = v.newValue;
      if (settings.mode === 'off') hide();
    });
  } catch { /* storage unavailable: keep defaults */ }

  let turkishPage = null;
  function isTurkishPage() {
    if (turkishPage !== null) return turkishPage;
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang) {
      turkishPage = lang.startsWith('tr');
    } else {
      // No lang attribute: look for letters that only Turkish uses often.
      const sample = (document.body?.innerText || '').slice(0, 5000);
      const hits = (sample.match(/[ğışİĞŞ]/g) || []).length;
      turkishPage = sample.length > 0 && hits / sample.length > 0.004;
    }
    return turkishPage;
  }

  function hoverAllowed(e) {
    switch (settings.mode) {
      case 'off': return false;
      case 'always': return true;
      case 'alt': return e.altKey;
      default: return e.altKey || isTurkishPage();
    }
  }

  // --- Analyzer ---------------------------------------------------------------
  function loadAnalyzer() {
    if (!analyzerPromise) {
      const url = (p) => chrome.runtime.getURL(p);
      analyzerPromise = Promise.all([
        import(url('src/index.js')),
        import(url('src/card.js')),
        fetch(url('data/lexicon.json')).then((r) => r.json()),
        fetch(url('data/glosses.json')).then((r) => r.json()),
      ]).then(([index, card, lexicon, glosses]) => {
        cardModule = card;
        return index.createAnalyzer(lexicon, glosses);
      });
    }
    return analyzerPromise;
  }

  // --- Finding the word under the pointer ------------------------------------
  function wordAt(x, y) {
    const range = document.caretRangeFromPoint?.(x, y);
    if (!range) return null;
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    const el = node.parentElement;
    if (!el || el.closest('input, textarea, [contenteditable=""], [contenteditable="true"], script, style')) return null;
    const text = node.textContent;
    let start = range.startOffset;
    let end = range.startOffset;
    while (start > 0 && WORD_CHAR.test(text[start - 1])) start--;
    while (end < text.length && WORD_CHAR.test(text[end])) end++;
    let word = text.slice(start, end).replace(/^['’]+|['’]+$/g, '');
    if (!word || !/\p{L}/u.test(word) || word.length > 40) return null;
    // Make sure the pointer is really over the word, not beside the line.
    const r = document.createRange();
    r.setStart(node, start);
    r.setEnd(node, end);
    const rect = r.getBoundingClientRect();
    if (x < rect.left - 2 || x > rect.right + 2 || y < rect.top - 2 || y > rect.bottom + 2) return null;
    return { word, rect };
  }

  // --- Card -------------------------------------------------------------------
  const CSS = `
    :host { all: initial; }
    .card {
      --bg: #ffffff; --fg: #1c1d21; --muted: #6b6f7a; --line: #e3e5ea; --shadow: 0 6px 24px rgba(0,0,0,.16);
      --c0: #1c1d21; --c1: #c2410c; --c2: #1d4ed8; --c3: #047857; --c4: #7e22ce; --c5: #b91c1c; --c6: #0e7490;
      position: fixed; z-index: 2147483647; max-width: 480px; min-width: 220px;
      background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-radius: 10px;
      box-shadow: var(--shadow); padding: 10px 12px; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
      text-align: left;
    }
    @media (prefers-color-scheme: dark) {
      .card {
        --bg: #1f2126; --fg: #eceef2; --muted: #9aa0ab; --line: #343741; --shadow: 0 6px 24px rgba(0,0,0,.5);
        --c0: #eceef2; --c1: #fb923c; --c2: #60a5fa; --c3: #34d399; --c4: #c084fc; --c5: #f87171; --c6: #22d3ee;
      }
    }
    .word { font-size: 15px; font-weight: 600; }
    .split { font-size: 14px; margin-top: 2px; letter-spacing: .2px; }
    .split .dot { color: var(--muted); padding: 0 3px; }
    hr { border: 0; border-top: 1px solid var(--line); margin: 8px 0; }
    table { border-collapse: collapse; width: 100%; }
    td { padding: 2px 0; vertical-align: top; }
    td.part { font-weight: 600; white-space: nowrap; padding-right: 10px; }
    td.term { color: var(--muted); padding-left: 10px; font-size: 12px; }
    .note { color: var(--muted); font-size: 12px; padding: 0 0 2px 0; }
    .more { margin-top: 6px; }
    .more summary { cursor: pointer; color: var(--muted); font-size: 12px; }
    .more div { font-size: 12px; padding: 2px 0 0 12px; }
    .none { color: var(--muted); }
    .c0 { color: var(--c0); } .c1 { color: var(--c1); } .c2 { color: var(--c2); } .c3 { color: var(--c3); }
    .c4 { color: var(--c4); } .c5 { color: var(--c5); } .c6 { color: var(--c6); }
  `;

  function ensureHost() {
    if (host) return;
    host = document.createElement('div');
    host.setAttribute('data-turkish-suffix-separator', '');
    shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);
    document.documentElement.appendChild(host);
  }

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const colorClass = (c) => (c === null || c === undefined ? '' : `c${c === 0 ? 0 : ((c - 1) % COLORS) + 1}`);

  function render(model) {
    const card = el('div', 'card');
    card.addEventListener('mouseenter', () => { pointerOnCard = true; });
    card.addEventListener('mouseleave', () => { pointerOnCard = false; hide(); });
    card.appendChild(el('div', 'word', model.word));
    if (!model.recognized) {
      card.appendChild(el('div', 'none', 'Not recognized'));
      return card;
    }
    const split = el('div', 'split');
    model.segments.forEach((s, i) => {
      if (i) split.appendChild(el('span', 'dot', '·'));
      split.appendChild(el('span', colorClass(s.color), s.text));
    });
    card.appendChild(split);
    card.appendChild(el('hr'));
    const table = el('table');
    for (const row of model.rows) {
      const tr = el('tr');
      tr.appendChild(el('td', `part ${colorClass(row.color)}`, row.part));
      tr.appendChild(el('td', 'meaning', row.meaning));
      tr.appendChild(el('td', 'term', row.term));
      table.appendChild(tr);
      if (row.note) {
        const ntr = el('tr');
        ntr.appendChild(el('td'));
        const td = el('td', 'note', row.note);
        td.colSpan = 2;
        ntr.appendChild(td);
        table.appendChild(ntr);
      }
    }
    card.appendChild(table);
    if (model.others.length) {
      const more = el('details', 'more');
      const n = model.moreCount;
      more.appendChild(el('summary', null, `${n} more reading${n === 1 ? '' : 's'}`));
      for (const o of model.others) more.appendChild(el('div', null, `${o.text}: ${o.summary}`));
      card.appendChild(more);
    }
    return card;
  }

  function show(model, rect) {
    ensureHost();
    for (const old of shadow.querySelectorAll('.card')) old.remove();
    const card = render(model);
    card.style.visibility = 'hidden';
    shadow.appendChild(card);
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let left = Math.min(Math.max(8, rect.left), window.innerWidth - w - 8);
    let top = rect.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, rect.top - h - 6);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.visibility = 'visible';
  }

  function hide() {
    current = null;
    if (shadow) for (const old of shadow.querySelectorAll('.card')) old.remove();
  }

  // --- Events -----------------------------------------------------------------
  async function check() {
    const e = lastEvent;
    if (!e || pointerOnCard || !hoverAllowed(e)) return;
    const hit = wordAt(e.clientX, e.clientY);
    if (!hit) { hide(); return; }
    if (current && current.word === hit.word && current.rect.top === hit.rect.top && current.rect.left === hit.rect.left) return;
    current = hit;
    try {
      const analyzer = await loadAnalyzer();
      if (current !== hit) return; // pointer moved on while loading
      const model = cardModule.buildCard(hit.word, analyzer.analyze(hit.word), { terms: settings.terms });
      show(model, hit.rect);
    } catch (err) {
      console.warn('[Turkish Suffix Separator]', err);
    }
  }

  document.addEventListener('mousemove', (e) => {
    if (host && e.composedPath().includes(host)) return;
    lastEvent = e;
    if (current && !pointerOnCard) {
      const r = current.rect;
      const inside = e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 8;
      if (!inside) hide();
    }
    clearTimeout(timer);
    timer = setTimeout(check, settings.delay);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
    // Alt pressed while resting on a word: check right away.
    if (e.key === 'Alt' && lastEvent) {
      lastEvent = new MouseEvent('mousemove', { clientX: lastEvent.clientX, clientY: lastEvent.clientY, altKey: true });
      check();
    }
  });
  window.addEventListener('scroll', () => { if (!pointerOnCard) hide(); }, { passive: true });
})();
