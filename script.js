/* ═══════════════════════════════════════════════════════════════
   MakerMind — Waitlist Site v2.0
   Cinematic orchestration: scroll reveals, sticky showcase,
   parallax film loop, modal video, form submission to Formspree.
   ─────────────────────────────────────────────────────────────
   Formspree endpoint: https://formspree.io/f/myklvypr
═══════════════════════════════════════════════════════════════ */

const SIGNUP_API_URL = '/api/signup';


/* ── 1. SCROLL REVEAL ─────────────────────────────────────── */
/* IntersectionObserver-driven; staggers same-parent siblings. */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.revealDelay ?? 0);
      window.setTimeout(() => entry.target.classList.add('is-visible'), delay);
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -64px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => {
  const siblings = Array.from(
    el.parentElement.querySelectorAll(':scope > .reveal')
  );
  const idx = siblings.indexOf(el);
  el.dataset.revealDelay = Math.min(idx * 110, 330);
  revealObserver.observe(el);
});

/* Anything already on screen at load: reveal immediately so the
   page never appears with empty whitespace at the top. */
window.addEventListener('load', () => {
  document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) {
      window.setTimeout(
        () => el.classList.add('is-visible'),
        Number(el.dataset.revealDelay ?? 0)
      );
    }
  });
});


/* ── 2. NAV SCROLL STATE ──────────────────────────────────── */

const nav = document.getElementById('nav');
if (nav) {
  const updateNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 32);
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
}


/* ── 3. STICKY SHOWCASE ───────────────────────────────────── */
/* As each text step enters the viewport center, swap the
   pinned image and update the progress bar. */

(function initShowcase() {
  const steps = document.querySelectorAll('.showcase-step');
  const imgs  = document.querySelectorAll('.showcase-img');
  const fill  = document.querySelector('.progress-fill');
  if (!steps.length || !imgs.length) return;

  const stepCount = steps.length;

  const setActive = (idx) => {
    imgs.forEach((img) => {
      img.classList.toggle('is-active', Number(img.dataset.step) === idx);
    });
    if (fill) {
      fill.style.width = `${((idx + 1) / stepCount) * 100}%`;
    }
  };

  const stepObserver = new IntersectionObserver(
    (entries) => {
      // Pick the entry closest to viewport center
      let bestEntry = null;
      let bestDistance = Infinity;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const r = entry.boundingClientRect;
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - window.innerHeight / 2);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestEntry = entry;
        }
      });
      if (bestEntry) {
        const idx = Number(bestEntry.target.dataset.step);
        setActive(idx);
      }
    },
    {
      threshold: [0.2, 0.4, 0.6, 0.8],
      rootMargin: '-20% 0px -20% 0px',
    }
  );

  steps.forEach((step) => stepObserver.observe(step));

  // Also listen to scroll to keep progress smooth between observer ticks
  const onScroll = () => {
    let activeIdx = 0;
    let bestDist = Infinity;
    steps.forEach((step) => {
      const r = step.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const dist = Math.abs(center - window.innerHeight / 2);
      if (dist < bestDist) {
        bestDist = dist;
        activeIdx = Number(step.dataset.step);
      }
    });
    setActive(activeIdx);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ── 4. FILM MODAL ────────────────────────────────────────── */
/* Click "Watch the Full Film" → open modal, play full video. */

(function initFilmModal() {
  const trigger = document.querySelector('[data-film-play]');
  const modal   = document.getElementById('film-modal');
  const closeBtn = document.querySelector('[data-modal-close]');
  const modalVideo = document.getElementById('film-modal-video');
  const loopVideo  = document.querySelector('[data-film-loop]');

  if (!trigger || !modal || !modalVideo) return;

  const open = () => {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    if (loopVideo) loopVideo.pause();
    modalVideo.currentTime = 0;
    modalVideo.play().catch(() => {/* autoplay may fail, that's fine */});
  };

  const close = () => {
    modal.classList.remove('is-open');
    modalVideo.pause();
    document.body.style.overflow = '';
    if (loopVideo) loopVideo.play().catch(() => {});
    window.setTimeout(() => { modal.hidden = true; }, 400);
  };

  trigger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();


/* ── 5. SMOOTH ANCHOR SCROLL ──────────────────────────────── */
/* Honors the fixed nav offset. */

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '64',
      10
    );
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ── 6. EMAIL FORM SUBMISSION ─────────────────────────────── */

function showSuccessState(form) {
  const successEl = form.querySelector('.email-success');
  const rowEl     = form.querySelector('.email-row');
  const noteEl    = form.querySelector('.email-note');
  const labelEl   = form.querySelector('.email-label');
  const inputFull = form.querySelector('.email-input-full');
  const btn       = form.querySelector('button[type="submit"]');

  if (rowEl)     rowEl.style.display = 'none';
  if (noteEl)    noteEl.style.display = 'none';
  if (labelEl)   labelEl.style.display = 'none';
  if (inputFull) inputFull.style.display = 'none';
  if (btn && !rowEl) btn.style.display = 'none';
  if (successEl) successEl.hidden = false;
}

async function submitEmail(email, source) {
  const res = await fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      email,
      _source: source,
      _subject: `New MakerMind signup — ${source}`,
    }),
  });
  return res.ok;
}

document.querySelectorAll('[data-form]').forEach((form) => {
  const input = form.querySelector('input[type="email"]');
  if (!input) return;

  // Clear validation state on input
  input.addEventListener('input', () => { input.style.borderColor = ''; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    const email  = input.value.trim();
    const source = form.dataset.form ?? 'unknown';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input.style.borderColor = 'var(--accent)';
      input.focus();
      window.setTimeout(() => { input.style.borderColor = ''; }, 2400);
      return;
    }

    const originalLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-label">Sending…</span>';
    submitBtn.disabled = true;

    try {
      const ok = await submitEmail(email, source);
      if (ok) {
        showSuccessState(form);
      } else {
        submitBtn.innerHTML = '<span class="btn-label">Try again</span><span class="btn-arrow">→</span>';
        submitBtn.disabled = false;
      }
    } catch {
      submitBtn.innerHTML = originalLabel;
      submitBtn.disabled = false;
    }
  });
});


/* ── 7. SUBTLE PARALLAX ON HERO MARK ──────────────────────── */
/* Mouse-follow tilt on the animated logo. Just enough to feel alive. */

(function initHeroTilt() {
  const mark = document.querySelector('.hero-mark');
  if (!mark || window.matchMedia('(pointer: coarse)').matches) return;

  const hero = mark.closest('.hero');
  if (!hero) return;

  let raf = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const update = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    mark.style.transform = `perspective(800px) rotateX(${-currentY}deg) rotateY(${currentX}deg)`;
    if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
      raf = requestAnimationFrame(update);
    } else {
      raf = null;
    }
  };

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    targetX = x * 8;   // up to 8 degrees of yaw
    targetY = y * 8;   // up to 8 degrees of pitch
    if (!raf) raf = requestAnimationFrame(update);
  });

  hero.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    if (!raf) raf = requestAnimationFrame(update);
  });
})();
