// ===== TahajjudY — autentifikatsiya =====

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  
  function isLoginPage() {
    const path = window.location.pathname;
    return path.endsWith('index.html') || path.endsWith('/') || path === '';
  }
  
  async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    setAuthStatus('Kirilmoqda...');
  
    try {
      if (isMobileDevice()) {
        await auth.signInWithRedirect(provider);
      } else {
        await auth.signInWithPopup(provider);
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      console.error('Google kirish xatosi:', err);
      setAuthStatus("Kirishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    }
  }
  
  async function continueWithName() {
    const nameField = document.getElementById('guestNameField');
    const name = (nameField?.value || '').trim();
  
    if (!name) {
      setAuthStatus('Iltimos, ismingizni kiriting.');
      nameField?.focus();
      return;
    }
  
    setAuthStatus('Kirilmoqda...');
    try {
      const cred = await auth.signInAnonymously();
      await cred.user.updateProfile({ displayName: name });
      await db.collection('users').doc(cred.user.uid).set({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Anonim kirish xatosi:', err);
      setAuthStatus("Kirishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    }
  }
  
  function setAuthStatus(text) {
    const el = document.getElementById('authStatus');
    if (el) el.textContent = text;
  }
  
  auth.getRedirectResult().then((result) => {
    if (result.user) {
      window.location.href = 'dashboard.html';
    }
  }).catch((err) => {
    console.error('Redirect natijasi xatosi:', err);
  });
  
  auth.onAuthStateChanged((user) => {
    if (user && isLoginPage()) {
      window.location.href = 'dashboard.html';
    }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('googleSignInBtn');
    const guestBtn = document.getElementById('guestSignInBtn');
    const nameField = document.getElementById('guestNameField');
  
    if (googleBtn) googleBtn.addEventListener('click', signInWithGoogle);
    if (guestBtn) guestBtn.addEventListener('click', continueWithName);
    if (nameField) {
      nameField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') continueWithName();
      });
    }
  });