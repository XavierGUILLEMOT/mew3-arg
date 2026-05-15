(() => {
  'use strict';

  // CONFIG — à ajuster
  const NEXT_EVENT = {
    date: '2026-05-16T19:30:00+02:00'  // SECONDE VAGUE @ Le Papillon Bleu, Nantes - sam. 16.05.2026 19H30 (CEST)
  };
  const NEWSLETTER_ENDPOINT = '/api/newsletter';

  // BURGER MOBILE
  const burger = document.querySelector('.nav__burger');
  const navLinks = document.querySelector('.nav__links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // COUNTDOWN
  const countdownEl = document.getElementById('countdown');
  const pad = n => String(n).padStart(2, '0');
  function updateCountdown() {
    if (!countdownEl) return;
    const diff = new Date(NEXT_EVENT.date) - new Date();
    if (diff <= 0) {
      countdownEl.textContent = 'LIVE NOW';
      countdownEl.style.color = 'var(--accent-2)';
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff / 3600000) % 24);
    const minutes = Math.floor((diff / 60000) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    countdownEl.textContent = `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  if (countdownEl) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // NEWSLETTER
  const form = document.getElementById('newsletter-form');
  const status = document.getElementById('newsletter-status');
  if (form && status) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!email) return;
      status.className = 'newsletter__status';
      status.textContent = '> SENDING...';
      try {
        const res = await fetch(NEWSLETTER_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Network error');
        status.className = 'newsletter__status is-success';
        status.textContent = '> OK. CHECK YOUR INBOX.';
        form.reset();
      } catch (err) {
        status.className = 'newsletter__status is-error';
        status.textContent = '> ERROR. TRY AGAIN LATER.';
        console.error('[newsletter]', err);
      }
    });
  }

  // ACTIVE NAV LINK
  const currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav__links a').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (!href || href.startsWith('http')) return;
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // ARCHIVE FILTER (galerie page)
  const archiveFilter = document.querySelector('.archive-filter');
  if (archiveFilter) {
    const filterBtns = archiveFilter.querySelectorAll('.archive-filter__btn');
    const archiveCards = document.querySelectorAll('.past__grid .past-card');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
        archiveCards.forEach(card => {
          const show = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  // RANDOM GLITCH PULSE
  const glitchable = document.querySelectorAll('.glitch-hover');
  function randomGlitch() {
    if (!glitchable.length) return;
    const el = glitchable[Math.floor(Math.random() * glitchable.length)];
    el.style.animation = 'glitch-anim 0.3s steps(2)';
    setTimeout(() => { el.style.animation = ''; }, 300);
  }
  function scheduleGlitch() {
    const delay = 8000 + Math.random() * 7000;
    setTimeout(() => { randomGlitch(); scheduleGlitch(); }, delay);
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scheduleGlitch();
  }
})();
