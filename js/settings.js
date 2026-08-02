// ===== TahajjudY — sozlamalar sahifasi =====

// Redirect orqali "Google bilan bog'lash" natijasini tekshirish
auth.getRedirectResult().then((result) => {
  if (result && result.user && !result.user.isAnonymous) {
    updateAccountUI(result.user);
    const status = document.getElementById('linkStatus');
    if (status) status.textContent = "Bog'landi ✓";
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
  updateAccountUI(user);

  wireNameSave(user);
  wireSignOut();
  wireClearCache();
  wireDonateCopy();
  wireInstallPrompt('installBtn');
  registerServiceWorker();
}

function wireDonateCopy() {
  const card = document.getElementById('donateCard');
  const status = document.getElementById('donateStatus');
  if (!card) return;

  card.addEventListener('click', async () => {
    const raw = document.getElementById('donateNumber').textContent.replace(/\s/g, '');
    try {
      await navigator.clipboard.writeText(raw);
      status.textContent = 'Nusxalandi ✓';
    } catch (err) {
      console.error('Nusxalashda xatolik:', err);
      status.textContent = "Nusxalab bo'lmadi, qo'lda yozib oling.";
    }
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
}

function updateAccountUI(user) {
  const badge = document.getElementById('accountTypeBadge');
  const linkRow = document.getElementById('linkGoogleRow');
  const linkBtn = document.getElementById('linkGoogleBtn');

  if (user.isAnonymous) {
    badge.textContent = 'Ism bilan';
    linkRow.hidden = false;
    linkBtn.textContent = "Bog'lash";
    linkBtn.disabled = false;
    wireGoogleLink(user);
  } else {
    badge.textContent = 'Google';
    // Bog'langanini doimiy ko'rsatib turamiz (yashirmaymiz)
    linkRow.hidden = false;
    linkBtn.textContent = "✓ Bog'langan";
    linkBtn.disabled = true;
  }
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

let googleLinkWired = false;

function wireGoogleLink(user) {
  if (googleLinkWired) return;
  googleLinkWired = true;

  const btn = document.getElementById('linkGoogleBtn');
  const status = document.getElementById('linkStatus');

  btn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    status.textContent = "Bog'lanmoqda...";
    btn.disabled = true;
    try {
      if (isMobileDevice()) {
        await user.linkWithRedirect(provider);
      } else {
        const result = await user.linkWithPopup(provider);
        status.textContent = "Bog'landi ✓";
        updateAccountUI(result.user);
      }
    } catch (err) {
      console.error("Google bog'lashda xatolik:", err);
      btn.disabled = false;
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
