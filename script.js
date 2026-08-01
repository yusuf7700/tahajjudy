// ===== TahajjudY landing sahifasi — dinamik render =====

async function loadContent() {
    try {
      const res = await fetch('data/content.json');
      if (!res.ok) throw new Error('content.json topilmadi');
      return await res.json();
    } catch (err) {
      console.error('Kontentni yuklashda xatolik:', err);
      return null;
    }
  }
  
  function renderHero(site) {
    document.getElementById('heroTagline').textContent = site.tagline;
    document.getElementById('heroLead').textContent = site.lead;
  }
  
  function renderSteps(steps) {
    const container = document.getElementById('stepsContainer');
    container.innerHTML = steps.map((s, i) => {
      const isEven = i % 2 === 1; // 2nd, 4th... items flip sides
      const rowClass = isEven ? 'step step-even' : 'step step-odd';
      const dot = `<div class="step-dot">${s.icon}<span class="step-num">${s.num}</span></div>`;
      const card = `
        <div class="step-card">
          <span class="step-time">${s.time}</span>
          <h3>${s.icon} ${s.title}</h3>
          <p>${s.text}</p>
        </div>`;
      const spacer = `<div class="spacer"></div>`;
  
      return isEven
        ? `<div class="${rowClass}">${spacer}${dot}${card}</div>`
        : `<div class="${rowClass}">${card}${dot}${spacer}</div>`;
    }).join('');
  }
  
  function renderFeatures(features) {
    const grid = document.getElementById('featGrid');
    grid.innerHTML = features.map(f => `
      <div class="feat">
        <span class="ico">${f.icon}</span>
        <h3>${f.title}</h3>
        <p>${f.text}</p>
      </div>
    `).join('');
  }
  
  function renderWeeklyStats(stats) {
    document.getElementById('streakNum').textContent = stats.streakCount;
    document.getElementById('freezeNote').textContent = stats.freezeNote;
  
    const bars = document.getElementById('barsContainer');
    bars.innerHTML = stats.days.map(d => `
      <div class="bar-col${d.today ? ' today' : ''}">
        <div class="bar" style="height:${d.value}%"></div>
        <span class="bar-day">${d.label}</span>
      </div>
    `).join('');
  }
  
  function scatterStars(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 4) + 's';
      s.style.width = s.style.height = (1.5 + Math.random() * 2.5) + 'px';
      el.appendChild(s);
    }
  }
  
  (async function init() {
    const data = await loadContent();
    if (data) {
      renderHero(data.site);
      renderSteps(data.steps);
      renderFeatures(data.features);
      renderWeeklyStats(data.weeklyStats);
    }
    scatterStars('starsHero', 40);
    scatterStars('starsStats', 30);
  })();