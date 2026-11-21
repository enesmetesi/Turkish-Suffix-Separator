const DEFAULTS = { mode: 'turkish-pages', delay: 300, terms: 'both' };

chrome.storage.sync.get(DEFAULTS, (s) => {
  const radio = document.querySelector(`input[name="mode"][value="${s.mode}"]`);
  if (radio) radio.checked = true;
  document.getElementById('delay').value = String(s.delay);
  document.getElementById('terms').value = s.terms;
});

for (const r of document.querySelectorAll('input[name="mode"]')) {
  r.addEventListener('change', () => chrome.storage.sync.set({ mode: r.value }));
}
document.getElementById('delay').addEventListener('change', (e) => {
  chrome.storage.sync.set({ delay: Number(e.target.value) });
});
document.getElementById('terms').addEventListener('change', (e) => {
  chrome.storage.sync.set({ terms: e.target.value });
});
