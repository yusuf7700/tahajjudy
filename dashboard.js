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
  let scheduledTimers = [];
  
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
    document.getElementById('greetingName').textContent = user.displayName || 'do\u2019st';
  
    wireChecklistButtons();
    wirePlanField();
    wireSignOut();
    wireSettingsFields();
    wireInstallPrompt();
    registerServiceWorker();
  
    await loadTodayEntry();
    await loadUserStreak();
    await loadWeeklyStats();
    await loadSettings();
    await loadTahajjudTime();
  }
  
  function formatUzDate(dateStr) {
    const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return `${d}.${pad2(m)}.${y} — ${days[dt.getDay()]}`;
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
    document.getElementById('planField').value = data.plan || '';
  }
  
  function setToggleState(field, isOn) {
    const btn = document.querySelector(`[data-field="${field}"]`);
    if (!btn) return;
    btn.classList.toggle('is-active', isOn);
    btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  }
  
  function wireChecklistButtons() {
    document.querySelectorAll('.toggle-btn[data-field]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const field = btn.dataset.field;
        const nowOn = !btn.classList.contains('is-active');
        setToggleState(field, nowOn);
  
        await entryRef(TODAY).set({
          [field]: nowOn,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
  
        if (field === 'prayer') {
          await updateStreak(nowOn);
          await loadWeeklyStats();
        }
      });
    });
  }
  
  function wirePlanField() {
    const field = document.getElementById('planField');
    let debounceTimer;
    field.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        await entryRef(TODAY).set({ plan: field.value }, { merge: true });
      }, 600);
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
  
    const results = await Promise.all(dates.map(d => entryRef(d).get()));
    const bars = document.getElementById('barsContainer');
    bars.innerHTML = results.map((snap, i) => {
      const data = snap.exists ? snap.data() : {};
      const done = [data.intention, data.water, data.prayer].filter(Boolean).length;
      const pct = Math.round((done / 3) * 100);
      const isToday = dates[i] === TODAY;
      const dow = new Date(dates[i]).getDay();
      return `
        <div class="bar-col${isToday ? ' today' : ''}">
          <div class="bar" style="height:${Math.max(pct, 4)}%"></div>
          <span class="bar-day">${labels[(dow + 6) % 7] || ''}</span>
        </div>`;
    }).join('');
  }
  
  // ===== Sozlamalar: uxlash eslatmasi va budilnik =====
  
  async function loadSettings() {
    const snap = await userRef().get();
    const settings = (snap.exists && snap.data().settings) || {};
    document.getElementById('sleepReminderTime').value = settings.sleepReminderTime || '22:30';
    document.getElementById('alarmTime').value = settings.alarmTime || '02:30';
    scheduleReminders(settings.sleepReminderTime || '22:30', settings.alarmTime || '02:30');
  }
  
  function wireSettingsFields() {
    const sleepField = document.getElementById('sleepReminderTime');
    const alarmField = document.getElementById('alarmTime');
  
    async function saveSettings() {
      const sleepVal = sleepField.value;
      const alarmVal = alarmField.value;
      await userRef().set({
        settings: { sleepReminderTime: sleepVal, alarmTime: alarmVal }
      }, { merge: true });
      scheduleReminders(sleepVal, alarmVal);
    }
  
    sleepField.addEventListener('change', saveSettings);
    alarmField.addEventListener('change', saveSettings);
  }
  
  function scheduleReminders(sleepTimeStr, alarmTimeStr) {
    scheduledTimers.forEach(t => clearTimeout(t));
    scheduledTimers = [];
  
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  
    scheduledTimers.push(scheduleAt(sleepTimeStr, () => {
      notifyOrAlert('🌙 Uxlash vaqti', 'Ertaga tahajjudga turish uchun hozir yotish payti keldi.');
    }));
  
    scheduledTimers.push(scheduleAt(alarmTimeStr, () => {
      notifyOrAlert('⏰ Budilnik', "Tahajjud vaqti keldi — uyg'onish payti!");
      playAlarmSound();
    }));
  }
  
  function scheduleAt(timeStr, callback) {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;
    return setTimeout(callback, delay);
  }
  
  function notifyOrAlert(title, body) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'icons/icon-192.png' });
    } else {
      console.log(`${title}: ${body}`);
    }
  }
  
  function playAlarmSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (err) {
      console.error('Ovoz ijro etishda xatolik:', err);
    }
  }
  
  // Eslatma: bu eslatmalar faqat ilova/tab ochiq turganda ishlaydi.
  // Yopiq holatda ham ishlashi uchun Firebase Cloud Messaging (FCM)
  // orqali push-bildirishnoma qo'shish keyingi bosqichda amalga oshiriladi.
  
  // ===== Tahajjud vaqti (Aladhan API) =====
  
  async function loadTahajjudTime() {
    const el = document.getElementById('tahajjudTime');
    const noteEl = document.getElementById('tahajjudNote');
    el.textContent = 'Hisoblanmoqda...';
  
    if (!navigator.geolocation) {
      el.textContent = '—';
      noteEl.textContent = 'Brauzeringiz joylashuvni aniqlay olmadi.';
      return;
    }
  
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
  
        const fmt = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
  
        const [todayRes, tomorrowRes] = await Promise.all([
          fetch(`https://api.aladhan.com/v1/timings/${fmt(today)}?latitude=${latitude}&longitude=${longitude}&method=3`).then(r => r.json()),
          fetch(`https://api.aladhan.com/v1/timings/${fmt(tomorrow)}?latitude=${latitude}&longitude=${longitude}&method=3`).then(r => r.json())
        ]);
  
        const maghrib = parseTimeToday(todayRes.data.timings.Maghrib, today);
        const fajrTomorrow = parseTimeToday(tomorrowRes.data.timings.Fajr, tomorrow);
  
        const nightMs = fajrTomorrow - maghrib;
        const lastThirdStart = new Date(fajrTomorrow.getTime() - nightMs / 3);
  
        el.textContent = `${pad2(lastThirdStart.getHours())}:${pad2(lastThirdStart.getMinutes())}`;
        noteEl.textContent = `Kechaning oxirgi uchdan biri — ${pad2(fajrTomorrow.getHours())}:${pad2(fajrTomorrow.getMinutes())} bomdod namozigacha.`;
      } catch (err) {
        console.error('Tahajjud vaqtini hisoblashda xatolik:', err);
        el.textContent = '—';
        noteEl.textContent = 'Vaqtni hisoblashda xatolik yuz berdi. Internetni tekshiring.';
      }
    }, (err) => {
      console.error('Joylashuv xatosi:', err);
      el.textContent = '—';
      noteEl.textContent = "Aniq vaqt uchun joylashuvga ruxsat bering.";
    });
  }
  
  function parseTimeToday(timeStr, baseDate) {
    const [h, m] = timeStr.split(' ')[0].split(':').map(Number);
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m, 0);
  }
  
  // ===== PWA: o'rnatish taklifi =====
  
  let deferredInstallPrompt = null;
  
  function wireInstallPrompt() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;
  
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      installBtn.hidden = false;
    });
  
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.hidden = true;
    });
  
    window.addEventListener('appinstalled', () => {
      installBtn.hidden = true;
    });
  }
  
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => console.error('SW xatosi:', err));
    }
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