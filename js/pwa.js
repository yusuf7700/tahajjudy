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

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function wireInstallPrompt(buttonId) {
  const installBtn = document.getElementById(buttonId);
  if (!installBtn) return;

  if (isStandalone()) {
    installBtn.hidden = true;
    return;
  }

  if (isIOS()) {
    // Safari beforeinstallprompt'ni qo'llab-quvvatlamaydi — qo'lda ko'rsatma beramiz
    installBtn.hidden = false;
    installBtn.addEventListener('click', () => showIOSInstallModal());
    return;
  }

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

function showIOSInstallModal() {
  let modal = document.getElementById('iosInstallModal');
  if (modal) { modal.hidden = false; return; }

  modal = document.createElement('div');
  modal.id = 'iosInstallModal';
  modal.className = 'ios-install-overlay';
  modal.innerHTML = `
    <div class="ios-install-card">
      <h3>📲 Ilova sifatida o'rnatish</h3>
      <ol>
        <li>Pastdagi <strong>Ulashish</strong> tugmasini bosing <span class="ios-share-ico">⬆️</span></li>
        <li>Ro'yxatdan <strong>"Bosh ekranga qo'shish"</strong> (Add to Home Screen) ni tanlang</li>
        <li><strong>"Qo'shish"</strong> tugmasini bosing</li>
      </ol>
      <button class="btn-primary" id="iosInstallCloseBtn" style="width:100%;">Tushunarli</button>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('iosInstallCloseBtn').addEventListener('click', () => {
    modal.hidden = true;
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
