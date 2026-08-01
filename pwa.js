// ===== TahajjudY — umumiy PWA va tema funksiyalari =====
// Bu fayl index.html, dashboard.html va settings.html'da birgalikda ishlatiladi.

const THEME_KEY = 'tahajjudy-theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('.theme-switch').forEach((el) => {
    el.checked = theme === 'dark';
  });
}

function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function wireThemeSwitches() {
  document.querySelectorAll('.theme-switch').forEach((el) => {
    el.checked = getTheme() === 'dark';
    el.addEventListener('change', () => applyTheme(el.checked ? 'dark' : 'light'));
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.error('SW xatosi:', err));
  }
}

let deferredInstallPrompt = null;

function wireInstallPrompt(buttonId) {
  const installBtn = document.getElementById(buttonId);
  if (!installBtn) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      alert("Ilova allaqachon o'rnatilgan yoki brauzeringiz o'rnatishni qo'llab-quvvatlamaydi.");
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
  });
}

async function clearAppCache() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    return true;
  } catch (err) {
    console.error('Keshni tozalashda xatolik:', err);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', wireThemeSwitches);