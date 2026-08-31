(function () {
  var desktopOnly = window.matchMedia('(min-width: 1024px)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;
  var storageKey = 'tetonProjectWhiteTransition';
  var incomingProject = '';

  try {
    incomingProject = window.sessionStorage.getItem(storageKey) || '';
    if (incomingProject) window.sessionStorage.removeItem(storageKey);
  } catch (error) {
    incomingProject = '';
  }
  if (!desktopOnly.matches || reducedMotion.matches) incomingProject = '';
  if (incomingProject) root.classList.add('project-white-pending');

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
      var image = link.querySelector('.project-opening-image');
      if (!image) return;
      event.preventDefault();

      var rect = image.getBoundingClientRect();
      var styles = window.getComputedStyle(image);
      var clone = image.cloneNode(true);
      var whiteOverlay = document.createElement('div');
      var destination = link.href;
      var project = link.dataset.project || '';
      var navigated = false;

      clone.classList.add('project-transition-image');
      clone.removeAttribute('loading');
      Object.assign(clone.style, {
        top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
        objectFit: styles.objectFit || 'cover',
        objectPosition: styles.objectPosition || '50% 50%'
      });
      whiteOverlay.className = 'project-white-transition';
      whiteOverlay.setAttribute('aria-hidden', 'true');
      document.body.append(whiteOverlay, clone);
      clone.getBoundingClientRect();
      image.style.visibility = 'hidden';
      document.body.classList.add('project-is-opening');

      function navigate() {
        if (navigated) return;
        navigated = true;
        try { window.sessionStorage.setItem(storageKey, project); }
        catch (error) { /* Navigation still proceeds without the reveal marker. */ }
        window.location.assign(destination);
      }

      window.requestAnimationFrame(function () {
        window.setTimeout(navigate, 1050);
        if (typeof clone.animate !== 'function' || typeof whiteOverlay.animate !== 'function') {
          navigate();
          return;
        }
        var liftX = rect.width * .015;
        var liftY = rect.height * .015;
        clone.animate([
          { top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', height: rect.height + 'px', transform: 'translate3d(0,0,0)', opacity: 1 },
          { offset: .18, top: (rect.top - liftY) + 'px', left: (rect.left - liftX) + 'px', width: (rect.width * 1.03) + 'px', height: (rect.height * 1.03) + 'px', transform: 'translate3d(0,0,0)', opacity: 1 },
          { offset: .68, top: '50%', left: '50%', width: (rect.width * .35) + 'px', height: (rect.height * .35) + 'px', transform: 'translate3d(-50%,-50%,0)', opacity: 1 },
          { top: '50%', left: '50%', width: '0px', height: '0px', transform: 'translate3d(-50%,-50%,0)', opacity: 0 }
        ], { duration: 700, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });

        var whiteAnimation = whiteOverlay.animate([
          { transform: 'scale3d(0,0,1)', opacity: 1 },
          { transform: 'scale3d(1,1,1)', opacity: 1 }
        ], { duration: 650, delay: 180, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
        whiteAnimation.finished.then(navigate).catch(navigate);
      });

      window.addEventListener('pageshow', function restoreProjectsPage(event) {
        if (!event.persisted) return;
        image.style.visibility = '';
        document.body.classList.remove('project-is-opening');
        clone.remove();
        whiteOverlay.remove();
        window.removeEventListener('pageshow', restoreProjectsPage);
      });
    });
  }

  function setUpProjectDestination() {
    if (!incomingProject) return;
    if (document.body.dataset.projectId !== incomingProject) {
      root.classList.remove('project-white-pending');
      return;
    }
    var revealOverlay = document.createElement('div');
    var hero = document.querySelector('.opening-figure img');
    var started = false;
    var removed = false;
    revealOverlay.className = 'project-transition-reveal';
    revealOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(revealOverlay);
    root.classList.remove('project-white-pending');

    function removeOverlay() {
      if (removed) return;
      removed = true;
      revealOverlay.remove();
    }
    function startReveal() {
      if (started) return;
      started = true;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          window.setTimeout(removeOverlay, 900);
          if (typeof revealOverlay.animate !== 'function') {
            removeOverlay();
            return;
          }
          var animation = revealOverlay.animate([
            { transform: 'scaleY(1)', opacity: 1 },
            { offset: .88, transform: 'scaleY(.002)', opacity: 1 },
            { transform: 'scaleY(.002)', opacity: 0 }
          ], { duration: 750, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
          animation.finished.then(removeOverlay).catch(removeOverlay);
        });
      });
    }

    if (!hero || (hero.complete && hero.naturalWidth)) window.setTimeout(startReveal, 90);
    else {
      hero.addEventListener('load', startReveal, { once: true });
      hero.addEventListener('error', startReveal, { once: true });
      window.setTimeout(startReveal, 650);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setUpProjectsPage();
    setUpProjectDestination();
  }, { once: true });
})();
