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

// MUHIM: bu tinglovchi skript yuklanishi bilanoq (darhol) ro'yxatdan o'tishi kerak,
// chunki brauzer "beforeinstallprompt" signalini juda erta yuborishi mumkin —
// agar buni faqat wireInstallPrompt() ichida (Firebase auth tekshiruvidan keyin)
// yozsak, signal allaqachon o'tib ketgan bo'lishi mumkin va tugma hech qachon
// avtomatik o'rnatishni taklif qilmaydi.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

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
    installBtn.textContent = "✓ O'rnatilgan";
    installBtn.disabled = true;
    return;
  }

  if (isIOS()) {
    installBtn.addEventListener('click', () => showIOSInstallModal());
    return;
  }

  installBtn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (choice.outcome === 'accepted') {
        installBtn.textContent = "✓ O'rnatilgan";
        installBtn.disabled = true;
      }
    } else {
      showManualInstallModal();
    }
  });

  window.addEventListener('appinstalled', () => {
    installBtn.textContent = "✓ O'rnatilgan";
    installBtn.disabled = true;
  });
}

function showManualInstallModal() {
  let modal = document.getElementById('manualInstallModal');
  if (modal) { modal.hidden = false; return; }

  modal = document.createElement('div');
  modal.id = 'manualInstallModal';
  modal.className = 'ios-install-overlay';
  modal.innerHTML = `
    <div class="ios-install-card">
      <h3>📲 Ilova sifatida o'rnatish</h3>
      <ol>
        <li>Manzil satrining o'ng tomonidagi <strong>⊕</strong> yoki brauzer menyusi (<strong>⋮</strong>) ni bosing</li>
        <li><strong>"Ilova sifatida o'rnatish"</strong> yoki <strong>"Install app"</strong>ni tanlang</li>
      </ol>
      <button class="btn-primary" id="manualInstallCloseBtn" style="width:100%;">Tushunarli</button>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('manualInstallCloseBtn').addEventListener('click', () => {
    modal.hidden = true;
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
