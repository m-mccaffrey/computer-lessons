// Arrow keys and buttons. N stacks the slides with the notes showing.
// This is the only JavaScript on the site. Keep it that way.

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
    if (document.body.classList.contains('reading')) return;
    i = Math.max(0, Math.min(slides.length - 1, i + delta));
    slides[i].scrollIntoView();
    show();
  }

  function reading() {
    const on = document.body.classList.toggle('reading');
    document.documentElement.classList.toggle('reading', on);
    if (!on) slides[i].scrollIntoView();
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { go(1); e.preventDefault(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { go(-1); e.preventDefault(); }
    else if (e.key === 'Home') { go(-slides.length); e.preventDefault(); }
    else if (e.key === 'End') { go(slides.length); e.preventDefault(); }
    else if (e.key === 'n' || e.key === 'N') reading();
  });

  bar.addEventListener('click', (e) => {
    const act = e.target.dataset.go;
    if (act === 'next') go(1);
    if (act === 'prev') go(-1);
    if (act === 'notes') reading();
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
