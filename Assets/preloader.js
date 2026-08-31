(function () {
  function waitForImage(element) {
    if (element.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      element.addEventListener('load', resolve, { once: true });
      element.addEventListener('error', resolve, { once: true });
    });
  }

  var loader = document.querySelector('.site-preloader');
  if (!loader) return;

  var images = Array.from(document.querySelectorAll('img'))
    .filter(function (element) {
      return !element.closest('.site-preloader') && element.getAttribute('loading') !== 'lazy';
    });
  var heroVideo = document.getElementById('landingVideo');
  var retryTimer;

  function playHeroVideo() {
    if (!heroVideo || document.hidden) return Promise.resolve();

    // Set both the DOM properties and attributes before every attempt. In
    // particular, iOS Safari requires muted inline playback at play() time.
    heroVideo.autoplay = true;
    heroVideo.defaultMuted = true;
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    heroVideo.loop = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.setAttribute('playsinline', '');
    heroVideo.setAttribute('webkit-playsinline', '');

    var result = heroVideo.play();
    return result && typeof result.then === 'function' ? result : Promise.resolve();
  }

  function schedulePlaybackRecovery() {
    if (!heroVideo || document.hidden || retryTimer) return;
    retryTimer = window.setTimeout(function () {
      retryTimer = null;
      playHeroVideo().catch(schedulePlaybackRecovery);
    }, 500);
  }

  function waitForVideoPlayback() {
    if (!heroVideo) return Promise.resolve();

    return new Promise(function (resolve) {
      var resolved = false;

      function finishAfterDecodedFrame() {
        if (resolved || heroVideo.paused || heroVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
        resolved = true;
        if ('requestVideoFrameCallback' in heroVideo) {
          heroVideo.requestVideoFrameCallback(function () { resolve(); });
        } else {
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(resolve);
          });
        }
      }

      function attemptPlayback() {
        if (heroVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
        playHeroVideo().then(finishAfterDecodedFrame).catch(schedulePlaybackRecovery);
      }

      heroVideo.addEventListener('canplay', attemptPlayback);
      heroVideo.addEventListener('playing', finishAfterDecodedFrame);
      heroVideo.addEventListener('progress', attemptPlayback);
      heroVideo.load();
      attemptPlayback();
    });
  }

  if (heroVideo) {
    ['pause', 'stalled', 'suspend', 'waiting'].forEach(function (eventName) {
      heroVideo.addEventListener(eventName, schedulePlaybackRecovery);
    });
    heroVideo.addEventListener('ended', function () {
      heroVideo.currentTime = 0;
      playHeroVideo().catch(schedulePlaybackRecovery);
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) playHeroVideo().catch(schedulePlaybackRecovery);
    });
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (eventName) {
      document.addEventListener(eventName, function () {
        playHeroVideo().catch(schedulePlaybackRecovery);
      }, { passive: true });
    });
  }

  var pageLoaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(function (resolve) { window.addEventListener('load', resolve, { once: true }); });
  var fontsLoaded = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  window.sitePreloaderFinished = Promise.all([
    pageLoaded,
    fontsLoaded,
    Promise.all(images.map(waitForImage)),
    waitForVideoPlayback()
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
