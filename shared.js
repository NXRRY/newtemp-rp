// ===========================
// NewTemp RP — Shared JS v2.0
// ===========================

document.addEventListener('DOMContentLoaded', () => {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Nav scroll state ──────────────────────────────────
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ── Active nav link ───────────────────────────────────
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // ── Scroll Reveal ─────────────────────────────────────
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => revealObs.observe(el));

  // ── Mobile nav toggle ─────────────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  // ── Skip effects when reduced-motion is requested ─────
  if (reducedMotion) return;

  // ── Scroll Progress Bar ───────────────────────────────
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.prepend(progressBar);
  window.addEventListener('scroll', () => {
    const scrolled = document.documentElement.scrollTop;
    const total    = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    progressBar.style.width = `${(scrolled / total) * 100}%`;
  }, { passive: true });

  // ── Counter Animation ─────────────────────────────────
  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    if (isNaN(end)) return;
    const dur   = 1800;
    const start = performance.now();
    const isInt = Number.isInteger(end);
    (function step(ts) {
      const t    = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = isInt ? Math.round(ease * end) : (ease * end).toFixed(1);
      if (t < 1) requestAnimationFrame(step);
      else        el.textContent = isInt ? end : end.toFixed(1);
    })(start);
  }
  const cntObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.target.hasAttribute('data-count')) {
        countUp(e.target);
        cntObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => cntObs.observe(el));

  // ── 3D Card Tilt + Animated Border ───────────────────
  document.querySelectorAll(
    '.feat-card, .card, .dna-card, .diff-item, .target-card, .culture-card, .role-card, .sys-card'
  ).forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateZ(6px)`;
      el.classList.add('glow-border-active');
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.classList.remove('glow-border-active');
    });
  });

  // ── Custom Cursor (fine-pointer devices only) ─────────
  if (window.matchMedia('(pointer: fine)').matches) {
    const dot  = document.createElement('div'); dot.className  = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = -200, my = -200, rx = -200, ry = -200;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
    }, { passive: true });

    const lerp = (a, b, n) => a + (b - a) * n;
    (function tickRing() {
      rx = lerp(rx, mx, 0.13);
      ry = lerp(ry, my, 0.13);
      ring.style.left = `${rx}px`;
      ring.style.top  = `${ry}px`;
      requestAnimationFrame(tickRing);
    })();

    document.querySelectorAll('a, button, .btn').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }

  // ── Mouse Spotlight ───────────────────────────────────
  const spotlight = document.createElement('div');
  spotlight.className = 'mouse-spotlight';
  document.body.prepend(spotlight);
  document.addEventListener('mousemove', e => {
    spotlight.style.setProperty('--mx', `${e.clientX}px`);
    spotlight.style.setProperty('--my', `${e.clientY}px`);
  }, { passive: true });

});
