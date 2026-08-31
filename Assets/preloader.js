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
  var isMobileHomepage = Boolean(
    heroVideo && document.body.classList.contains('home-page') &&
    window.matchMedia('(max-width: 700px)').matches
  );

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
      var frameRequested = false;
      var readinessPoll;
      var mobileFallback;

      function completeVideoWait() {
        if (resolved) return;
        resolved = true;
        if (readinessPoll) window.clearInterval(readinessPoll);
        if (mobileFallback) window.clearTimeout(mobileFallback);
        heroVideo.removeEventListener('canplay', attemptPlayback);
        heroVideo.removeEventListener('playing', finishAfterDecodedFrame);
        heroVideo.removeEventListener('progress', attemptPlayback);
        resolve();
      }

      function finishAfterDecodedFrame() {
        if (resolved || heroVideo.paused || heroVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
        if ('requestVideoFrameCallback' in heroVideo) {
          if (frameRequested) return;
          frameRequested = true;
          heroVideo.requestVideoFrameCallback(completeVideoWait);

          // Some mobile WebKit versions suspend frame callbacks while a page
          // enters or leaves the back/forward cache. The current decoded frame
          // is still safe to reveal if playback remains ready.
          if (isMobileHomepage) {
            window.setTimeout(function () {
              if (!heroVideo.paused && heroVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                completeVideoWait();
              }
            }, 1000);
          }
        } else {
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(completeVideoWait);
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

      if (isMobileHomepage) {
        readinessPoll = window.setInterval(function () {
          if (heroVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA && !heroVideo.paused) {
            finishAfterDecodedFrame();
          } else {
            attemptPlayback();
          }
        }, 250);

        // Never strand mobile users behind the loader solely because a media
        // event or frame callback was lost. Playback recovery continues after
        // the usable page is revealed.
        mobileFallback = window.setTimeout(completeVideoWait, 15000);
      }
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

  if (isMobileHomepage) {
    window.addEventListener('pageshow', function (event) {
      var navigation = window.performance && window.performance.getEntriesByType
        ? window.performance.getEntriesByType('navigation')[0]
        : null;
      var restored = event.persisted || (navigation && navigation.type === 'back_forward');
      if (!restored) return;

      playHeroVideo().catch(schedulePlaybackRecovery);

      // A completed loader can be restored in any point of its fade when a
      // browser snapshots the page. Normalize it to the completed state.
      if (loader.hidden || loader.classList.contains('is-hidden')) {
        loader.hidden = true;
        loader.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('site-loading');
        document.body.classList.add('landing-ready');
        return;
      }

      // If the decoded frame survived the cache, prepare it beneath the
      // loader. The single original readiness promise owns the fade, avoiding
      // duplicate timers and completion transitions.
      if (heroVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        document.body.classList.add('landing-ready');
      } else {
        heroVideo.load();
        schedulePlaybackRecovery();
      }
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
    // On mobile, make the already-decoded hero frame fully visible beneath
    // the opaque loader before beginning its fade. This prevents the loader
    // transition from exposing the hero's initial zero-opacity state.
    if (!isMobileHomepage) return;
    document.body.classList.add('landing-ready');
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(resolve);
      });
    });
  }).then(function () {
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
