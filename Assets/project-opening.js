(function () {
  var desktopOnly = window.matchMedia('(min-width: 1024px)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;
  var storageKey = 'tetonProjectPageTransition';
  var incomingProject = '';

  try {
    incomingProject = window.sessionStorage.getItem(storageKey) || '';
    if (incomingProject) window.sessionStorage.removeItem(storageKey);
  } catch (error) {
    incomingProject = '';
  }

  if (!desktopOnly.matches || reducedMotion.matches) incomingProject = '';
  if (incomingProject) root.classList.add('project-page-reveal-pending');

  function setUpProjectsPage() {
    var projectsGrid = document.querySelector('.legacy-projects-grid');
    if (!projectsGrid) return;

    projectsGrid.addEventListener('click', function (event) {
      if (!desktopOnly.matches || reducedMotion.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = event.target.closest('a.project-opening-link');
      if (!link || !projectsGrid.contains(link)) return;
      if (document.body.classList.contains('project-is-opening')) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      var destination = link.href;
      var project = link.dataset.project || '';
      var image = link.querySelector('.project-opening-image');
      if (!image) {
        window.location.assign(destination);
        return;
      }
      var rect = image.getBoundingClientRect();
      var styles = window.getComputedStyle(image);
      var header = document.querySelector('.site-header');
      var dividerY = header ? header.getBoundingClientRect().bottom : 0;
      var transitionViewport = document.createElement('div');
      var clone = image.cloneNode(true);
      var navigated = false;

      transitionViewport.className = 'project-transition-viewport';
      transitionViewport.style.top = dividerY + 'px';
      transitionViewport.setAttribute('aria-hidden', 'true');
      clone.classList.add('project-slide-image');
      clone.removeAttribute('loading');
      Object.assign(clone.style, {
        top: (rect.top - dividerY) + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        objectFit: styles.objectFit || 'cover',
        objectPosition: styles.objectPosition || '50% 50%'
      });
      transitionViewport.appendChild(clone);
      document.body.appendChild(transitionViewport);
      image.style.visibility = 'hidden';

      function navigate() {
        if (navigated) return;
        navigated = true;
        try { window.sessionStorage.setItem(storageKey, project); }
        catch (error) { /* Navigation still proceeds without the reveal marker. */ }
        window.location.assign(destination);
      }

      document.body.classList.add('project-is-opening');
      window.requestAnimationFrame(function () {
        window.setTimeout(navigate, 730);
        if (typeof clone.animate !== 'function') {
          window.setTimeout(navigate, 480);
          return;
        }
        clone.animate([
          { transform: 'translate3d(0, 0, 0)' },
          { transform: 'translate3d(0, ' + (-(rect.bottom - dividerY + 2)) + 'px, 0)' }
        ], {
          duration: 700,
          easing: 'cubic-bezier(.76, 0, .24, 1)',
          fill: 'forwards'
        });
      });

      window.addEventListener('pageshow', function restoreProjectsPage(event) {
        if (!event.persisted) return;
        navigated = false;
        image.style.visibility = '';
        transitionViewport.remove();
        document.body.classList.remove('project-is-opening');
        window.removeEventListener('pageshow', restoreProjectsPage);
      });
    });
  }

  function setUpProjectDestination() {
    if (!incomingProject) return;
    if (document.body.dataset.projectId !== incomingProject) {
      root.classList.remove('project-page-reveal-pending');
      return;
    }

    var finished = false;
    function finishReveal() {
      if (finished) return;
      finished = true;
      document.body.removeEventListener('animationend', onRevealEnd);
      root.classList.remove('project-page-reveal-pending', 'project-page-reveal-active');
    }
    function onRevealEnd(event) {
      if (event.target === document.body && event.animationName === 'tetonProjectPageReveal') finishReveal();
    }

    document.body.addEventListener('animationend', onRevealEnd);
    root.classList.add('project-page-reveal-active');
    root.classList.remove('project-page-reveal-pending');
    window.setTimeout(finishReveal, 650);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setUpProjectsPage();
    setUpProjectDestination();
  }, { once: true });
})();
