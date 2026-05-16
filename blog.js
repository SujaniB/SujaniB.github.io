(() => {
  const blogPosts = [
    {
      slug: 'blog-posts/opening-the-first-page.html',
      aliases: ['opening-the-first-page.html', 'blog-opening-the-first-page.html'],
      publishedAt: '2026-05-11T12:59:00+05:30',
    },
  ].sort((first, second) => new Date(first.publishedAt) - new Date(second.publishedAt));
  const pageNumberWords = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

  document.querySelectorAll('[data-blog-page-number]').forEach((target) => {
    const slug = target.dataset.postSlug || window.location.pathname.split('/').pop();
    const postIndex = blogPosts.findIndex((post) => post.slug === slug || post.aliases?.includes(slug));
    if (postIndex < 0) return;

    const pageWord = pageNumberWords[postIndex] || `${postIndex + 1}th`;
    target.textContent = `${pageWord} page`;
  });

  const readingDateTargets = document.querySelectorAll('[data-reading-date]');
  const readingTimeTargets = document.querySelectorAll('[data-reading-time]');
  if (readingDateTargets.length || readingTimeTargets.length) {
    const dateFormatter = new Intl.DateTimeFormat([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    const updateReadingTimestamp = () => {
      const now = new Date();
      const readableDate = dateFormatter.format(now);
      const machineDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');
      const readableTime = timeFormatter.format(now);
      const machineTime = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
      ].join(':');

      readingDateTargets.forEach((target) => {
        target.textContent = readableDate;
        target.setAttribute('datetime', machineDate);
      });

      readingTimeTargets.forEach((target) => {
        target.textContent = readableTime;
        target.setAttribute('datetime', machineTime);
      });
    };

    updateReadingTimestamp();
    setInterval(updateReadingTimestamp, 1000);
  }

  const page = document.querySelector('.blog-page');
  if (!page) return;

  const heroImage = page.querySelector('.blog-sketch-visual img');
  if (heroImage) {
    heroImage.addEventListener('error', () => {
      heroImage.hidden = true;
    });
  }

  const clock = page.querySelector('[data-blog-clock]');
  if (clock) {
    const hourHand = clock.querySelector('[data-blog-hour]');
    const minuteHand = clock.querySelector('[data-blog-minute]');
    const secondHand = clock.querySelector('[data-blog-second]');
    const locationText = page.querySelector('[data-blog-clock-location]');
    const timeText = page.querySelector('[data-blog-clock-text]');
    const amText = page.querySelector('[data-blog-clock-am]');
    const pmText = page.querySelector('[data-blog-clock-pm]');

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'your place';
    const placeName = timeZone.split('/').pop().replace(/_/g, ' ');
    if (locationText) locationText.textContent = placeName;

    const updateClock = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours() % 12;
      const period = now.getHours() >= 12 ? 'pm' : 'am';

      secondHand?.style.setProperty('--clock-angle', `${seconds * 6}deg`);
      minuteHand?.style.setProperty('--clock-angle', `${(minutes * 6) + (seconds * .1)}deg`);
      hourHand?.style.setProperty('--clock-angle', `${(hours * 30) + (minutes * .5)}deg`);
      if (timeText) {
        const hour12 = now.getHours() % 12 || 12;
        timeText.textContent = `${hour12}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      amText?.classList.toggle('is-crossed', period !== 'am');
      pmText?.classList.toggle('is-crossed', period !== 'pm');
      clock.setAttribute('aria-label', `Current time ${now.toLocaleTimeString()}`);
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  const calendar = page.querySelector('[data-blog-calendar]');
  if (calendar) {
    const monthLabel = page.querySelector('[data-blog-calendar-month]');
    const yearLabel = page.querySelector('[data-blog-calendar-year]');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthName = new Intl.DateTimeFormat([], { month: 'long' }).format(today);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (monthLabel) monthLabel.textContent = monthName;
    if (yearLabel) yearLabel.textContent = String(year);
    calendar.setAttribute('aria-label', `${monthName} ${year} calendar`);
    calendar.replaceChildren();

    dayNames.forEach((day) => {
      const item = document.createElement('span');
      item.className = 'blog-calendar-day';
      item.textContent = day;
      calendar.append(item);
    });

    for (let index = 0; index < firstDay; index += 1) {
      const empty = document.createElement('span');
      empty.className = 'blog-calendar-empty';
      empty.setAttribute('aria-hidden', 'true');
      calendar.append(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const item = document.createElement('span');
      const number = document.createElement('span');
      number.className = 'blog-calendar-number';
      number.textContent = String(day);

      item.className = 'blog-calendar-date';
      item.append(number);
      if (day < today.getDate()) {
        item.classList.add('is-crossed-date');
      }
      if (day === today.getDate()) {
        item.classList.add('is-today');
        item.setAttribute('aria-current', 'date');
        item.setAttribute('aria-label', `Today, ${monthName} ${day}, ${year}`);
      }
      calendar.append(item);
    }
  }

  const categoryButtons = Array.from(page.querySelectorAll('.blog-category-chip'));
  const recentCards = Array.from(page.querySelectorAll('[data-recent-post-card]'));
  const allCards = Array.from(page.querySelectorAll('[data-all-post-card]'));
  const recentEmptyNote = page.querySelector('[data-recent-empty]');
  const allEmptyNote = page.querySelector('[data-all-empty]');
  const allNotesTitle = page.querySelector('[data-all-notes-title]');
  const recentNote = page.querySelector('[data-recent-note]');
  const allNotesNote = page.querySelector('[data-all-notes-note]');
  const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  let audioContext;
  const playPageTurnSound = () => {
    try {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) return;

      audioContext = audioContext || new AudioContextConstructor();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const duration = .34;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);

      for (let index = 0; index < data.length; index += 1) {
        const progress = index / data.length;
        const attack = Math.min(1, progress / .08);
        const release = Math.pow(1 - progress, 1.8);
        data[index] = (Math.random() * 2 - 1) * attack * release;
      }

      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(260, audioContext.currentTime + duration);
      filter.Q.value = .72;

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.055, audioContext.currentTime + .035);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      noise.start();
      noise.stop(audioContext.currentTime + duration);
    } catch {
      // The animation still works if browser audio is unavailable.
    }
  };

  let isOpeningBook = false;
  const openBookThenNavigate = (href) => {
    if (!href || isOpeningBook) return;
    isOpeningBook = true;
    playPageTurnSound();

    if (reducedMotion) {
      window.setTimeout(() => {
        window.location.href = href;
      }, 120);
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'blog-book-open-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="blog-open-book">
        <span class="blog-open-book-shadow"></span>
        <span class="blog-open-page blog-open-left"></span>
        <span class="blog-open-page blog-open-right"></span>
        <span class="blog-open-cover"></span>
        <span class="blog-open-page-turn"></span>
      </div>
    `;
    document.body.append(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('is-turning');
    });

    window.setTimeout(() => {
      window.location.href = href;
    }, 980);
  };

  page.querySelectorAll('[data-book-open]').forEach((tile) => {
    const readHref = () => tile.dataset.bookOpen || tile.querySelector('a[href]')?.href;

    tile.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      const href = link?.href || readHref();
      if (!href) return;

      event.preventDefault();
      openBookThenNavigate(href);
    });

    tile.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      openBookThenNavigate(readHref());
    });
  });

  if (!categoryButtons.length || !allCards.length) return;

  const activateCategory = (filter, activeButton) => {
    categoryButtons.forEach((item) => item.classList.remove('is-active'));
    activeButton?.classList.add('is-active');

    const label = activeButton?.textContent?.trim() || 'All Notes';
    const recentCutoff = new Date();
    recentCutoff.setMonth(recentCutoff.getMonth() - 3);

    const matchesFilter = (card) => {
      const labels = (card.dataset.labels || '').split(/\s+/).filter(Boolean);
      return filter === 'all' || labels.includes(filter);
    };
    const isRecent = (card) => new Date(card.dataset.published) >= recentCutoff;

    let recentVisibleCount = 0;
    recentCards.forEach((card) => {
      const isVisible = matchesFilter(card) && isRecent(card);
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) recentVisibleCount += 1;
    });

    let allVisibleCount = 0;
    allCards.forEach((card) => {
      const isVisible = matchesFilter(card);
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) allVisibleCount += 1;
    });

    if (recentNote) {
      recentNote.textContent = filter === 'all'
        ? 'Notes from the last 3 months.'
        : `Notes under ${label} from the last 3 months.`;
    }

    if (allNotesTitle) {
      allNotesTitle.textContent = filter === 'all' ? 'All Notes' : `All Notes Under ${label}`;
    }

    if (allNotesNote) {
      allNotesNote.textContent = filter === 'all' ? 'All published notes.' : `Every published note labeled ${label}.`;
    }

    if (recentEmptyNote) {
      recentEmptyNote.textContent = filter === 'all'
        ? 'No recent notes from the last 3 months.'
        : `No recent notes under ${label} from the last 3 months.`;
      recentEmptyNote.hidden = recentVisibleCount > 0;
    }

    if (allEmptyNote) {
      allEmptyNote.textContent = filter === 'all'
        ? 'No notes have been posted yet.'
        : `No posts under ${label} yet.`;
      allEmptyNote.hidden = allVisibleCount > 0;
    }
  };

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activateCategory(button.dataset.filter || 'all', button);
    });
  });

  const hashTarget = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
  if (hashTarget?.classList.contains('blog-category-chip')) {
    activateCategory(hashTarget.dataset.filter || 'all', hashTarget);
    requestAnimationFrame(() => hashTarget.scrollIntoView({ block: 'center' }));
  } else {
    const defaultButton = categoryButtons.find((button) => button.classList.contains('is-active')) || categoryButtons[0];
    activateCategory(defaultButton?.dataset.filter || 'all', defaultButton);
  }
})();
