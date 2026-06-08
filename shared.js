// ===========================
// NewTemp RP — Shared JS
// ===========================

document.addEventListener('DOMContentLoaded', () => {

  initPageTransition();

  const snapContainer = document.getElementById('snapContainer');

  // ── Nav scroll state (RAF-throttled) ──
  const nav = document.querySelector('nav#nav');
  if (nav) {
    let navTicking = false;
    const scroller = snapContainer || window;
    scroller.addEventListener('scroll', () => {
      if (navTicking) return;
      navTicking = true;
      requestAnimationFrame(() => {
        const top = snapContainer ? snapContainer.scrollTop : window.scrollY;
        nav.classList.toggle('scrolled', top > 60);
        navTicking = false;
      });
    }, { passive: true });
  }

  // ── Active nav link ──
  const raw = window.location.pathname.split('/').pop() || 'index.html';
  const path = (raw === '' || raw === '/') ? 'index.html'
             : raw.includes('.') ? raw
             : raw + '.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // ── Mobile nav ──
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Snap page (index.html) ──
  if (snapContainer) {
    initSnapDots(snapContainer);
    initHGallery(snapContainer);
    initCounters(snapContainer);
  } else {
    // Non-snap pages: regular reveal observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-left').forEach(el => observer.observe(el));
  }

});

// ════════════════════════════════════════
// PAGE TRANSITION (cinematic bar wipe)
// ════════════════════════════════════════
function initPageTransition() {
  const overlay = document.createElement('div');
  overlay.className = 'page-overlay';
  overlay.id = 'pageOverlay';
  for (let i = 0; i < 5; i++) {
    const bar = document.createElement('div');
    bar.className = 'page-overlay-bar';
    overlay.appendChild(bar);
  }
  document.body.appendChild(overlay);

  // Reveal page on load (bars collapse upward)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('is-enter');
      setTimeout(() => {
        overlay.style.pointerEvents = 'none';
        overlay.style.visibility = 'hidden';
        overlay.classList.remove('is-enter');
      }, 900);
    });
  });

  // FIX #1 — Strict URL guard: block protocol-relative (//evil.com) and javascript: URIs.
  // Previously only checked startsWith('http') which allows both attack vectors.
  const EXTERNAL_URL = /^(https?:\/\/|\/\/|javascript:|data:|vbscript:)/i;

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');

    // Skip: empty, external, anchors, mailto, new-tab, or any non-relative URL
    if (!href
      || EXTERNAL_URL.test(href)
      || href.startsWith('#')
      || href.startsWith('mailto')
      || href.startsWith('tel')
      || link.target === '_blank'
    ) return;

    e.preventDefault();
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'all';
    overlay.classList.remove('is-enter');
    overlay.classList.add('is-exit');
    setTimeout(() => { window.location.href = href; }, 580);
  });
}

// ════════════════════════════════════════
// SNAP DOTS + SECTION REVEALS
// ════════════════════════════════════════
function initSnapDots(container) {
  const dots     = document.querySelectorAll('.snap-dot');
  const sections = document.querySelectorAll('.snap-section');
  if (!dots.length || !sections.length) return;

  window._snapActiveIdx = 0;

  // FIX #5 — Track pending reveal timers per section so we can cancel them
  // if the user scrolls away before all animations complete.
  const pendingTimers = new Map(); // section element → [timerIds]

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (sections[i]) {
        container.scrollTo({ top: sections[i].offsetTop, behavior: 'smooth' });
      }
    });
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const section = entry.target;

      if (!entry.isIntersecting) {
        // Section left viewport — cancel any pending reveal timers
        const timers = pendingTimers.get(section);
        if (timers) {
          timers.forEach(id => clearTimeout(id));
          pendingTimers.delete(section);
        }
        return;
      }

      const idx = [...sections].indexOf(section);
      window._snapActiveIdx = idx;

      // Update dots
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));

      // Staggered reveal — store timer IDs so they can be cancelled on early scroll
      const revealEls = section.querySelectorAll('.reveal, .reveal-left');
      const timers = [];
      revealEls.forEach((el, i) => {
        const id = setTimeout(() => el.classList.add('visible'), 80 + i * 80);
        timers.push(id);
      });
      if (timers.length) pendingTimers.set(section, timers);
    });
  }, { root: container, threshold: 0.45 });

  sections.forEach(s => io.observe(s));
}

// ════════════════════════════════════════
// HORIZONTAL GALLERY
// ════════════════════════════════════════
function initHGallery(container) {
  const track   = document.querySelector('.gallery-h-track');
  const prevBtn = document.querySelector('.gallery-prev');
  const nextBtn = document.querySelector('.gallery-next');
  if (!track) return;

  const slides     = [...track.querySelectorAll('.gallery-h-slide')];
  const galSection = document.getElementById('snap-gallery');

  // FIX #4 — Scope bar query to gallery wrapper, not entire document.
  // Previously document.querySelectorAll('.gallery-h-bar') would grab
  // any .gallery-h-bar element anywhere on the page.
  const galWrap = document.querySelector('.gallery-h-wrap');
  const bars    = galWrap ? [...galWrap.querySelectorAll('.gallery-h-bar')] : [];

  const curEl  = document.querySelector('.gallery-h-counter .g-cur');
  const total  = slides.length;
  let current  = 0;
  let autoTimer = null;
  let isGalleryVisible = false;

  // Track gallery section visibility
  if (galSection && container) {
    const visIO = new IntersectionObserver(entries => {
      isGalleryVisible = entries[0].isIntersecting;
      if (isGalleryVisible) startAuto();
      else stopAuto();
    }, { root: container, threshold: 0.8 });
    visIO.observe(galSection);
  }

  function goTo(idx) {
    const prev = current;
    current = ((idx % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides[prev]?.classList.remove('active');
    slides[current].classList.add('active');
    bars.forEach((bar, i) => {
      bar.classList.remove('active', 'done');
      if (i < current) bar.classList.add('done');
      if (i === current) bar.classList.add('active');
    });
    if (curEl) curEl.textContent = String(current + 1).padStart(2, '0');
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  // FIX #7 — Only restart autoplay when gallery is actually visible.
  // Previously startAuto() was called unconditionally, causing the timer
  // to run while gallery was off-screen and arriving mid-cycle on re-entry.
  prevBtn?.addEventListener('click', () => {
    goTo(current - 1);
    if (isGalleryVisible) startAuto();
  });
  nextBtn?.addEventListener('click', () => {
    goTo(current + 1);
    if (isGalleryVisible) startAuto();
  });

  bars.forEach((bar, i) => bar.addEventListener('click', () => {
    goTo(i);
    if (isGalleryVisible) startAuto();
  }));

  // Keyboard arrows (only when gallery is active)
  document.addEventListener('keydown', e => {
    if (!isGalleryVisible) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { goTo(current + 1); startAuto(); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { goTo(current - 1); startAuto(); }
  });

  // Touch swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) {
      goTo(diff > 0 ? current + 1 : current - 1);
      if (isGalleryVisible) startAuto();
    }
  }, { passive: true });

  goTo(0);
  // autoplay starts via IntersectionObserver when gallery becomes visible
}

// ════════════════════════════════════════
// NUMBER COUNTERS
// ════════════════════════════════════════
function initCounters(container) {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const target = parseInt(entry.target.dataset.count, 10);
      if (isNaN(target)) return;
      animateCount(entry.target, target);
      io.unobserve(entry.target);
    });
  }, { root: container, threshold: 0.5 });

  els.forEach(el => io.observe(el));
}

function animateCount(el, end, duration = 1400) {
  const start = performance.now();
  (function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.round(ease * end);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = end;
  })(start);
}
