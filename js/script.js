// SoiLink landing page interactions

document.getElementById('year').textContent = new Date().getFullYear();

// Scroll reveal — atomicmail applies one slide-up motif to nearly every
// block on the page, so rather than hand-tagging each element we mark the
// content blocks here and let one observer drive them all.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const AUTO_REVEAL = [
  '.section > .container > .eyebrow',
  '.section > .container > h2',
  '.section > .container > .section-sub',
  '.table-wrap',
  '.arch-step',
  '.shot',
  '.scenario-card',
  '.invest-copy > .eyebrow',
  '.invest-copy > h2',
  '.invest-text',
  '.invest-list li',
  '.invest-form-wrap',
  '.trust-label',
  '.site-footer .footer-inner',
].join(',');

document.querySelectorAll(AUTO_REVEAL).forEach((el) => el.classList.add('reveal'));

// Stagger siblings: each group restarts the index so rows/cards cascade.
document.querySelectorAll('.scenario-cards, .arch-flow, .invest-list, .section > .container, .invest-copy').forEach((group) => {
  let i = 0;
  Array.from(group.children).forEach((child) => {
    if (child.classList.contains('reveal')) {
      child.style.setProperty('--i', i);
      i += 1;
    }
  });
});

const revealEls = document.querySelectorAll('.reveal');

if (prefersReducedMotion) {
  revealEls.forEach((el) => el.classList.add('in-view'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

// Hero icons — subtle cursor parallax
const heroSection = document.querySelector('.hero');
const heroIcons = document.querySelector('.hero-icons');

if (heroSection && heroIcons && !prefersReducedMotion) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let raf = null;

  const animate = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    heroIcons.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      raf = requestAnimationFrame(animate);
    } else {
      raf = null;
    }
  };

  heroSection.addEventListener('mousemove', (event) => {
    const rect = heroSection.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = relX * 24;
    targetY = relY * 24;
    if (!raf) raf = requestAnimationFrame(animate);
  });

  heroSection.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    if (!raf) raf = requestAnimationFrame(animate);
  });
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');

navToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Pitch deck form — submits to Formspree (see action= on the <form>)
const pitchForm = document.getElementById('pitchForm');
const formNote = document.getElementById('formNote');
const submitBtn = pitchForm.querySelector('button[type="submit"]');

pitchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!pitchForm.checkValidity()) {
    pitchForm.reportValidity();
    return;
  }

  submitBtn.disabled = true;
  formNote.textContent = 'Отправка…';

  try {
    const response = await fetch(pitchForm.action, {
      method: 'POST',
      body: new FormData(pitchForm),
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      formNote.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время и вышлем Pitch Deck.';
      pitchForm.reset();
    } else {
      formNote.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам напрямую.';
    }
  } catch (err) {
    formNote.textContent = 'Не удалось отправить заявку — проверьте соединение и попробуйте снова.';
  } finally {
    submitBtn.disabled = false;
  }
});

/* =========================================================
   Creative layer
   ========================================================= */

// Scroll progress bar
const progressBar = document.getElementById('scrollProgress');
if (progressBar) {
  let progressTicking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    progressTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!progressTicking) {
      progressTicking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();
}

// Count-up stats.
// The final value lives in the HTML, so the real numbers are on screen even
// if this never runs (no JS, full-page capture, print). The animation only
// rewinds to zero and plays back up to that value.
const statNums = document.querySelectorAll('[data-count-to]');
if (statNums.length) {
  const fmtStat = (el, n) => {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    // Russian decimal separator is a comma ("$2,4 млрд")
    return prefix + n.toFixed(decimals).replace('.', ',') + suffix;
  };

  const runCount = (el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';

    const target = parseFloat(el.dataset.countTo);
    if (!isFinite(target) || prefersReducedMotion) return; // leave the HTML value as-is

    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo — fast start, gentle landing
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = fmtStat(el, target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = fmtStat(el, 0);
    requestAnimationFrame(step);
  };

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  statNums.forEach((el) => statObserver.observe(el));
}

// Live telemetry — values drift within a plausible band so the hero panel
// reads as a real sensor feed rather than a static mockup.
const teleNums = document.querySelectorAll('[data-tele]');
if (teleNums.length && !prefersReducedMotion) {
  const drift = () => {
    teleNums.forEach((el) => {
      const min = parseFloat(el.dataset.min);
      const max = parseFloat(el.dataset.max);
      const decimals = parseInt(el.dataset.decimals || '1', 10);
      const current = parseFloat(String(el.textContent).replace(',', '.')) || (min + max) / 2;
      // small random walk, clamped to the band
      const next = Math.min(max, Math.max(min, current + (Math.random() - 0.5) * (max - min) * 0.18));
      el.textContent = next.toFixed(decimals).replace('.', ',');

      const bar = el.closest('.tele-cell').querySelector('.tele-bar i');
      if (bar) bar.style.width = `${((next - min) / (max - min)) * 100}%`;
    });
  };
  drift();
  setInterval(drift, 2400);
}

// Sparkline for the 24h telemetry chart
const teleChart = document.querySelector('.tele-chart');
if (teleChart) {
  const w = 240;
  const h = 56;
  const points = 26;
  const vals = [];
  let v = 0.5;
  for (let i = 0; i < points; i++) {
    v = Math.min(0.92, Math.max(0.12, v + (Math.random() - 0.48) * 0.22));
    vals.push(v);
  }
  const coords = vals.map((val, i) => [(i / (points - 1)) * w, h - val * h]);
  // smooth the path with midpoint curves
  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const [px, py] = coords[i - 1];
    const [cx, cy] = coords[i];
    const mx = (px + cx) / 2;
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${((py + cy) / 2).toFixed(1)}`;
  }
  d += ` T ${coords[coords.length - 1][0].toFixed(1)} ${coords[coords.length - 1][1].toFixed(1)}`;

  teleChart.querySelector('.tele-line').setAttribute('d', d);
  teleChart.querySelector('.tele-area').setAttribute('d', `${d} L ${w} ${h} L 0 ${h} Z`);
}

// Cursor glow + subtle 3D tilt on cards
const tiltCards = document.querySelectorAll('.arch-step, .scenario-card');
if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  tiltCards.forEach((card) => {
    card.classList.add('tilt');
    card.addEventListener('mousemove', (event) => {
      const r = card.getBoundingClientRect();
      const px = (event.clientX - r.left) / r.width;
      const py = (event.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      const rx = (0.5 - py) * 6;
      const ry = (px - 0.5) * 6;
      card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// Screenshot placeholders — until the real product screens are dropped into
// assets/, show a labelled placeholder instead of a broken-image icon.
document.querySelectorAll('.shot-frame img').forEach((img) => {
  const markMissing = () => {
    img.closest('.shot-frame').classList.add('is-missing');
    img.removeAttribute('alt');
  };
  img.addEventListener('error', markMissing);
  if (img.complete && img.naturalWidth === 0) markMissing();
});
