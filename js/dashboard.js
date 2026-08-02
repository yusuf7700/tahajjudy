// ===== TahajjudY — dashboard mantiqi =====
// MUHIM: Vaqt bilan ishlashda har doim mahalliy sana komponentlaridan
// foydalaning (getFullYear/getMonth/getDate), toISOString() EMAS —
// aks holda O'zbekiston vaqti (UTC+5) bilan bir kunlik siljish bo'ladi.

function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayISO(dt);
}

function isoWeekKey(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const onejan = new Date(dt.getFullYear(), 0, 1);
  const week = Math.ceil((((dt - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${dt.getFullYear()}-W${week}`;
}

function pad2(n) { return String(n).padStart(2, '0'); }

let currentUser = null;
const TODAY = todayISO();

function requireAuth() {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    currentUser = user;
    initDashboard(user);
  });
}

async function initDashboard(user) {
  document.getElementById('todayDate').textContent = formatUzDate(TODAY);
  document.getElementById('greetingName').textContent = user.displayName || "do'st";
  renderHijriDate();

  wireChecklistButtons();
  wirePlanControls();
  wireSignOut();
  wireInstallPrompt('installBtn');
  registerServiceWorker();

  await Promise.all([
    loadTodayEntry(),
    loadUserStreak(),
    loadWeeklyStats()
  ]);
}

function formatUzDate(dateStr) {
  const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${d}.${pad2(m)}.${y} — ${days[dt.getDay()]}`;
}

// ===== Bugungi Hijriy sana =====
// Brauzerning o'zidagi Intl API orqali hisoblanadi — internet yoki
// tashqi API kerak emas, shuning uchun darhol va ishonchli ishlaydi.

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' ul-avval", "Rabi' us-soniy",
  'Jumod ul-avval', 'Jumod us-soniy', 'Rajab', "Sha'bon",
  'Ramazon', 'Shavvol', "Zul-qa'da", 'Zul-hijja'
];

function renderHijriDate() {
  const el = document.getElementById('hijriDate');
  const noteEl = document.getElementById('hijriGregorianNote');
  if (!el) return;

  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'numeric', year: 'numeric'
    });
    const parts = fmt.formatToParts(new Date());
    const day = parts.find(p => p.type === 'day').value;
    const monthNum = parseInt(parts.find(p => p.type === 'month').value, 10);
    const year = parts.find(p => p.type === 'year').value;

    el.textContent = `${day} ${HIJRI_MONTHS[monthNum - 1]} ${year}`;
    noteEl.textContent = `Milodiy: ${formatUzDate(TODAY)}`;
  } catch (err) {
    console.error('Hijriy sanani hisoblashda xatolik:', err);
    el.textContent = '—';
    noteEl.textContent = "Hijriy sanani ko'rsatishda xatolik yuz berdi.";
  }
}

function entryRef(dateStr) {
  return db.collection('users').doc(currentUser.uid)
           .collection('entries').doc(dateStr);
}

function userRef() {
  return db.collection('users').doc(currentUser.uid);
}

// ===== Bugungi belgilar =====

async function loadTodayEntry() {
  const snap = await entryRef(TODAY).get();
  const data = snap.exists ? snap.data() : {};
  setToggleState('intention', !!data.intention);
  setToggleState('water', !!data.water);
  setToggleState('prayer', !!data.prayer);
  renderPlan(data.plan || '');
}

function setToggleState(field, isOn) {
  const btn = document.querySelector(`[data-field="${field}"]`);
  if (!btn) return;
  btn.classList.toggle('is-active', isOn);
  btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
}

function wireChecklistButtons() {
  document.querySelectorAll('.toggle-btn[data-field]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const nowOn = !btn.classList.contains('is-active');
      setToggleState(field, nowOn); // darhol, kutmasdan

      // Firestore'ga yozish fonda ketadi — interfeys bloklanmaydi
      entryRef(TODAY).set({
        [field]: nowOn,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch((err) => console.error('Saqlashda xatolik:', err));

      if (field === 'prayer') {
        updateStreak(nowOn).then(loadWeeklyStats);
      } else {
        loadWeeklyStats();
      }
    });
  });
}

// ===== Ertangi reja: ko'rish / tahrirlash / o'chirish =====

function renderPlan(planText) {
  const viewMode = document.getElementById('planViewMode');
  const editMode = document.getElementById('planEditMode');
  const textEl = document.getElementById('planText');
  const fieldEl = document.getElementById('planField');
  const cancelBtn = document.getElementById('planCancelBtn');

  if (planText) {
    textEl.textContent = planText;
    viewMode.hidden = false;
    editMode.hidden = true;
  } else {
    fieldEl.value = '';
    viewMode.hidden = true;
    editMode.hidden = false;
    cancelBtn.hidden = true;
  }
}

function wirePlanControls() {
  const fieldEl = document.getElementById('planField');
  const saveBtn = document.getElementById('planSaveBtn');
  const cancelBtn = document.getElementById('planCancelBtn');
  const editBtn = document.getElementById('planEditBtn');
  const deleteBtn = document.getElementById('planDeleteBtn');
  const viewMode = document.getElementById('planViewMode');
  const editMode = document.getElementById('planEditMode');

  saveBtn.addEventListener('click', () => {
    const value = fieldEl.value.trim();
    if (!value) return;
    renderPlan(value); // darhol ko'rsatiladi
    entryRef(TODAY).set({ plan: value }, { merge: true })
      .catch((err) => console.error('Reja saqlashda xatolik:', err));
  });

  editBtn.addEventListener('click', () => {
    fieldEl.value = document.getElementById('planText').textContent;
    viewMode.hidden = true;
    editMode.hidden = false;
    cancelBtn.hidden = false;
  });

  cancelBtn.addEventListener('click', () => {
    const existingText = document.getElementById('planText').textContent;
    viewMode.hidden = false;
    editMode.hidden = true;
    fieldEl.value = existingText;
  });

  deleteBtn.addEventListener('click', () => {
    if (!confirm("Ertangi rejani o'chirmoqchimisiz?")) return;
    renderPlan('');
    entryRef(TODAY).set({ plan: '' }, { merge: true })
      .catch((err) => console.error("Reja o'chirishda xatolik:", err));
  });
}

// ===== Streak =====

async function loadUserStreak() {
  const snap = await userRef().get();
  const data = snap.exists ? snap.data() : { streak: 0 };
  document.getElementById('streakNum').textContent = data.streak || 0;
  document.getElementById('longestStreakNum').textContent = data.longestStreak || 0;
}

async function updateStreak(prayerNowOn) {
  const snap = await userRef().get();
  const data = snap.exists ? snap.data() : {};
  let streak = data.streak || 0;
  const lastDate = data.lastCompletedDate || null;
  const yesterday = addDays(TODAY, -1);
  const dayBeforeYesterday = addDays(TODAY, -2);
  const thisWeek = isoWeekKey(TODAY);

  if (!prayerNowOn) {
    if (lastDate === TODAY) {
      streak = Math.max(0, streak - 1);
      await userRef().set({ streak, lastCompletedDate: yesterday }, { merge: true });
      document.getElementById('streakNum').textContent = streak;
    }
    return;
  }

  if (lastDate === TODAY) {
    return;
  } else if (lastDate === yesterday) {
    streak += 1;
  } else if (lastDate === dayBeforeYesterday && data.freezeUsedWeek !== thisWeek) {
    streak += 1;
    await userRef().set({ freezeUsedWeek: thisWeek }, { merge: true });
  } else {
    streak = 1;
  }

  const longest = Math.max(streak, data.longestStreak || 0);
  await userRef().set({ streak, longestStreak: longest, lastCompletedDate: TODAY }, { merge: true });

  document.getElementById('streakNum').textContent = streak;
  document.getElementById('longestStreakNum').textContent = longest;
}

// ===== Haftalik statistika =====

async function loadWeeklyStats() {
  const labels = ['Du','Se','Cho','Pa','Ju','Sha','Ya'];
  const dates = [];
  for (let i = 6; i >= 0; i--) dates.push(addDays(TODAY, -i));

  // 7 ta alohida so'rov o'rniga BITTA so'rov — tezroq yuklanadi
  const snap = await db.collection('users').doc(currentUser.uid)
    .collection('entries')
    .where(firebase.firestore.FieldPath.documentId(), 'in', dates)
    .get();

  const dataByDate = {};
  snap.forEach((doc) => { dataByDate[doc.id] = doc.data(); });

  const bars = document.getElementById('barsContainer');
  bars.innerHTML = dates.map((d) => {
    const data = dataByDate[d] || {};
    const done = [data.intention, data.water, data.prayer].filter(Boolean).length;
    const pct = Math.round((done / 3) * 100);
    const isToday = d === TODAY;
    const dow = new Date(d).getDay();
    return `
      <div class="bar-col${isToday ? ' today' : ''}">
        <div class="bar" style="height:${Math.max(pct, 4)}%"></div>
        <span class="bar-day">${labels[(dow + 6) % 7] || ''}</span>
      </div>`;
  }).join('');
}

function wireSignOut() {
  const btn = document.getElementById('signOutBtn');
  if (btn) {
    btn.addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'index.html';
    });
  }
}

requireAuth();
