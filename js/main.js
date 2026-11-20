// Accordion: one card open at a time, opened only by its plus button.
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
    strip.querySelector('.strip__plus').addEventListener('click', () => open(strip));
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
