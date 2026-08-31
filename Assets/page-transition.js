(function () {
  var shouldReveal = false;
  try {
    shouldReveal = window.sessionStorage.getItem('tetonHomeTransition') === 'true';
    if (shouldReveal) window.sessionStorage.removeItem('tetonHomeTransition');
  } catch (error) {
    shouldReveal = false;
  }
  if (!shouldReveal) return;

  var root = document.documentElement;
  root.classList.add('transition-reveal-pending');

  document.addEventListener('DOMContentLoaded', function () {
    var finished = false;

    function finishReveal() {
      if (finished) return;
      finished = true;
      document.body.removeEventListener('animationend', onRevealEnd);
      root.classList.remove('transition-reveal-pending', 'transition-reveal-active');
    }

    function onRevealEnd(event) {
      if (event.target === document.body && event.animationName === 'tetonDestinationReveal') {
        finishReveal();
      }
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishReveal();
      return;
    }

    document.body.addEventListener('animationend', onRevealEnd);

    root.classList.add('transition-reveal-active');
    root.classList.remove('transition-reveal-pending');
    window.setTimeout(finishReveal, 800);
  }, { once: true });
})();
