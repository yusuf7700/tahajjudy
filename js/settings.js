// ===== TahajjudY — sozlamalar sahifasi =====

// Redirect orqali "Google bilan bog'lash" natijasini tekshirish
auth.getRedirectResult().then((result) => {
  if (result && result.user && !result.user.isAnonymous) {
    // Bog'lash muvaffaqiyatli — sahifa auth holatini yangilash uchun qayta yuklanadi
    window.location.reload();
  }
}).catch((err) => {
  console.error("Bog'lash natijasi xatosi:", err);
});

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  initSettings(user);
});

async function initSettings(user) {
  document.getElementById('nameField').value = user.displayName || '';
  document.getElementById('accountTypeBadge').textContent = user.isAnonymous ? 'Ism bilan' : 'Google';

  const linkRow = document.getElementById('linkGoogleRow');
  if (user.isAnonymous) {
    linkRow.hidden = false;
    wireGoogleLink(user);
  }

  wireNameSave(user);
  wireSignOut();
  wireClearCache();
  wireInstallPrompt('installBtn');
  registerServiceWorker();
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function wireGoogleLink(user) {
  const btn = document.getElementById('linkGoogleBtn');
  const status = document.getElementById('linkStatus');

  btn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    status.textContent = "Bog'lanmoqda...";
    try {
      if (isMobileDevice()) {
        await user.linkWithRedirect(provider);
      } else {
        await user.linkWithPopup(provider);
        window.location.reload();
      }
    } catch (err) {
      console.error("Google bog'lashda xatolik:", err);
      if (err.code === 'auth/credential-already-in-use') {
        status.textContent = "Bu Google hisobi allaqachon boshqa profilga bog'langan.";
      } else {
        status.textContent = "Xatolik yuz berdi. Qaytadan urinib ko'ring.";
      }
    }
  });
}

function wireNameSave(user) {
  const btn = document.getElementById('saveNameBtn');
  const field = document.getElementById('nameField');
  const status = document.getElementById('nameSaveStatus');

  btn.addEventListener('click', async () => {
    const name = field.value.trim();
    if (!name) {
      status.textContent = "Ism bo'sh bo'lmasligi kerak.";
      return;
    }
    status.textContent = 'Saqlanmoqda...';
    try {
      await user.updateProfile({ displayName: name });
      await db.collection('users').doc(user.uid).set({ name }, { merge: true });
      status.textContent = 'Saqlandi ✓';
      setTimeout(() => { status.textContent = ''; }, 2000);
    } catch (err) {
      console.error('Ism saqlashda xatolik:', err);
      status.textContent = 'Xatolik yuz berdi.';
    }
  });
}

function wireClearCache() {
  const btn = document.getElementById('clearCacheBtn');
  const status = document.getElementById('cacheStatus');
  btn.addEventListener('click', async () => {
    status.textContent = 'Tozalanmoqda...';
    const ok = await clearAppCache();
    status.textContent = ok ? "Tozalandi. Sahifa qayta yuklanadi..." : 'Xatolik yuz berdi.';
    if (ok) setTimeout(() => window.location.reload(true), 800);
  });
}

function wireSignOut() {
  const btn = document.getElementById('signOutBtn');
  btn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'index.html';
  });
}
