(function(){
  const project = document.querySelector('main');
  if (!project) return;

  const images = Array.from(project.querySelectorAll('figure img'));
  if (!images.length) return;

  const viewer = document.createElement('div');
  viewer.className = 'project-lightbox';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Project image gallery');
  viewer.innerHTML = `
    <button class="project-lightbox-close" type="button" aria-label="Close gallery">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
    </button>
    <button class="project-lightbox-prev" type="button" aria-label="Previous image">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
    <div class="project-lightbox-stage">
      <img class="project-lightbox-image" src="" alt="">
      <p class="project-lightbox-count" aria-live="polite"></p>
    </div>
    <button class="project-lightbox-next" type="button" aria-label="Next image">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
    </button>`;
  document.body.appendChild(viewer);

  const viewerImage = viewer.querySelector('.project-lightbox-image');
  const count = viewer.querySelector('.project-lightbox-count');
  const closeButton = viewer.querySelector('.project-lightbox-close');
  const previousButton = viewer.querySelector('.project-lightbox-prev');
  const nextButton = viewer.querySelector('.project-lightbox-next');
  const stage = viewer.querySelector('.project-lightbox-stage');
  const controls = [closeButton, previousButton, nextButton];
  let currentIndex = 0;
  let lastFocus = null;
  let touchStartX = 0;

  function setImage(){
    const source = images[currentIndex];
    viewerImage.src = source.currentSrc || source.src;
    viewerImage.alt = source.alt;
    count.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  function render(animate){
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setImage();
      return;
    }
    viewerImage.classList.add('is-changing');
    window.setTimeout(() => {
      setImage();
      requestAnimationFrame(() => viewerImage.classList.remove('is-changing'));
    }, 140);
  }

  function openViewer(index){
    currentIndex = index;
    lastFocus = document.activeElement;
    render(false);
    viewer.hidden = false;
    document.body.classList.add('project-lightbox-open');
    closeButton.focus();
  }

  function closeViewer(){
    viewer.hidden = true;
    document.body.classList.remove('project-lightbox-open');
    viewerImage.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }

  function move(step){
    currentIndex = (currentIndex + step + images.length) % images.length;
    render(true);
  }

  images.forEach((image, index) => {
    image.classList.add('project-gallery-source');
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Open ${image.alt} in gallery`);
    image.addEventListener('click', () => openViewer(index));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openViewer(index);
      }
    });
  });

  closeButton.addEventListener('click', closeViewer);
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer || event.target === stage) closeViewer();
  });
  window.addEventListener('keydown', (event) => {
    if (viewer.hidden) return;
    if (event.key === 'Escape') closeViewer();
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
    if (event.key === 'Tab') {
      const position = controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(position + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
  });
  stage.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
  }, { passive: true });
})();
