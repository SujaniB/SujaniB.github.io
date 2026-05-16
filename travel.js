(() => {
  const page = document.querySelector('.journey-page');
  if (!page) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    page.classList.add('journey-reduced-motion');
  }

  const tableSurface = page.querySelector('.journey-table-surface');
  if (tableSurface) {
    const tableImage = new Image();
    tableImage.onload = () => tableSurface.classList.remove('table-missing');
    tableImage.onerror = () => tableSurface.classList.add('table-missing');
    tableImage.src = 'assets/hero/journey-table.png';
  }

  const memoryStage = page.querySelector('.journey-memory-stage');
  if (memoryStage) {
    const photoPaths = Array.from({ length: 24 }, (_, index) => `assets/journey/journey-${index + 1}.jpg`);
    const slots = Array.from({ length: 10 }, () => null);
    let photoIndex = 0;
    let slotIndex = 0;
    let zIndex = 20;

    const wireImageFallback = (image) => {
      image.addEventListener('error', () => {
        const holder = image.closest('.journey-memory-photo, .journey-card-photo, .journey-photo-card');
        if (!holder) return;
        holder.classList.add('photo-missing');
        image.hidden = true;
      });
    };

    const createMemoryPhoto = (slot, isInitial = false) => {
      const figure = document.createElement('figure');
      const fallVariant = (photoIndex % 6) + 1;
      figure.className = `journey-memory-photo slot-${slot + 1} fall-${fallVariant}`;
      figure.style.setProperty('--z', zIndex);
      zIndex += 1;

      const image = document.createElement('img');
      image.className = 'journey-photo-img';
      image.src = photoPaths[photoIndex % photoPaths.length];
      image.alt = '';
      photoIndex += 1;
      wireImageFallback(image);

      figure.appendChild(image);

      if (isInitial || reducedMotion) {
        figure.classList.add('is-settled');
      } else {
        figure.classList.add('is-dropping');
      }

      return figure;
    };

    memoryStage.querySelectorAll('.journey-memory-photo').forEach((photo) => photo.remove());

    slots.forEach((_, index) => {
      const photo = createMemoryPhoto(index, true);
      slots[index] = photo;
      memoryStage.appendChild(photo);
    });

    if (!reducedMotion) {
      window.setInterval(() => {
        const targetSlot = slotIndex % slots.length;
        const oldPhoto = slots[targetSlot];
        const newPhoto = createMemoryPhoto(targetSlot);
        slots[targetSlot] = newPhoto;
        slotIndex += 1;

        memoryStage.appendChild(newPhoto);

        newPhoto.addEventListener('animationend', () => {
          newPhoto.classList.remove('is-dropping');
          newPhoto.classList.add('is-settled');

          if (oldPhoto) {
            oldPhoto.classList.add('is-removing');
            window.setTimeout(() => oldPhoto.remove(), 700);
          }
        }, { once: true });
      }, 2150);
    }
  }

  const staticImages = Array.from(page.querySelectorAll('.journey-card-photo .journey-photo-img, .journey-photo-card .journey-photo-img'));
  staticImages.forEach((image) => {
    image.addEventListener('error', () => {
      const holder = image.closest('.journey-card-photo, .journey-photo-card');
      if (!holder) return;
      holder.classList.add('photo-missing');
      image.hidden = true;
    });
  });
})();
