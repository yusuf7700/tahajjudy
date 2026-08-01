// ===== TahajjudY — autentifikatsiya =====
// Eslatma: kompyuterda POPUP, mobil qurilmalarda esa REDIRECT ishlatiladi.
// Bu — oldingi loyihalarda (PlannerY va h.k.) sinovdan o'tgan, ishonchli usul.
// Faqat "redirect"ni hamma joyda ishlatish administrator sozlamalariga qarab
// muammo chiqarishi mumkin, shu sabab bu yerda ikkalasi ham qo'llab-quvvatlanadi.

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
      const result = await auth.signInWithPopup(provider);
      if (result && result.user) {
        window.location.href = 'dashboard.html';
      }
    }
  } catch (err) {
    console.error('Google kirish xatosi:', err);
    // Popup bloklangan yoki xato bo'lsa — redirect'ga o'tamiz (zaxira yo'l)
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      try {
        await auth.signInWithRedirect(provider);
        return;
      } catch (err2) {
        console.error('Redirect xatosi:', err2);
      }
    }
    setAuthStatus("Kirishda xatolik: " + (err.code || "noma'lum xato"));
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

// Mobil'da redirect orqali qaytgandan keyin natijani tekshirish
auth.getRedirectResult().then((result) => {
  if (result && result.user) {
    window.location.href = 'dashboard.html';
  }
}).catch((err) => {
  console.error('Redirect natijasi xatosi:', err);
  if (err && err.code) {
    setAuthStatus("Kirishda xatolik: " + err.code);
  }
});

// Agar foydalanuvchi allaqachon kirgan bo'lsa, to'g'ridan-to'g'ri dashboard'ga
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
