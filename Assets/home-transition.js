(function () {
  var body = document.body;
  var wrapper = document.getElementById('home-transition-wrapper');
  if (!body || !body.classList.contains('home-page') || !wrapper) return;

  var TRANSITION_DURATION = 700;
  var FAILSAFE_DELAY = TRANSITION_DURATION + 150;
  var homeTransitionRunning = false;
  var homeTransitionDestination = null;
  var navigationCommitted = false;
  var navigationFailsafe = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function canonicalPath(pathname) {
    return pathname.replace(/index\.html$/i, '').replace(/\/+$/, '') || '/';
  }

  function completeHomeNavigation() {
    if (navigationCommitted || !homeTransitionDestination) return;
    navigationCommitted = true;
    window.clearTimeout(navigationFailsafe);
    navigationFailsafe = null;
    window.location.assign(homeTransitionDestination);
  }

  function resetRestoredHomepage() {
    window.clearTimeout(navigationFailsafe);
    navigationFailsafe = null;
    homeTransitionRunning = false;
    homeTransitionDestination = null;
    navigationCommitted = false;
    body.classList.remove('is-transitioning');
    wrapper.classList.remove('home-exit');
  }

  wrapper.addEventListener('animationend', function (event) {
    if (!homeTransitionRunning || event.target !== wrapper) return;
    if (event.animationName !== 'tetonHomeExit' && event.animationName !== 'tetonHomeExitMobile') return;
    completeHomeNavigation();
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
    if (homeTransitionRunning) return;

    homeTransitionRunning = true;
    homeTransitionDestination = destination.href;
    navigationCommitted = false;

    try {
      window.sessionStorage.setItem('tetonHomeTransition', 'true');
    } catch (error) {
      // Storage can be unavailable in strict privacy modes; navigation remains atomic.
    }

    if (reducedMotion.matches) {
      completeHomeNavigation();
      return;
    }

    body.classList.add('is-transitioning');
    wrapper.classList.add('home-exit');
    navigationFailsafe = window.setTimeout(completeHomeNavigation, FAILSAFE_DELAY);
  });

  window.addEventListener('pageshow', function () {
    // A pageshow after navigation (including BFCache restoration) is a genuine
    // new presentation. Never reset a still-running, uncommitted exit.
    if (homeTransitionRunning && !navigationCommitted) return;
    resetRestoredHomepage();
  });
})();
