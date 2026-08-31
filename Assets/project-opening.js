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
      var navigated = false;

      function navigate() {
        if (navigated) return;
        navigated = true;
        try { window.sessionStorage.setItem(storageKey, project); }
        catch (error) { /* Navigation still proceeds without the reveal marker. */ }
        window.location.assign(destination);
      }

      document.body.classList.add('project-is-opening');
      window.setTimeout(navigate, 480);

      window.addEventListener('pageshow', function restoreProjectsPage(event) {
        if (!event.persisted) return;
        navigated = false;
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
    window.setTimeout(finishReveal, 750);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setUpProjectsPage();
    setUpProjectDestination();
  }, { once: true });
})();
