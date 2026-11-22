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

  function open(target) {
    strips.forEach((s) => {
      const on = s === target;
      s.toggleAttribute('data-open', on);
      s.querySelector('.strip__plus').setAttribute('aria-expanded', String(on));
      s.querySelector('.strip__open').inert = !on;
    });
  }

  strips.forEach((strip) => {
    strip.addEventListener('click', () => { if (!strip.hasAttribute('data-open')) open(strip); });
  });

  open(strips.find((s) => s.hasAttribute('data-open')) || strips[0]);
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
