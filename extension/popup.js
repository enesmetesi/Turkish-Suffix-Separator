const DEFAULTS = { mode: 'turkish-pages', delay: 300 };

chrome.storage.sync.get(DEFAULTS, (s) => {
  const radio = document.querySelector(`input[name="mode"][value="${s.mode}"]`);
  if (radio) radio.checked = true;
  document.getElementById('delay').value = String(s.delay);
});

for (const r of document.querySelectorAll('input[name="mode"]')) {
  r.addEventListener('change', () => chrome.storage.sync.set({ mode: r.value }));
}
document.getElementById('delay').addEventListener('change', (e) => {
  chrome.storage.sync.set({ delay: Number(e.target.value) });
});
