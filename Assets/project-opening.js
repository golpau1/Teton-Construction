(function () {
  var desktopOnly = window.matchMedia('(min-width: 1024px)');
  var root = document.documentElement;
  var incoming = null;

  try {
    var stored = window.sessionStorage.getItem('tetonProjectTransition');
    if (stored) {
      window.sessionStorage.removeItem('tetonProjectTransition');
      incoming = JSON.parse(stored);
      if (!desktopOnly.matches) incoming = null;
    }
  } catch (error) {
    incoming = null;
  }

  if (incoming) root.classList.add('project-transition-pending');

  function absoluteUrl(value) {
    try { return new URL(value, window.location.href).href; }
    catch (error) { return value || ''; }
  }

  function setUpProjectsPage() {
    var projectsGrid = document.querySelector('.legacy-projects-grid');
    if (!projectsGrid) return;

    projectsGrid.addEventListener('click', function (event) {
      if (!desktopOnly.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
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
      var destination = link.href;
      var navigated = false;

      clone.classList.add('project-transition-image');
      clone.removeAttribute('loading');
      Object.assign(clone.style, {
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        objectFit: styles.objectFit || 'cover',
        objectPosition: styles.objectPosition || '50% 50%'
      });
      document.body.appendChild(clone);
      clone.getBoundingClientRect();
      image.style.visibility = 'hidden';
      document.body.classList.add('project-is-opening');

      try {
        window.sessionStorage.setItem('tetonProjectTransition', JSON.stringify({
          project: link.dataset.project || '',
          src: image.currentSrc || image.src,
          objectPosition: styles.objectPosition || '50% 50%'
        }));
      } catch (error) {
        // The outgoing animation remains usable when storage is unavailable.
      }

      function navigate() {
        if (navigated) return;
        navigated = true;
        window.location.assign(destination);
      }

      window.requestAnimationFrame(function () {
        window.setTimeout(navigate, 1100);
        if (typeof clone.animate !== 'function') {
          navigate();
          return;
        }
        var animation = clone.animate([
          { top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', height: rect.height + 'px' },
          { top: '0px', left: '0px', width: '100vw', height: '100vh' }
        ], {
          duration: 850,
          easing: 'cubic-bezier(.93, .035, .35, .815)',
          fill: 'forwards'
        });
        animation.finished.then(navigate).catch(navigate);
      });
    });
  }

  function setUpProjectDestination() {
    if (!incoming) return;
    var hero = document.querySelector('.opening-figure img');
    if (!hero || !incoming.src || document.body.dataset.projectId !== incoming.project) {
      root.classList.remove('project-transition-pending');
      return;
    }

    var overlay = document.createElement('img');
    var started = false;
    var cleaned = false;
    var heroRevealed = false;
    overlay.src = incoming.src;
    overlay.alt = '';
    overlay.className = 'project-transition-image';
    Object.assign(overlay.style, {
      top: '0px',
      left: '0px',
      width: '100vw',
      height: '100vh',
      objectFit: 'cover',
      objectPosition: incoming.objectPosition || '50% 50%'
    });
    document.body.appendChild(overlay);
    hero.style.visibility = 'hidden';
    document.body.classList.add('project-transition-enter');
    root.classList.remove('project-transition-pending');

    function revealHero() {
      if (heroRevealed) return;
      heroRevealed = true;
      hero.style.visibility = 'visible';
    }

    function cleanUp() {
      if (cleaned) return;
      cleaned = true;
      revealHero();
      overlay.remove();
      document.body.classList.remove('project-transition-enter', 'project-transition-ready');
    }

    function startReveal() {
      if (started) return;
      started = true;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          var targetRect = hero.getBoundingClientRect();
          var heroStyles = window.getComputedStyle(hero);
          var sameImage = absoluteUrl(hero.currentSrc || hero.src) === absoluteUrl(incoming.src);
          var endFrame = {
            top: targetRect.top + 'px',
            left: targetRect.left + 'px',
            width: targetRect.width + 'px',
            height: targetRect.height + 'px',
            objectPosition: heroStyles.objectPosition || incoming.objectPosition || '50% 50%',
            opacity: 1
          };
          var frames = [
            { top: '0px', left: '0px', width: '100vw', height: '100vh', opacity: 1 },
            endFrame
          ];

          if (!sameImage) {
            frames = [frames[0], Object.assign({ offset: .82 }, endFrame), Object.assign({}, endFrame, { opacity: 0 })];
            window.setTimeout(revealHero, 615);
          }

          window.setTimeout(cleanUp, 1000);
          if (typeof overlay.animate !== 'function') {
            cleanUp();
            return;
          }
          var animation = overlay.animate(frames, {
            duration: 750,
            easing: 'cubic-bezier(.815, .035, .35, .93)',
            fill: 'forwards'
          });
          window.setTimeout(function () {
            document.body.classList.add('project-transition-ready');
          }, 180);
          animation.finished.then(cleanUp).catch(cleanUp);
        });
      });
    }

    if (hero.complete && overlay.complete) startReveal();
    else {
      overlay.addEventListener('load', startReveal, { once: true });
      hero.addEventListener('load', startReveal, { once: true });
      window.setTimeout(startReveal, 1000);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setUpProjectsPage();
    setUpProjectDestination();
  }, { once: true });
})();
