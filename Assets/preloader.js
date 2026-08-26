(function () {
  function waitForMedia(element) {
    if (element.tagName === 'VIDEO') {
      if (element.readyState >= 2) return Promise.resolve();
      return new Promise(function (resolve) {
        element.addEventListener('loadeddata', resolve, { once: true });
        element.addEventListener('error', resolve, { once: true });
      });
    }

    if (element.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      element.addEventListener('load', resolve, { once: true });
      element.addEventListener('error', resolve, { once: true });
    });
  }

  var loader = document.querySelector('.site-preloader');
  if (!loader) return;

  var media = Array.from(document.querySelectorAll('img, video'))
    .filter(function (element) {
      return !element.closest('.site-preloader') && element.getAttribute('loading') !== 'lazy';
    });

  window.sitePreloaderFinished = Promise.all([
    Promise.all(media.map(waitForMedia)),
    new Promise(function (resolve) { window.setTimeout(resolve, 300); })
  ]).then(function () {
    loader.classList.add('is-hidden');
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        loader.hidden = true;
        loader.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('site-loading');
        window.dispatchEvent(new CustomEvent('sitepreloader:complete'));
        resolve();
      }, 460);
    });
  });
})();
