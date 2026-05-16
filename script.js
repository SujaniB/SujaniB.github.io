
// Year & theme toggle
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
const root = document.documentElement;
const saved = localStorage.getItem('theme');
if (saved === 'light') root.classList.add('light');
const btn = document.getElementById('themeToggle');
if (btn) {
  btn.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
}


// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Close menu when a link is clicked (mobile)
siteNav?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    if (siteNav.classList.contains('open')) {
      siteNav.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  });
});

// Copy text buttons
(() => {
  const buttons = document.querySelectorAll('[data-copy-target]');
  if (!buttons.length) return;

  function copyWithFallback(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error('Copy failed'));
  }

  buttons.forEach((button) => {
    const defaultLabel = button.querySelector('span')?.textContent || 'Copy';

    button.addEventListener('click', async () => {
      const target = document.querySelector(button.dataset.copyTarget);
      const text = target?.innerText.replace(/\s+\n/g, '\n').trim();
      if (!text) return;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          await copyWithFallback(text);
        }

        button.classList.add('is-copied');
        button.querySelector('span').textContent = 'Copied';
        window.setTimeout(() => {
          button.classList.remove('is-copied');
          button.querySelector('span').textContent = defaultLabel;
        }, 1600);
      } catch {
        button.querySelector('span').textContent = 'Try again';
        window.setTimeout(() => {
          button.querySelector('span').textContent = defaultLabel;
        }, 1600);
      }
    });
  });
})();


// First-load animation toggle
window.addEventListener('DOMContentLoaded', () => {
  // small delay helps fonts load before animating
  setTimeout(() => document.documentElement.classList.add('page-loaded'), 60);
});

// Scroll-reveal for elements with .reveal
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => io.observe(el));
})();

// Make tiles tappable on touch devices (toggle open)
(function () {
  const tiles = document.querySelectorAll('.reveal-card');
  if (!tiles.length) return;

  const isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  tiles.forEach(t => {
    // Keyboard: Enter/Space toggles
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        t.classList.toggle('open');
      }
    });
    // Touch/click: only toggle on touch-centric devices
    if (isTouch) {
      t.addEventListener('click', (e) => {
        // Do not close immediately when clicking links inside
        if (e.target.closest('a')) return;
        t.classList.toggle('open');
      });
    }
  });
})();


// Only one collapsible open at a time
(() => {
  const cards = document.querySelectorAll('.a-card');
  cards.forEach(card => {
    card.addEventListener('toggle', () => {
      if (card.open) {
        cards.forEach(other => { if (other !== card) other.open = false; });
      }
    });
  });
})();


// Blog "news" ticker: cycles items, pauses on hover/touch
(() => {
  const list = document.querySelector('.news-card .ticker-list');
  if (!list) return;
  const items = Array.from(list.children);
  if (items.length < 2) return;

  let i = 0, paused = false;
  const area = document.querySelector('.news-card .ticker');
  if (!area) return;

  // start state
  items.forEach((li, idx) => li.classList.toggle('active', idx === 0));

  const step = () => {
    if (paused) return;
    items[i].classList.remove('active');
    i = (i + 1) % items.length;
    items[i].classList.add('active');
  };

  // cycle every 3 seconds
  const id = setInterval(step, 3000);

  // pause on hover / focus within
  ['mouseenter','focusin','touchstart'].forEach(ev => area.addEventListener(ev, () => { paused = true; }, {passive:true}));
  ['mouseleave','focusout','touchend','touchcancel'].forEach(ev => area.addEventListener(ev, () => { paused = false; }, {passive:true}));
})();


// ===== Auto-populate Highlights ticker from blog.html =====
(async () => {
  const listEl = document.getElementById('blogTicker');
  if (!listEl) return;

  const makeItem = (title, anchor, active = false) => {
    const item = document.createElement('li');
    if (active) item.classList.add('active');

    const link = document.createElement('a');
    link.className = 'inline';
    link.href = `blog.html${anchor}`;
    link.textContent = title;

    item.appendChild(link);
    return item;
  };

  const replaceTickerItems = (items) => {
    listEl.replaceChildren(...items);
  };

  try {
    const res = await fetch('blog.html', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to fetch blog.html');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    let posts = [];

    doc.querySelectorAll('article[id]').forEach(art => {
      const titleEl = art.querySelector('h1, h2, h3, .post-title');
      const title = titleEl?.textContent?.trim();
      const id = art.id;
      const date = art.getAttribute('data-date');
      if (title && id) posts.push({ title, anchor: `#${id}`, date });
    });

    if (posts.length === 0) {
      doc.querySelectorAll('h2[id], h3[id]').forEach(h => {
        const title = h.textContent?.trim();
        const id = h.id;
        const date = h.getAttribute('data-date');
        if (title && id) posts.push({ title, anchor: `#${id}`, date });
      });
    }

    if (posts.length === 0) {
      doc.querySelectorAll('[id^="post-"]').forEach(el => {
        const title = el.textContent?.trim();
        const id = el.id;
        const date = el.getAttribute('data-date');
        if (title && id) posts.push({ title, anchor: `#${id}`, date });
      });
    }

    if (posts.some(p => p.date)) {
      posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    posts = posts.slice(0, 6);

    if (posts.length) {
      replaceTickerItems(posts.map((p, i) => makeItem(p.title, p.anchor, i === 0)));
    } else {
      const item = document.createElement('li');
      item.className = 'active';
      item.textContent = 'Add posts to your blog to populate Highlights';
      replaceTickerItems([item]);
    }
  } catch (err) {
    const item = document.createElement('li');
    item.className = 'active';
    item.textContent = "Couldn't load blog posts";
    replaceTickerItems([item]);
  }
})();


function animateCount(node, to, duration = 1200) {
  const start = 0, t0 = performance.now();
  const ease = t => t * (2 - t);
  function frame(now) {
    const p = Math.min(1, (now - t0) / duration);
    node.textContent = Math.floor(start + (to - start) * ease(p)).toLocaleString();
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

async function initVisitorCounter() {
  const el = document.getElementById('visitorCount');
  const pill = document.getElementById('visitPill');
  if (!el || !pill) return;

  pill.classList.add('ready');

  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbx9fmAcq6NDykzWiTqjqo5c2Odc6g6omp_jKcTfmnvYxN9bMMg6vEQShAw5GvzKuMV3/exec', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const { value } = await res.json();
    if (typeof value === 'number') {
      animateCount(el, value, 1200);
      pill.classList.remove('pulse');
      requestAnimationFrame(() => pill.classList.add('pulse'));
      return;
    }
    throw new Error('Bad payload');
  } catch (e) {
    console.warn('[counter] unavailable:', e);
    el.textContent = '-';
  }
}

window.addEventListener('DOMContentLoaded', initVisitorCounter);
// ===== Travel slider =====
function initTravelSlider() {
  const root = document.getElementById('travelSlider');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.slide'));
  const dotsWrap = root.querySelector('.dots');
  const prev = root.querySelector('.prev');
  const next = root.querySelector('.next');

  if (!slides.length) return;

  // Build dots
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    if (i === 0) b.classList.add('is-active');
    b.addEventListener('click', () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  let i = 0, timer = null;

  function go(n){
    slides[i].classList.remove('is-active');
    dots[i].classList.remove('is-active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    dots[i].classList.add('is-active');
    restart();
  }

  function step(){ go(i + 1); }
  function restart(){
    clearInterval(timer);
    timer = setInterval(step, 5000); // auto every 5s
  }

  prev?.addEventListener('click', () => go(i - 1));
  next?.addEventListener('click', () => go(i + 1));

  // pause on hover
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);

  // swipe (basic)
  let sx = 0;
  root.addEventListener('touchstart', e => sx = e.touches[0].clientX, {passive:true});
  root.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
  });

  restart();
}

// kick it off with your other inits
window.addEventListener('DOMContentLoaded', () => {
  initTravelSlider();
});


function initTripMap() {
  const el = document.getElementById('tripMap');
  if (!el || typeof L === 'undefined') return;

  // Center on Sri Lanka; adjust zoom as you add more
  const map = L.map(el, { scrollWheelZoom: false }).setView([7.8731, 80.7718], 7);

  // Tiles (Carto dark matter pairs nicely; you can switch to outdoors tiles if you prefer)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap & Carto',
    maxZoom: 19
  }).addTo(map);

  // Trip pins (add as many as you like)
  const trips = [
    {
      name: 'Knuckles Ridge — Sunrise',
      coords: [7.465, 80.782],
      img: 'assets/travel-1.jpg',
      text: 'Ridgewalk above the cloud deck. Unreal light.'
    },
    {
      name: 'Sinharaja — After Rain',
      coords: [6.405, 80.458],
      img: 'assets/travel-2.jpg',
      text: 'Emerald trails and sun shafts.'
    },
    {
      name: 'Riverston — Cloud Paths',
      coords: [7.546, 80.704],
      img: 'assets/travel-3.jpg',
      text: 'Fog and grassy shoulders with sudden panoramas.'
    }
  ];

  const popupHTML = t => `
    <div style="width:220px">
      <div style="aspect-ratio:16/9;overflow:hidden;border-radius:10px;margin-bottom:.4rem">
        <img src="${t.img}" alt="${t.name}" style="width:100%;height:100%;object-fit:cover">
      </div>
      <strong>${t.name}</strong>
      <div style="color:#a8b3cf">${t.text}</div>
    </div>`;

  trips.forEach(t => {
    L.marker(t.coords).addTo(map).bindPopup(popupHTML(t));
  });
}

// Run with your other initializers
window.addEventListener('DOMContentLoaded', () => {
  initTripMap();
});

// Awards & Recognitions showcase carousel
(function () {
  function initAwardsCarousel() {
    const carousel = document.querySelector('[data-award-carousel]');
    if (!carousel) return;

    const cards = Array.from(carousel.querySelectorAll('[data-award-card]'));
    const prev = carousel.querySelector('[data-award-prev]');
    const next = carousel.querySelector('[data-award-next]');
    const dotsWrap = carousel.querySelector('[data-award-dots]');
    const topic = carousel.querySelector('[data-award-topic]');
    let topicText = carousel.querySelector('[data-award-topic-text]');
    let topicNext = carousel.querySelector('[data-award-topic-next]');
    if (!cards.length) return;

    if (topic && !topicText) {
      topicText = document.createElement('span');
      topicText.className = 'award-carousel-topic-text';
      topicText.dataset.awardTopicText = '';
      topicText.textContent = topic.textContent.trim();
      topic.textContent = '';
      topic.appendChild(topicText);
    }

    if (topic && !topicNext) {
      topicNext = document.createElement('span');
      topicNext.className = 'award-carousel-topic-next';
      topicNext.dataset.awardTopicNext = '';
      topicNext.setAttribute('aria-hidden', 'true');
      topic.appendChild(topicNext);
    }

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = 0;
    let autoTimer = null;
    let transitionTimer = null;
    let isTransitioning = false;
    const carouselTransitionMs = 760;

    cards.forEach((card, index) => {
      card.setAttribute('aria-label', `Recognition ${index + 1} of ${cards.length}`);
    });

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      cards.forEach((card, index) => {
        const title = card.querySelector('h3')?.textContent?.trim() || `Recognition ${index + 1}`;
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show ${title}`);
        dot.addEventListener('click', () => goTo(index));
        dotsWrap.appendChild(dot);
      });
    }

    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('button')) : [];

    function render() {
      cards.forEach((card, index) => {
        let offset = (index - active + cards.length) % cards.length;
        if (offset > cards.length / 2) offset -= cards.length;

        card.classList.remove('is-active', 'is-prev', 'is-next', 'is-far-prev', 'is-far-next', 'is-hidden-prev', 'is-hidden-next');
        card.setAttribute('aria-hidden', index === active ? 'false' : 'true');

        if (offset === 0) card.classList.add('is-active');
        else if (offset === 1) card.classList.add('is-next');
        else if (offset === -1) card.classList.add('is-prev');
        else if (offset === 2) card.classList.add('is-far-next');
        else if (offset === -2) card.classList.add('is-far-prev');
        else if (offset > 0) card.classList.add('is-hidden-next');
        else card.classList.add('is-hidden-prev');
      });

      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === active);
        dot.setAttribute('aria-current', index === active ? 'true' : 'false');
      });
    }

    function goTo(index, options = {}) {
      const target = (index + cards.length) % cards.length;
      if (target === active) return;
      const nextCategory = cards[target]?.dataset.awardCategory || '';
      const shouldAnimateTopic = topic && topicText && topicText.textContent.trim() !== nextCategory;

      if (reduce || options.immediate) {
        active = target;
        render();
        showTopic(nextCategory);
        return;
      }

      if (isTransitioning) {
        return;
      }

      isTransitioning = true;
      setControlsDisabled(true);
      carousel.classList.add('is-transitioning');
      if (shouldAnimateTopic) {
        prepareTopic(nextCategory);
        topic?.classList.add('is-changing');
      }

      window.clearTimeout(transitionTimer);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          active = target;
          render();
        });
      });

      transitionTimer = window.setTimeout(() => {
        if (shouldAnimateTopic) showTopic(nextCategory);
        carousel.classList.remove('is-transitioning');
        isTransitioning = false;
        setControlsDisabled(false);
      }, carouselTransitionMs);
    }

    function setControlsDisabled(disabled) {
      [prev, next, ...dots].forEach((control) => {
        if (!control) return;
        control.disabled = disabled;
        control.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      });
    }

    function prepareTopic(nextText) {
      if (!topicNext) return;
      topicNext.textContent = nextText;
    }

    function showTopic(nextText) {
      if (!topic || !topicText) return;
      topicText.textContent = nextText;
      if (topicNext) topicNext.textContent = '';
      topic.classList.remove('is-changing');
    }

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function startAuto() {
      if (reduce || cards.length < 2) return;
      stopAuto();
      autoTimer = window.setInterval(() => goTo(active + 1), 5200);
    }

    prev?.addEventListener('click', () => {
      goTo(active - 1);
      startAuto();
    });
    next?.addEventListener('click', () => {
      goTo(active + 1);
      startAuto();
    });

    carousel.tabIndex = 0;
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(active - 1);
        startAuto();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(active + 1);
        startAuto();
      }
    });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', startAuto);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    if (reduce) {
      cards.forEach(card => card.setAttribute('aria-hidden', 'false'));
      showTopic(cards[active]?.dataset.awardCategory || '');
      return;
    }

    render();
    showTopic(cards[active]?.dataset.awardCategory || '');
    startAuto();
  }

  function initAwardsImageFallbacks() {
    document.querySelectorAll('.awards-showcase-page .award-photo img').forEach((image) => {
      image.addEventListener('error', () => {
        const frame = image.closest('.award-photo');
        if (!frame) return;
        frame.classList.add('is-missing');
        image.setAttribute('aria-hidden', 'true');
      }, { once: true });
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    initAwardsCarousel();
    initAwardsImageFallbacks();
  });
})();

// Lecturing course carousel
(function () {
  function initLecturingCourseCarousel() {
    const carousel = document.querySelector('[data-course-carousel]');
    if (!carousel) return;

    const track = carousel.querySelector('[data-course-track]');
    const viewport = carousel.querySelector('[data-course-viewport]');
    const prev = carousel.querySelector('[data-course-prev]');
    const next = carousel.querySelector('[data-course-next]');
    const dotsWrap = carousel.querySelector('[data-course-dots]');
    const empty = carousel.querySelector('[data-course-empty]');
    const allCards = Array.from(carousel.querySelectorAll('[data-course-card]'));
    const filters = Array.from(document.querySelectorAll('[data-course-filter]'));
    if (!track || !viewport || !allCards.length) return;

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let activeFilter = 'all';
    let activeIndex = 0;
    let perView = getPerView();
    let visibleCards = [];
    let filteredCards = [];
    let autoTimer = null;
    let isAnimating = false;

    function getPerView() {
      if (window.innerWidth <= 640) return 1;
      if (window.innerWidth <= 900) return 2;
      return 3;
    }

    function filterCards() {
      filteredCards = allCards.filter((card) => {
        const match = activeFilter === 'all' || card.dataset.institution === activeFilter;
        card.hidden = !match;
        return match;
      });
      allCards.forEach((card) => track.appendChild(card));
      visibleCards = getVisibleCards();
      activeIndex = 0;
      resetTrackPosition();
      if (empty) empty.hidden = filteredCards.length > 0;
    }

    function getVisibleCards() {
      return Array.from(track.querySelectorAll('[data-course-card]:not([hidden])'));
    }

    function canMove() {
      return filteredCards.length > perView;
    }

    function resetTrackPosition() {
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
      track.offsetHeight;
      track.style.transition = '';
    }

    function getStep() {
      visibleCards = getVisibleCards();
      if (visibleCards.length < 2) return 0;
      return visibleCards[1].offsetLeft - visibleCards[0].offsetLeft;
    }

    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      if (!filteredCards.length) return;
      const count = canMove() ? filteredCards.length : 1;
      for (let i = 0; i < count; i += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show course ${i + 1}`);
        dot.addEventListener('click', () => {
          jumpTo(i);
          update();
          startAuto();
        });
        dotsWrap.appendChild(dot);
      }
    }

    function jumpTo(index) {
      if (!filteredCards.length) return;
      const nextIndex = ((index % filteredCards.length) + filteredCards.length) % filteredCards.length;
      const ordered = filteredCards.slice(nextIndex).concat(filteredCards.slice(0, nextIndex));
      ordered.forEach((card) => track.appendChild(card));
      allCards.filter((card) => card.hidden).forEach((card) => track.appendChild(card));
      activeIndex = nextIndex;
      visibleCards = getVisibleCards();
      resetTrackPosition();
    }

    function updateControls() {
      const movable = canMove() && !isAnimating;
      if (prev) prev.disabled = !movable;
      if (next) next.disabled = !movable;

      const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('button')) : [];
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === activeIndex);
        dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
        dot.disabled = isAnimating;
      });
    }

    function updateFilters() {
      const currentInstitution = filteredCards[activeIndex]?.dataset.institution || activeFilter;
      filters.forEach((filter) => {
        const value = filter.dataset.courseFilter;
        const isActive = value === activeFilter;
        const isCurrent = value === currentInstitution;
        filter.classList.toggle('is-active', isActive);
        filter.classList.toggle('is-current', isCurrent && value !== 'all');
        filter.setAttribute('aria-selected', isActive ? 'true' : 'false');
        filter.setAttribute('aria-current', isCurrent && value !== 'all' ? 'true' : 'false');
      });
    }

    function update() {
      updateControls();
      updateFilters();
    }

    function goNext() {
      if (!canMove() || isAnimating) return;
      const step = getStep();
      if (!step) return;

      isAnimating = true;
      updateControls();
      track.style.transform = `translateX(${-step}px)`;

      window.setTimeout(() => {
        const first = getVisibleCards()[0];
        if (first) track.appendChild(first);
        activeIndex = (activeIndex + 1) % filteredCards.length;
        resetTrackPosition();
        isAnimating = false;
        update();
      }, reduce ? 0 : 580);
    }

    function goPrev() {
      if (!canMove() || isAnimating) return;
      visibleCards = getVisibleCards();
      const first = visibleCards[0];
      const last = visibleCards[visibleCards.length - 1];
      if (!first || !last) return;

      isAnimating = true;
      updateControls();
      track.insertBefore(last, first);
      visibleCards = getVisibleCards();
      const step = getStep();
      track.style.transition = 'none';
      track.style.transform = `translateX(${-step}px)`;
      track.offsetHeight;
      track.style.transition = '';

      window.requestAnimationFrame(() => {
        track.style.transform = 'translateX(0)';
      });

      window.setTimeout(() => {
        activeIndex = (activeIndex - 1 + filteredCards.length) % filteredCards.length;
        resetTrackPosition();
        isAnimating = false;
        update();
      }, reduce ? 0 : 580);
    }

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function startAuto() {
      if (reduce || filteredCards.length <= perView) return;
      stopAuto();
      autoTimer = window.setInterval(goNext, 3600);
    }

    function refresh() {
      perView = getPerView();
      carousel.style.setProperty('--course-per-view', perView);
      filterCards();
      renderDots();
      window.requestAnimationFrame(update);
    }

    filters.forEach((filter) => {
      filter.addEventListener('click', () => {
        activeFilter = filter.dataset.courseFilter || 'all';
        activeIndex = 0;
        refresh();
        startAuto();
      });
    });

    prev?.addEventListener('click', () => {
      goPrev();
      startAuto();
    });

    next?.addEventListener('click', () => {
      goNext();
      startAuto();
    });

    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
        startAuto();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
        startAuto();
      }
    });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', startAuto);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        refresh();
        startAuto();
      }, reduce ? 0 : 120);
    });

    refresh();
    startAuto();
  }

  window.addEventListener('DOMContentLoaded', initLecturingCourseCarousel);
})();

// Research publications page agreed design
(function () {
  function initResearchCollaboratorCarousel() {
    const carousel = document.querySelector('[data-research-collab-carousel]');
    if (!carousel) return;

    const track = carousel.querySelector('[data-research-collab-track]');
    const prev = carousel.querySelector('[data-research-collab-prev]');
    const next = carousel.querySelector('[data-research-collab-next]');
    const dotsWrap = carousel.querySelector('[data-research-collab-dots]');
    const cards = track ? Array.from(track.querySelectorAll('[data-research-collab-card]')) : [];
    if (!track || cards.length < 2) return;

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slideDuration = reduce ? 0 : 860;
    let activeIndex = 0;
    let perView = getPerView();
    let autoTimer = null;
    let isMoving = false;

    function getPerView() {
      if (window.innerWidth <= 700) return 1;
      if (window.innerWidth <= 1100) return 2;
      return 3;
    }

    function getVisibleCards() {
      return Array.from(track.querySelectorAll('[data-research-collab-card]'));
    }

    function getStep() {
      const visible = getVisibleCards();
      if (visible.length < 2) return visible[0]?.getBoundingClientRect().width || 0;
      return visible[1].offsetLeft - visible[0].offsetLeft;
    }

    function resetTrack() {
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0, 0, 0)';
      track.offsetHeight;
      track.style.transition = '';
    }

    function setControlsDisabled(disabled) {
      [prev, next].forEach((button) => {
        if (!button) return;
        button.disabled = disabled;
        button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      });
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll('button').forEach((dot) => {
        dot.disabled = disabled;
      });
    }

    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      cards.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show collaborating organization ${index + 1}`);
        dot.addEventListener('click', () => {
          jumpTo(index);
          startAuto();
        });
        dotsWrap.appendChild(dot);
      });
      updateDots();
    }

    function updateDots() {
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll('button').forEach((dot, index) => {
        const active = index === activeIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }

    function jumpTo(index) {
      if (isMoving) return;
      const nextIndex = ((index % cards.length) + cards.length) % cards.length;
      const ordered = cards.slice(nextIndex).concat(cards.slice(0, nextIndex));
      ordered.forEach((card) => track.appendChild(card));
      activeIndex = nextIndex;
      resetTrack();
      updateDots();
    }

    function goNext() {
      if (isMoving || cards.length <= perView) return;
      const step = getStep();
      if (!step) return;

      isMoving = true;
      setControlsDisabled(true);
      track.style.transform = `translate3d(${-step}px, 0, 0)`;

      window.setTimeout(() => {
        const first = getVisibleCards()[0];
        if (first) track.appendChild(first);
        activeIndex = (activeIndex + 1) % cards.length;
        resetTrack();
        isMoving = false;
        setControlsDisabled(false);
        updateDots();
      }, slideDuration);
    }

    function goPrev() {
      if (isMoving || cards.length <= perView) return;
      const visible = getVisibleCards();
      const first = visible[0];
      const last = visible[visible.length - 1];
      if (!first || !last) return;

      isMoving = true;
      setControlsDisabled(true);
      track.insertBefore(last, first);
      const step = getStep();
      track.style.transition = 'none';
      track.style.transform = `translate3d(${-step}px, 0, 0)`;
      track.offsetHeight;
      track.style.transition = '';

      window.requestAnimationFrame(() => {
        track.style.transform = 'translate3d(0, 0, 0)';
      });

      window.setTimeout(() => {
        activeIndex = (activeIndex - 1 + cards.length) % cards.length;
        resetTrack();
        isMoving = false;
        setControlsDisabled(false);
        updateDots();
      }, slideDuration);
    }

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if (reduce || cards.length <= perView) return;
      autoTimer = window.setInterval(goNext, 4300);
    }

    prev?.addEventListener('click', () => {
      goPrev();
      startAuto();
    });

    next?.addEventListener('click', () => {
      goNext();
      startAuto();
    });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', startAuto);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        perView = getPerView();
        carousel.style.setProperty('--research-collab-per-view', perView);
        resetTrack();
        startAuto();
      }, 120);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    carousel.style.setProperty('--research-collab-per-view', perView);
    renderDots();
    startAuto();
  }

  window.addEventListener('DOMContentLoaded', initResearchCollaboratorCarousel);
})();

// Homepage dynamic latest updates
(function () {
  const updatePages = [
    'research-publications.html',
    'awards.html',
    'sessions.html'
  ];

  const typeOrder = ['publication', 'recognition', 'session'];
  const typeLabels = {
    publication: 'Publication',
    recognition: 'Recognition',
    session: 'Session'
  };
  const metaLabels = {
    publication: 'Journal/Conference',
    recognition: 'Organization',
    session: 'Organization'
  };
  const actionLabels = {
    publication: 'View Research',
    recognition: 'View Recognitions',
    session: 'View Sessions'
  };
  const placeholderPattern = /\[[^\]]+\]|to be added|placeholder/i;

  function isPlaceholder(value) {
    return !value || placeholderPattern.test(value.trim());
  }

  function parseUpdateDate(value) {
    const raw = (value || '').trim();
    const invalid = {
      raw,
      year: null,
      time: Number.NEGATIVE_INFINITY,
      granularity: 'unknown',
      isValid: false
    };

    if (!raw || placeholderPattern.test(raw)) return invalid;

    let match = raw.match(/^(\d{4})$/);
    if (match) {
      const year = Number(match[1]);
      return {
        raw,
        year,
        time: Date.UTC(year, 11, 31),
        granularity: 'year',
        isValid: true
      };
    }

    match = raw.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month >= 1 && month <= 12) {
        return {
          raw,
          year,
          time: Date.UTC(year, month, 0),
          granularity: 'month',
          isValid: true
        };
      }
      return invalid;
    }

    match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const time = Date.UTC(year, month - 1, day);
      const parsed = new Date(time);

      if (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day
      ) {
        return {
          raw,
          year,
          time,
          granularity: 'day',
          isValid: true
        };
      }
      return invalid;
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        raw,
        year: parsed.getFullYear(),
        time: parsed.getTime(),
        granularity: 'readable',
        isValid: true
      };
    }

    return invalid;
  }

  function isWithinLastTwoYears(value) {
    const parsed = parseUpdateDate(value);
    if (!parsed.isValid || !parsed.year) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const earliestYear = currentYear - 1;

    const calendarStart = new Date(earliestYear, 0, 1);

    return (
      (parsed.year >= earliestYear && parsed.year <= currentYear) ||
      (parsed.time >= calendarStart.getTime() && parsed.time <= now.getTime())
    );
  }

  function compareUpdates(a, b) {
    if (a.parsedDate.time !== b.parsedDate.time) {
      return b.parsedDate.time - a.parsedDate.time;
    }

    return a.order - b.order;
  }

  function isPlaceholderItem(item) {
    return [item.type, item.date, item.title, item.meta, item.link].some(isPlaceholder);
  }

  function readUpdateSource(source, page, order) {
    const type = (source.dataset.updateType || '').trim().toLowerCase();
    const date = (source.dataset.updateDate || '').trim();
    const title = (source.dataset.updateTitle || '').trim();
    const meta = (source.dataset.updateMeta || '').trim();
    const link = (source.dataset.updateLink || page).trim();

    if (!typeOrder.includes(type)) return null;

    return {
      type,
      date,
      title,
      meta,
      link,
      page,
      order,
      parsedDate: parseUpdateDate(date)
    };
  }

  function getRecentUpdates(updates) {
    const recentUpdates = updates
      .filter(update => !isPlaceholderItem(update))
      .filter(update => isWithinLastTwoYears(update.date))
      .sort(compareUpdates);

    return interleaveUpdatesByType(recentUpdates);
  }

  function interleaveUpdatesByType(updates) {
    const grouped = typeOrder.reduce((groups, type) => {
      groups[type] = updates.filter(update => update.type === type);
      return groups;
    }, {});
    const ordered = [];
    let hasItems = true;

    while (hasItems) {
      hasItems = false;

      typeOrder.forEach(type => {
        const next = grouped[type].shift();
        if (!next) return;

        ordered.push(next);
        hasItems = true;
      });
    }

    return ordered;
  }

  function buildUpdateItem(update, index) {
    const item = document.createElement('a');
    item.className = 'update-item';
    item.href = update.link;
    item.dataset.dynamic = 'true';
    item.dataset.updateTypeValue = typeLabels[update.type] || 'Update';
    if (index === 0) item.classList.add('active');

    const dateEl = document.createElement(update.parsedDate.isValid ? 'time' : 'span');
    dateEl.className = 'update-date';
    dateEl.textContent = update.date;
    if (update.parsedDate.isValid) {
      dateEl.setAttribute('datetime', update.date);
    }

    const content = document.createElement('span');
    content.className = 'update-content';

    const title = document.createElement('span');
    title.className = 'update-title';
    title.textContent = update.title;

    const meta = document.createElement('span');
    meta.className = 'update-meta';
    const metaLabel = metaLabels[update.type];
    meta.textContent = metaLabel && update.meta ? `${metaLabel}: ${update.meta}` : update.meta;

    const action = document.createElement('span');
    action.className = 'update-action';
    action.textContent = `${actionLabels[update.type] || 'View'} \u2192`;

    content.appendChild(title);
    content.appendChild(meta);
    item.appendChild(dateEl);
    item.appendChild(content);
    item.appendChild(action);

    return item;
  }

  async function loadAndRenderLatestUpdates(viewport) {
    const updates = [];
    let sourceOrder = 0;

    try {
      const pageDocs = await Promise.all(updatePages.map(async page => {
        const res = await fetch(page, { cache: 'no-cache' });
        if (!res.ok) return null;

        const html = await res.text();
        return {
          page,
          doc: new DOMParser().parseFromString(html, 'text/html')
        };
      }));

      pageDocs.forEach(result => {
        if (!result) return;

        result.doc.querySelectorAll('.update-source').forEach(source => {
          const update = readUpdateSource(source, result.page, sourceOrder);
          sourceOrder += 1;
          if (update) updates.push(update);
        });
      });
    } catch (error) {
      console.warn('Dynamic latest updates require GitHub Pages or a local server.', error);
      return false;
    }

    const selectedUpdates = getRecentUpdates(updates);
    if (!selectedUpdates.length) return false;

    viewport.replaceChildren(...selectedUpdates.map(buildUpdateItem));
    return true;
  }

  async function populateLatestUpdates() {
    const bar = document.querySelector('[data-latest-updates]');
    if (!bar) return;

    const viewport = bar.querySelector('.updates-viewport');
    if (!viewport) return;

    return loadAndRenderLatestUpdates(viewport);
  }

  function rotateUpdates(bar, items, statusType) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = Math.max(0, items.findIndex(item => item.classList.contains('active')));
    let timer = null;
    const intervalMs = 3500;

    function show(index) {
      items.forEach((item, itemIndex) => {
        const isActive = itemIndex === index;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        item.tabIndex = isActive ? 0 : -1;
      });

      const item = items[index];
      if (statusType && item?.dataset.updateTypeValue) {
        statusType.textContent = item.dataset.updateTypeValue;
      }
    }

    function goTo(index) {
      active = ((index % items.length) + items.length) % items.length;
      show(active);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (reduce || items.length < 2) return;
      timer = window.setInterval(() => goTo(active + 1), intervalMs);
    }

    bar.addEventListener('mouseenter', stop);
    bar.addEventListener('mouseleave', start);
    bar.addEventListener('focusin', stop);
    bar.addEventListener('focusout', start);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    show(active);
    start();
  }

  async function initHomepageLatestUpdates() {
    const bar = document.querySelector('[data-latest-updates]');
    if (!document.querySelector('.home-page')) return;
    if (!bar) return;

    await populateLatestUpdates();

    const items = Array.from(bar.querySelectorAll('.update-item'));
    if (!items.length) return;

    const statusType = bar.querySelector('[data-update-type]');
    rotateUpdates(bar, items, statusType);
  }

  window.addEventListener('DOMContentLoaded', initHomepageLatestUpdates);
})();
