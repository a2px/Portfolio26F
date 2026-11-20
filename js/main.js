// Accordion: one card open at a time. A mouse opens a card by hovering it;
// touch and keyboard open it with a tap / Enter. No auto-advance.
(function () {
  const strips = Array.from(document.querySelectorAll('.strip'));

  // Split each headline into words and letters so they can reveal in sequence.
  strips.forEach((strip) => {
    const title = strip.querySelector('[data-split]');
    if (!title) return;
    let wi = 0, ci = 0;
    const out = document.createDocumentFragment();
    title.childNodes.forEach((node) => {
      if (node.nodeName === 'BR') { out.appendChild(document.createElement('br')); return; }
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'w';
        w.style.setProperty('--wi', wi++);
        for (const ch of part) {
          const c = document.createElement('span');
          c.className = 'c';
          c.style.setProperty('--ci', ci++);
          c.textContent = ch;
          w.appendChild(c);
        }
        out.appendChild(w);
      });
    });
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    title.textContent = '';
    title.appendChild(out);
    strip.style.setProperty('--cn', ci);
  });

  function open(target) {
    strips.forEach((s) => {
      const on = s === target;
      s.toggleAttribute('data-open', on);
      s.querySelector('.strip__trigger').setAttribute('aria-expanded', String(on));
      s.querySelector('.strip__open').inert = !on;
    });
  }

  strips.forEach((strip) => {
    strip.querySelector('.strip__trigger').addEventListener('click', () => open(strip));
    strip.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && !strip.hasAttribute('data-open')) open(strip);
    });
  });

  // "Explore my work" opens the first project instead of jumping the page.
  document.querySelectorAll('[data-goto]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const next = strips[Number(link.dataset.goto)];
      open(next);
      next.querySelector('.strip__trigger').focus({ preventScroll: true });
      if (matchMedia('(max-width: 760px)').matches) {
        setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
      }
    });
  });

  open(strips.find((s) => s.hasAttribute('data-open')) || strips[0]);
})();
