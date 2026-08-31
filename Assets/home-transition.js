(function () {
  var body = document.body;
  var wrapper = document.getElementById('home-transition-wrapper');
  if (!body || !body.classList.contains('home-page') || !wrapper) return;

  var navigationTimer;
  var destinationUrl;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function enterHomepage() {
    window.clearTimeout(navigationTimer);
    navigationTimer = null;
    destinationUrl = null;
    body.classList.remove('is-transitioning');
    wrapper.classList.remove('home-exit', 'home-enter');
    if (reducedMotion.matches) return;
    window.requestAnimationFrame(function () {
      wrapper.classList.add('home-enter');
    });
  }

  function finishNavigation() {
    if (!destinationUrl) return;
    var target = destinationUrl;
    destinationUrl = null;
    window.location.assign(target);
  }

  function canonicalPath(pathname) {
    return pathname.replace(/index\.html$/i, '').replace(/\/+$/, '') || '/';
  }

  wrapper.addEventListener('animationend', function (event) {
    if (event.target !== wrapper) return;
    if (event.animationName === 'tetonHomeEnter') {
      wrapper.classList.remove('home-enter');
    } else if (event.animationName === 'tetonHomeExit') {
      finishNavigation();
    }
  });

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || link.target === '_blank' || link.hasAttribute('download')) return;

    var destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (canonicalPath(destination.pathname) === canonicalPath(window.location.pathname) && !destination.hash) return;

    event.preventDefault();
    if (body.classList.contains('is-transitioning')) return;

    if (reducedMotion.matches) {
      window.location.assign(destination.href);
      return;
    }

    destinationUrl = destination.href;
    body.classList.add('is-transitioning');
    wrapper.classList.remove('home-enter');
    wrapper.classList.add('home-exit');
    navigationTimer = window.setTimeout(finishNavigation, 1050);
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted || body.classList.contains('is-transitioning')) enterHomepage();
  });

  if (reducedMotion.matches) wrapper.classList.remove('home-enter');
})();
