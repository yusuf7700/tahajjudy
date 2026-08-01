// ===== TahajjudY — sozlamalar sahifasi =====

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
  
    wireNameSave(user);
    wireSignOut();
    wireClearCache();
    wireInstallPrompt('installBtn');
    registerServiceWorker();
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
