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
