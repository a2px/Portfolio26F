// Loading screen: stays up until the fonts and the first photo are ready (or 5s at most),
// then fades out. Shown once per visit; the head script skips it on later pages.
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const hero = document.querySelector('img[fetchpriority="high"]');
  const heroReady = hero && !hero.complete
    ? new Promise((r) => { hero.addEventListener('load', r, { once: true }); hero.addEventListener('error', r, { once: true }); })
    : Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, 5000));
  Promise.race([Promise.all([document.fonts.ready, heroReady]), timeout]).then(() => {
    try { sessionStorage.setItem('p26-loaded', '1'); } catch (e) {}
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 400);
  });
})();

// Accordion: one card open at a time, opened by clicking anywhere on a closed card
// (the plus is the keyboard-focusable button for the same thing).
// Not opened on hover: a card growing under the mouse shifts the others,
// which would put a new card under the pointer and set off a chain of opens.
(function () {
  const strips = Array.from(document.querySelectorAll('.strip'));

  // Card videos (the old portfolio's screen recordings, trimmed to start after their fade-in):
  // phones get a smaller copy. Each loads the first time its card is hovered, focused or opened,
  // and once the page has settled the rest load quietly one by one in card order, so opening a
  // card usually plays at once. Skipped on data-saver or very slow connections. Plays only while
  // its card is open; with reduced motion the still frame stays.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 760px)').matches;
  function loadVideo(s) {
    const v = s.querySelector('video[data-card-mp4]');
    if (!v || v.dataset.loaded) return v;
    v.dataset.loaded = '1';
    v.src = small && v.dataset.cardMp4Sm ? v.dataset.cardMp4Sm : v.dataset.cardMp4;
    v.preload = 'auto';
    v.load();
    return v;
  }
  function syncVideo(s, on) {
    if (still) return;
    const v = on ? loadVideo(s) : s.querySelector('video[data-card-mp4]');
    if (!v) return;
    if (on) v.play().catch(() => {}); else v.pause();
  }
  function prefetchAll() {
    const c = navigator.connection;
    if (still || (c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || '')))) return;
    const queue = strips.filter((s) => s.querySelector('video[data-card-mp4]'));
    (function next() {
      const s = queue.shift();
      if (!s) return;
      const v = loadVideo(s);
      if (!v || v.readyState >= 4) { next(); return; }
      let moved = false;
      const go = () => { if (!moved) { moved = true; next(); } };
      v.addEventListener('canplaythrough', go, { once: true });
      v.addEventListener('error', go, { once: true });
      setTimeout(go, 6000);
    })();
  }
  window.addEventListener('load', () => {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
    setTimeout(() => idle(prefetchAll), 800);
  });

  function open(target) {
    strips.forEach((s) => {
      const on = s === target;
      s.toggleAttribute('data-open', on);
      s.querySelector('.strip__plus').setAttribute('aria-expanded', String(on));
      s.querySelector('.strip__open').inert = !on;
      syncVideo(s, on);
    });
  }
  strips.forEach((s) => {
    s.addEventListener('pointerenter', () => { if (!still) loadVideo(s); });
    s.addEventListener('focusin', () => { if (!still) loadVideo(s); });
  });

  // Phones: no accordion, every card is shown open and stacked. Each video plays while its card
  // is on screen. Wider screens go back to one open card at a time.
  const phone = window.matchMedia('(max-width: 760px)');
  let lastOpen = strips.find((s) => s.hasAttribute('data-open')) || strips[0];
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (phone.matches) syncVideo(e.target, e.isIntersecting); });
  }, { threshold: 0.35 });
  function applyMode() {
    if (phone.matches) {
      strips.forEach((s) => {
        s.setAttribute('data-open', '');
        s.querySelector('.strip__plus').setAttribute('aria-expanded', 'true');
        s.querySelector('.strip__open').inert = false;
        seen.observe(s);
      });
    } else {
      strips.forEach((s) => seen.unobserve(s));
      open(lastOpen);
    }
  }

  // Clicking a closed card opens it. Clicking an open card goes to its case study (the same place
  // as its button); Cmd/Ctrl-click or middle-click opens it in a new tab. Cards without a button
  // (the introduction) stay put. On phones every card is open, so a tap goes straight there.
  function goTo(strip, e) {
    const link = strip.querySelector('.strip__content a.cta');
    if (!link || e.target.closest('a, button')) return;
    if (e.metaKey || e.ctrlKey || e.button === 1 || link.target === '_blank') window.open(link.href, '_blank', 'noopener');
    else window.location.href = link.href;
  }
  strips.forEach((strip) => {
    strip.addEventListener('click', (e) => {
      if (phone.matches || strip.hasAttribute('data-open')) { goTo(strip, e); return; }
      lastOpen = strip; open(strip);
    });
    strip.addEventListener('auxclick', (e) => { if (e.button === 1 && (phone.matches || strip.hasAttribute('data-open'))) goTo(strip, e); });
  });

  applyMode();
  phone.addEventListener('change', applyMode);
})();

// Open project cards (desktop and mid-size): the pale blue band and screenshot end just above
// the title block, however many lines the title and description take at this width.
(function () {
  const shots = Array.from(document.querySelectorAll('.strip--shot, .strip--portrait'));
  if (!shots.length) return;
  const GAP = 28;
  function fit() {
    const desktop = window.innerWidth > 760;
    shots.forEach((s) => {
      // the intro photo only stacks above its text on small laptops and tablets
      const portraitSide = s.classList.contains('strip--portrait') && window.innerWidth > 1200;
      if (!desktop || portraitSide) { s.style.removeProperty('--band'); return; }
      const content = s.querySelector('.strip__content');
      const open = s.querySelector('.strip__open');
      const padB = parseFloat(getComputedStyle(open).paddingBottom) || 0;
      const band = s.clientHeight - content.offsetHeight - padB - GAP;
      s.style.setProperty('--band', Math.max(band, s.clientHeight * 0.35) + 'px');
    });
  }
  fit();
  if (document.fonts) document.fonts.ready.then(fit);
  window.addEventListener('resize', fit);
})();

// Phone menu: the burger shows the three pages and Get in touch.
(function () {
  const burger = document.querySelector('.nav__burger');
  const menu = document.getElementById('menu');
  function setOpen(on) {
    menu.hidden = !on;
    burger.setAttribute('aria-expanded', String(on));
    burger.setAttribute('aria-label', on ? 'Close menu' : 'Menu');
  }
  burger.addEventListener('click', () => setOpen(menu.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); burger.focus(); } });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !burger.contains(e.target)) setOpen(false);
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
})();

// Case study videos: load and play only once they scroll into view (saves data on arrival);
// with reduced motion they stay on their still poster.
(function () {
  const videos = document.querySelectorAll('video[data-src-mp4]');
  if (!videos.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function start(v) {
    if (v.dataset.loaded) { v.play().catch(() => {}); return; }
    v.dataset.loaded = '1';
    [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(([k, type]) => {
      const src = v.dataset['src' + k[0].toUpperCase() + k.slice(1)];
      if (!src) return;
      const s = document.createElement('source'); s.src = src; s.type = type; v.appendChild(s);
    });
    v.load(); v.play().catch(() => {});
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) start(e.target); else e.target.pause(); });
  }, { rootMargin: '200px 0px' });
  videos.forEach((v) => io.observe(v));
})();

// Case study pages: the section pill for the part of the story on screen fills with colour.
(function () {
  const links = Array.from(document.querySelectorAll('.cs-nav__link'));
  if (!links.length) return;
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const sections = Array.from(byId.keys()).map((id) => document.getElementById(id)).filter(Boolean);
  let last = null;
  function update() {
    const line = window.innerHeight * 0.3;
    let current = sections[0];
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s; });
    if (current === last) return;
    last = current;
    links.forEach((a) => a.classList.toggle('is-current', byId.get(current.id) === a));
    const active = byId.get(current.id);
    const bar = active.closest('ul');
    // Phone/tablet row: bring the current pill to the left edge (the first one sits flush left)
    if (bar && bar.scrollWidth > bar.clientWidth) {
      const x = active.getBoundingClientRect().left - bar.getBoundingClientRect().left + bar.scrollLeft;
      bar.scrollTo({ left: Math.max(0, x), behavior: 'smooth' });
    }
  }
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); } }, { passive: true });
  update();
})();

// Client logos: three-and-four split whenever all seven won't fit on one line.
(function () {
  const grid = document.querySelector('.logos__grid');
  if (!grid) return;
  const items = Array.from(grid.children);
  function check() {
    const tile = parseFloat(getComputedStyle(grid).getPropertyValue('--tile')) || 64;
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 8;
    const need = items.length * tile + (items.length - 1) * gap;
    grid.classList.toggle('is-split', grid.clientWidth < need - 0.5);
  }
  new ResizeObserver(check).observe(grid);
  check();
})();
