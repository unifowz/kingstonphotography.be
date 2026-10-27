'use strict';

// albums.js wordt automatisch opgebouwd uit de mappen in albums/.
// De contactknop gebruikt de contactpagina in index.html (geen ongebruikt e-mailadres).
const grid = document.getElementById('photo-grid');
const filterBar = document.getElementById('album-filters');
const galleryStatus = document.getElementById('gallery-status');
const lightbox = document.getElementById('lightbox');
const viewerImage = document.getElementById('viewer-image');
const viewerName = document.getElementById('viewer-name');
const viewerCount = document.getElementById('viewer-count');
const viewerStatus = document.getElementById('viewer-status');
const thumbnails = document.getElementById('viewer-thumbnails');
const closeButton = document.getElementById('viewer-close');
const previousButton = document.getElementById('viewer-prev');
const nextButton = document.getElementById('viewer-next');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
// Elk bezoek een willekeurige liggende foto als hero; de intro landt op precies die foto.
const heroPhoto = pickHeroPhoto();
playIntro();
const albums = Array.isArray(window.KINGSTON_ALBUMS) ? window.KINGSTON_ALBUMS : [];
const allPhotos = [];
let visiblePhotos = [];
let activePhotoIndex = -1;
let lastOpenedPhoto = null;
let selectionAnimation = null;

function pickHeroPhoto() {
  const photos = (Array.isArray(window.KINGSTON_ALBUMS) ? window.KINGSTON_ALBUMS : [])
    .flatMap(album => album.photos.filter(photo => photo.src));
  // Staande foto's worden in de brede hero te hard bijgesneden.
  const landscape = photos.filter(photo => photo.width >= photo.height * 1.3);
  const pool = landscape.length ? landscape : photos;
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

function canAnimate() {
  return !motionPreference.matches && typeof viewerImage.animate === 'function';
}

// Door de zoeker: een burst door het portfolio, scherpstellen op de hero-foto en afdrukken.
// Het vastgelegde beeld wordt de hero; interactie slaat de intro direct over.
function playIntro() {
  const intro = document.getElementById('intro');
  const scene = document.getElementById('intro-scene');
  const photos = (Array.isArray(window.KINGSTON_ALBUMS) ? window.KINGSTON_ALBUMS : [])
    .flatMap(album => album.photos.filter(photo => photo.src).map(photo => ({src: photo.src, album: album.name})));
  if (!intro || !photos.length || motionPreference.matches || window.location.hash || window.scrollY > 0) return;

  const note = document.getElementById('intro-note');
  const albumLabel = document.getElementById('intro-album');
  const counter = document.getElementById('intro-count');
  const exposure = document.getElementById('intro-exposure');
  const keeper = photos.find(photo => photo.src === heroPhoto?.src) || photos[0];
  // Wissel albums af zodat de burst het hele portfolio laat zien.
  const rest = photos.filter(photo => photo !== keeper);
  const burst = [];
  for (let step = Math.max(1, Math.floor(rest.length / 5)), i = 0; i < rest.length && burst.length < 5; i += step) burst.push(rest[i]);
  const frames = [...burst, keeper].map(photo => {
    const image = new Image();
    image.alt = '';
    image.decoding = 'async';
    image.src = photo.src;
    scene.prepend(image);
    image.classList.toggle('is-keeper', photo === keeper);
    return {image, album: photo.album};
  });

  const controller = new AbortController();
  const timers = [];
  let shot = Math.floor(Math.random() * 400) + 120;
  const at = (delay, action) => timers.push(window.setTimeout(action, delay));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  // Tekst in de zoeker verschijnt als een digitale uitlezing: willekeurige tekens die van links naar rechts vastvallen.
  function scramble(element, text) {
    const start = performance.now();
    (function frame(now) {
      const settled = Math.floor((now - start) / 22);
      element.textContent = [...text].map((char, i) => i < settled || char === ' ' ? char : pick([...'ABCDEFGHKMNPRSTVXZ0123456789'])).join('');
      if (settled < text.length && !controller.signal.aborted) requestAnimationFrame(frame);
    })(start);
  }
  // Spiegelslag: het beeld schokt kort bij elke opname.
  function slap() {
    intro.classList.remove('is-slap');
    void intro.offsetWidth;
    intro.classList.add('is-slap');
  }
  // Elke opname een eigen belichting en een AF-punt dat het onderwerp volgt; de hero-foto in het midden.
  function expose(frame) {
    const isKeeper = frame === frames[frames.length - 1];
    scene.classList.add('is-closed');
    slap();
    at(45, () => {
      frames.forEach(other => other.image.classList.toggle('is-current', other === frame));
      albumLabel.textContent = frame.album;
      counter.textContent = String(++shot).padStart(4, '0');
      exposure.textContent = isKeeper ? '1/2000 · F2.8 · ISO 200'
        : `${pick(['1/250', '1/1000', '1/1600', '1/3200'])} · ${pick(['F2.8', 'F4', 'F5.6'])} · ISO ${pick([100, 200, 400, 800])}`;
      intro.style.setProperty('--afx', isKeeper ? '50%' : `${32 + Math.random() * 36}%`);
      intro.style.setProperty('--afy', isKeeper ? '50%' : `${34 + Math.random() * 32}%`);
      scene.classList.remove('is-closed');
    });
  }
  function finishIntro() {
    timers.forEach(window.clearTimeout);
    intro.hidden = true;
    frames.forEach(frame => frame.image.remove());
    document.body.classList.remove('intro-playing');
    controller.abort();
  }
  // Laat het vastgelegde beeld precies op de plek en uitsnede van de hero-foto landen.
  function handOff() {
    // De hero-sectie, niet .hero-image: die rechthoek telt de scale(1.08) al mee.
    const box = document.querySelector('.hero').getBoundingClientRect();
    const keeperImage = frames[frames.length - 1].image;
    intro.style.setProperty('--land', `${box.top}px ${window.innerWidth - box.right}px ${window.innerHeight - box.bottom}px ${box.left}px`);
    Object.assign(keeperImage.style, {
      top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`,
      objectPosition: getComputedStyle(document.querySelector('.hero-image')).backgroundPosition,
    });
    document.body.classList.add('intro-handoff');
  }

  // De sluiter, het scherpstellen en de overdracht, gerekend vanaf het einde van de burst.
  function schedule(focusStart) {
    at(focusStart, () => {
      intro.classList.remove('is-bursting');
      intro.classList.add('is-hunting');
      scramble(note, 'Focusing');
      expose(frames[frames.length - 1]);
    });
    at(focusStart + 620, () => {
      intro.classList.replace('is-hunting', 'is-locked');
      scramble(note, 'Got it');
    });
    at(focusStart + 900, () => {
      scene.classList.add('is-closed');
      at(80, () => {
        counter.textContent = String(++shot).padStart(4, '0');
        scramble(note, 'Captured');
        scene.classList.remove('is-closed');
        handOff();
        intro.classList.add('is-captured');
      });
    });
    // De titel komt pas op terwijl de zoeker wegvalt.
    at(focusStart + 1860, () => {
      intro.classList.add('is-done');
      document.body.classList.remove('intro-playing');
    });
    at(focusStart + 2600, finishIntro);
  }
  // Alleen beelden die al geladen zijn komen in de burst; anders flitst er een zwart vlak.
  // De burst versnelt, zoals een camera die op volle snelheid komt.
  function play(waited) {
    const loaded = frames.slice(0, -1).filter(frame => frame.image.complete && frame.image.naturalWidth);
    let time = Math.max(260, 420 - waited);
    if (loaded.length) at(time, () => {
      intro.classList.add('is-bursting');
      scramble(note, 'Burst');
    });
    loaded.forEach((frame, index) => {
      at(time, () => expose(frame));
      time += Math.max(70, 150 - index * 20);
    });
    schedule(time + 60);
  }

  document.body.classList.add('intro-playing');
  intro.hidden = false;
  at(40, () => {
    intro.classList.add('is-on');
    scramble(note, note.textContent);
  });
  const started = performance.now();
  const decoded = Promise.all(frames.map(frame => frame.image.decode().catch(() => {})));
  const patience = new Promise(resolve => at(1200, resolve));
  Promise.race([decoded, patience]).then(() => {
    if (!controller.signal.aborted) play(performance.now() - started);
  });

  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'pagehide'].forEach(type => {
    window.addEventListener(type, finishIntro, {passive: true, signal: controller.signal});
  });
  motionPreference.addEventListener('change', finishIntro, {signal: controller.signal});
}

// Geen rechtermuisklik of slepen op foto's: maakt "Afbeelding opslaan als" onbereikbaar.
const PROTECTED_PHOTOS = '.photo-card, .viewer-main, .viewer-thumb, .hero, .intro';
['contextmenu', 'dragstart'].forEach(type => {
  document.addEventListener(type, event => {
    if (event.target.closest?.(PROTECTED_PHOTOS)) event.preventDefault();
  });
});

// Mobiel menu.
const mobileMenu = document.getElementById('mobile-nav');
const menuButton = document.getElementById('menu-button');
function closeMobileMenu() {
  mobileMenu.hidden = true;
  menuButton.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}
menuButton.addEventListener('click', () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  menuButton.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));

// Topbalk verdwijnt bij naar beneden scrollen en komt terug zodra je omhoog scrolt.
const header = document.querySelector('.header');
let lastScrollY = window.scrollY;
// De achtergrond van de topbalk schuift mee, zodat de schuine lijn naadloos doorloopt met de pagina erachter.
const syncHeaderBackground = () => header.style.setProperty('--header-bg-y', `${-window.scrollY}px`);
syncHeaderBackground();
new ResizeObserver(() => header.style.setProperty('--page-h', `${document.documentElement.scrollHeight}px`)).observe(document.body);
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  syncHeaderBackground();
  if (Math.abs(y - lastScrollY) < 6) return;
  header.classList.toggle('is-hidden', y > lastScrollY && y > header.offsetHeight && mobileMenu.hidden);
  lastScrollY = y;
}, {passive: true});
window.addEventListener('resize', () => { if (window.innerWidth > 740) closeMobileMenu(); });

function makeFilter(label, category, count) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'filter';
  button.dataset.filter = category;
  button.append(document.createTextNode(label + ' '));
  const total = document.createElement('small');
  total.textContent = count;
  button.append(total);
  button.addEventListener('click', () => setFilter(category));
  filterBar.append(button);
}

function setFilter(category) {
  filterBar.querySelectorAll('.filter').forEach(button => {
    const selected = button.dataset.filter === category;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  allPhotos.forEach(card => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    card.classList.remove('filter-enter');
  });
  visiblePhotos = allPhotos.filter(card => !card.hidden);
  showPreview(visiblePhotos);
  if (canAnimate()) {
    void grid.offsetWidth;
    visiblePhotos.slice(0, GRID_PREVIEW).forEach((card, index) => {
      card.style.setProperty('--stagger', `${Math.min(index, 7) * 38}ms`);
      card.classList.add('filter-enter');
    });
  }
}

// De grid toont 11 foto's en een twaalfde tegel met "•••"; de viewer bevat altijd het hele album.
const GRID_PREVIEW = 12;
function showPreview(cards) {
  const truncated = cards.length > GRID_PREVIEW;
  grid.querySelectorAll('.photo-more').forEach(label => label.remove());
  allPhotos.forEach(card => {
    card.classList.remove('is-more', 'is-overflow');
    if (card.dataset.label) card.setAttribute('aria-label', card.dataset.label);
  });
  if (!truncated) return;
  cards.slice(GRID_PREVIEW).forEach(card => card.classList.add('is-overflow'));
  const moreCard = cards[GRID_PREVIEW - 1];
  const remaining = cards.length - (GRID_PREVIEW - 1);
  moreCard.classList.add('is-more');
  moreCard.setAttribute('aria-label', `View ${remaining} more photos`);
  const label = document.createElement('span');
  label.className = 'photo-more';
  label.setAttribute('aria-hidden', 'true');
  const dots = document.createElement('b');
  dots.textContent = '•••';
  const count = document.createElement('small');
  count.textContent = `+${remaining} photos`;
  label.append(dots, count);
  moreCard.append(label);
}

function updateGalleryState() {
  filterBar.querySelectorAll('.filter').forEach(button => {
    const category = button.dataset.filter;
    const count = allPhotos.filter(card => category === 'all' || card.dataset.category === category).length;
    button.querySelector('small').textContent = count;
    button.hidden = count === 0;
  });
  const selected = filterBar.querySelector('.is-active:not([hidden])');
  setFilter(selected ? selected.dataset.filter : 'all');
  galleryStatus.hidden = allPhotos.length > 0;
  galleryStatus.textContent = 'No photos are available right now.';
  const hero = document.querySelector('.hero-image');
  if (allPhotos.length) {
    const heroCard = allPhotos.find(card => card.dataset.full === heroPhoto?.src) || allPhotos[0];
    const heroURL = new URL(heroCard.dataset.full, document.baseURI).href;
    hero.style.backgroundImage = `url(${JSON.stringify(heroURL)})`;
    // Onderschrift: het album van de hero-foto, zonder de toevoeging "Accredited".
    const heroAlbum = albums.find(album => album.photos.some(photo => photo.src === heroCard.dataset.full));
    if (heroAlbum) {
      document.getElementById('hero-caption-album').textContent = heroAlbum.name.replace(/\s*Accredited$/i, '');
      document.getElementById('hero-caption').hidden = false;
    }
  } else {
    hero.style.backgroundImage = 'none';
  }
}

// Gebruik tekstnodes: album- en bestandsnamen zijn tekst, nooit HTML.
makeFilter('All', 'all', albums.reduce((sum, album) => sum + album.photos.length, 0));
albums.forEach((album, albumIndex) => {
  const category = `album-${albumIndex}`;
  makeFilter(album.name, category, album.photos.length);
  album.photos.forEach(photo => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'photo-card';
    card.dataset.category = category;
    card.dataset.full = photo.src;
    card.dataset.caption = album.name;
    card.dataset.label = `View ${photo.name} — ${album.name}`;
    card.setAttribute('aria-label', card.dataset.label);
    const img = document.createElement('img');
    img.alt = `${album.name} — ${photo.name}`;
    img.loading = allPhotos.length < 4 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      const index = allPhotos.indexOf(card);
      if (index === -1) return;
      allPhotos.splice(index, 1);
      card.remove();
      if (lightbox.open) closePhoto();
      updateGalleryState();
    });
    img.src = photo.src;
    const zoom = document.createElement('span');
    zoom.className = 'photo-zoom';
    zoom.setAttribute('aria-hidden', 'true');
    zoom.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg>';
    card.append(img, zoom);
    card.addEventListener('click', () => openPhoto(card));
    allPhotos.push(card);
    grid.append(card);
  });
});
setFilter('all');
updateGalleryState();

// Cijferstrook: de cijfers met data-count tellen op zodra ze in beeld komen.
function countUp(counter) {
  const target = Number(counter.dataset.target);
  if (!target) return;
  const start = performance.now();
  const duration = 1300;
  (function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(frame);
  })(start);
}
const counters = document.querySelectorAll('[data-count]');
if (canAnimate()) {
  counters.forEach(counter => {
    counter.dataset.target = counter.textContent;
    counter.textContent = '0';
  });
}
const countObserver = new IntersectionObserver(entries => {
  if (document.body.classList.contains('intro-playing')) return;
  if (!entries.some(entry => entry.isIntersecting)) return;
  counters.forEach(countUp);
  countObserver.disconnect();
}, {threshold: .6});
countObserver.observe(document.querySelector('.stats'));
// Tijdens de intro wachten; daarna opnieuw kijken of de strook al in beeld is.
new MutationObserver((changes, watcher) => {
  if (document.body.classList.contains('intro-playing')) return;
  watcher.disconnect();
  countObserver.unobserve(document.querySelector('.stats'));
  countObserver.observe(document.querySelector('.stats'));
}).observe(document.body, {attributes: true, attributeFilter: ['class']});

function updateThumbnails(index) {
  Array.from(thumbnails.children).forEach((button, position) => {
    const selected = position === index;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    if (selected && lightbox.open) {
      button.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: motionPreference.matches ? 'instant' : 'smooth'});
    }
  });
}

function updateImageStatus() {
  if (!lightbox.open) return;
  const loaded = viewerImage.complete && viewerImage.naturalWidth > 0;
  viewerImage.style.visibility = loaded ? 'visible' : 'hidden';
  viewerStatus.hidden = loaded;
  viewerStatus.textContent = viewerImage.complete ? 'This image could not be loaded.' : 'Loading photo…';
}
viewerImage.addEventListener('load', updateImageStatus);
viewerImage.addEventListener('error', updateImageStatus);

function selectPhoto(index, initial = false) {
  const card = visiblePhotos[index];
  if (!card) return;
  const changed = activePhotoIndex !== index;
  activePhotoIndex = index;
  if (selectionAnimation) selectionAnimation.cancel();
  viewerImage.alt = card.querySelector('img').alt;
  viewerImage.src = card.dataset.full;
  viewerName.textContent = card.dataset.caption;
  viewerCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(visiblePhotos.length).padStart(2, '0')}`;
  previousButton.disabled = nextButton.disabled = visiblePhotos.length < 2;
  updateImageStatus();
  updateThumbnails(index);
  if (changed && !initial && canAnimate()) {
    selectionAnimation = viewerImage.animate([
      {opacity: 0.2, transform: 'scale(.985)'},
      {opacity: 1, transform: 'scale(1)'}
    ], {duration: 250, easing: 'ease-out'});
  }
}

function openPhoto(card) {
  if (lightbox.open) return;
  lastOpenedPhoto = card;
  visiblePhotos = allPhotos.filter(photo => !photo.hidden);
  thumbnails.replaceChildren();
  visiblePhotos.forEach((photo, index) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'viewer-thumb';
    thumb.setAttribute('aria-label', `View photo ${index + 1}: ${photo.querySelector('img').alt}`);
    const image = document.createElement('img');
    image.src = photo.querySelector('img').src;
    image.alt = '';
    image.loading = 'lazy';
    thumb.append(image);
    thumb.addEventListener('click', () => selectPhoto(index));
    thumbnails.append(thumb);
  });
  lightbox.showModal();
  document.body.classList.add('modal-open');
  selectPhoto(visiblePhotos.indexOf(card), true);
  closeButton.focus({preventScroll: true});
}

// Synchronous closing avoids stale zoom promises hiding a newly opened image.
function closePhoto() {
  if (lightbox.open) lightbox.close();
}
function stepPhoto(step) {
  if (lightbox.open && visiblePhotos.length) {
    selectPhoto((activePhotoIndex + step + visiblePhotos.length) % visiblePhotos.length);
  }
}
previousButton.addEventListener('click', () => stepPhoto(-1));
nextButton.addEventListener('click', () => stepPhoto(1));
closeButton.addEventListener('click', closePhoto);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closePhoto(); });
lightbox.addEventListener('cancel', event => { event.preventDefault(); closePhoto(); });
lightbox.addEventListener('close', () => {
  // A queued close event must never clear a dialog that has reopened.
  if (lightbox.open) return;
  if (selectionAnimation) selectionAnimation.cancel();
  document.body.classList.remove('modal-open');
  viewerImage.removeAttribute('src');
  viewerImage.style.visibility = 'hidden';
  activePhotoIndex = -1;
  if (lastOpenedPhoto?.isConnected) lastOpenedPhoto.focus({preventScroll: true});
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) {
    closeMobileMenu();
    if (!lightbox.open) menuButton.focus();
  }
  if (!lightbox.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); stepPhoto(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepPhoto(-1); }
});
