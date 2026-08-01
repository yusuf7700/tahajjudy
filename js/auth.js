// ===== TahajjudY — autentifikatsiya =====
// Eslatma: Google kirish uchun har doim "redirect" oqimi ishlatiladi
// (popup emas). Popup usuli Vercel kabi hostinglarda brauzerning
// xavfsizlik siyosati (Cross-Origin-Opener-Policy) tufayli ba'zan
// muvaffaqiyatsiz tugab, foydalanuvchini yana login sahifasiga
// qaytarib yuborar edi — redirect bunday muammoni butunlay oldini oladi.

function isLoginPage() {
  const path = window.location.pathname;
  return path.endsWith('index.html') || path.endsWith('/') || path === '';
}

async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  setAuthStatus('Google sahifasiga yo\u2018naltirilmoqda...');
  try {
    await auth.signInWithRedirect(provider);
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

// Google redirect'dan qaytgandan keyin natijani tekshirish.
// Bu promise onAuthStateChanged'dan OLDIN yozilishi kerak, aks holda
// ba'zan race-condition tufayli foydalanuvchi login sahifasida qolib ketadi.
let redirectHandled = false;

auth.getRedirectResult().then((result) => {
  redirectHandled = true;
  if (result && result.user) {
    window.location.href = 'dashboard.html';
  }
}).catch((err) => {
  redirectHandled = true;
  console.error('Redirect natijasi xatosi:', err);
  if (err && err.code) {
    setAuthStatus("Kirishda xatolik: " + err.code);
  }
});

// Agar foydalanuvchi allaqachon kirgan bo'lsa, to'g'ridan-to'g'ri dashboard'ga.
// redirectHandled tekshiruvi shu yerda kerak emas — onAuthStateChanged
// getRedirectResult tugaganidan keyin ham to'g'ri ishlaydi, chunki Firebase
// SDK ikkalasini ham bir xil auth holatidan oladi.
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
