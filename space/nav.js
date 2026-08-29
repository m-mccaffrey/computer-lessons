// Arrow keys and buttons. The only shared JavaScript on the site; each
// lesson's widgets live at the bottom of its own file.
//
// The computers course next door has an N key that stacks the slides with
// the teacher notes. Here the notes are a separate page, so this file is
// only navigation.

const slides = [...document.querySelectorAll('.slide')];
if (slides.length) {
  const bar = document.querySelector('.bar');
  const count = document.querySelector('.bar .count');

  // The current slide is held here, not read back from the scroll position.
  // Scrolling is smooth, so two quick taps would otherwise both measure the
  // same mid-flight position and jump somewhere neither of them meant.
  let i = 0;

  const show = () => { if (count) count.textContent = `${i + 1} / ${slides.length}`; };

  function go(delta) {
    i = Math.max(0, Math.min(slides.length - 1, i + delta));
    slides[i].scrollIntoView();
    show();
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Widgets own their own keys: a slider being nudged is not a slide change.
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { go(1); e.preventDefault(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { go(-1); e.preventDefault(); }
    else if (e.key === 'Home') { go(-slides.length); e.preventDefault(); }
    else if (e.key === 'End') { go(slides.length); e.preventDefault(); }
  });

  bar.addEventListener('click', (e) => {
    const act = e.target.dataset.go;
    if (act === 'next') go(1);
    if (act === 'prev') go(-1);
  });

  // Catch up with the scroll wheel, once it has stopped moving.
  let settle;
  addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const seen = slides.findIndex((s) => s.getBoundingClientRect().top > -innerHeight / 2);
      if (seen > -1) { i = seen; show(); }
    }, 120);
  }, { passive: true });

  show();
}
