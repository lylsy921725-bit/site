import { Store } from './store.js';
import { normalizeAssetPath } from './media.js';

let grid;
let chipGroup;
let lightbox;
let lightboxImage;
let lightboxPrev;
let lightboxNext;
let lightboxClose;
let currentImages = [];
let currentIndex = 0;
let observer;

export function resolveProductImages(product = {}) {
  const cover = norm(product.cover, product);
  const manual = Array.isArray(product.images)
    ? product.images.map((item) => norm(item, product))
    : [];
  return Array.from(new Set([cover, ...manual].filter(Boolean)));

  function norm(input, prod) {
    if (!input) return '';
    let s = String(input).trim().replace(/\\/g, '/').replace(/^(\.\/)+/, '');
    if (!s) return '';
    if (/^https?:\/\//i.test(s) || s.startsWith('assets/')) {
      return normalizeAssetPath(s);
    }
    const coverPath = prod.cover && String(prod.cover).includes('/')
      ? String(prod.cover).split('/').slice(0, -1).join('/')
      : '';
    const base = coverPath || (prod.slug ? `assets/products/${prod.slug}` : '');
    const sanitizedBase = base.replace(/\/+/g, '/').replace(/\/?$/, '');
    const cleanedSegment = s.replace(/^\/+/, '');
    const finalPath = sanitizedBase ? `${sanitizedBase}/${cleanedSegment}` : cleanedSegment;
    return normalizeAssetPath(finalPath);
  }
}

function createSkeleton(count = 6) {
  grid.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const skeleton = document.createElement('article');
    skeleton.className = 'product-card skeleton';
    skeleton.innerHTML = `
      <div class="product-thumb"></div>
      <div class="product-meta">
        <div style="height:20px;background:rgba(255,255,255,0.05);border-radius:8px;"></div>
        <div style="height:16px;background:rgba(255,255,255,0.03);border-radius:8px;"></div>
      </div>
    `;
    grid.appendChild(skeleton);
  }
}

function renderFilters() {
  const { categories } = Store.getState();
  if (!chipGroup) return;
  const active = Store.getFilters().categories;
  const hasActive = active.size > 0;
  const lang = Store.getLanguage();
  chipGroup.innerHTML = '';
  chipGroup.setAttribute('aria-label', lang === 'zh' ? '产品分类标签' : 'Category tags');

  const allChip = document.createElement('button');
  allChip.type = 'button';
  allChip.className = `chip${hasActive ? '' : ' active'}`;
  allChip.textContent = lang === 'zh' ? '全部' : 'All';
  allChip.setAttribute('aria-pressed', String(!hasActive));
  allChip.addEventListener('click', () => {
    if (hasActive) {
      Store.setCategoryFilters([]);
    }
  });
  allChip.setAttribute('role', 'listitem');
  chipGroup.appendChild(allChip);

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = category;
    const isActive = active.has(category);
    if (isActive) {
      button.classList.add('active');
    }
    button.setAttribute('aria-pressed', String(isActive));
    button.setAttribute('role', 'listitem');
    button.addEventListener('click', () => {
      Store.toggleCategory(category);
    });
    chipGroup.appendChild(button);
  });
}

function observeImage(img, card) {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const targetImg = entry.target;
          targetImg.src = targetImg.dataset.src;
          observer.unobserve(targetImg);
        }
      });
    }, { rootMargin: '100px' });
  }
  observer.observe(img);
  img.addEventListener('load', () => {
    card.classList.add('loaded');
  });
  img.addEventListener('error', () => {
    card.classList.add('loaded');
  });
}

function resolveImageSource(path) {
  if (!path) return '';
  if (/^https?:/i.test(path)) {
    return path;
  }
  const normalized = normalizeAssetPath(path) || path;
  try {
    const current = window.location.href.split('#')[0].split('?')[0];
    const base = current.endsWith('/') ? current : `${current.replace(/[^/]*$/, '')}`;
    return new URL(normalized, base || window.location.origin).href;
  } catch (error) {
    return normalized;
  }
}

function openLightbox(images = [], startIndex = 0, options = {}) {
  if (!Array.isArray(images) || !images.length) return;
  const { title = '' } = options || {};
  currentImages = images;
  const safeIndex = Number.isFinite(startIndex) ? startIndex : 0;
  currentIndex = Math.max(0, Math.min(safeIndex, currentImages.length - 1));
  const img = currentImages[currentIndex];
  lightboxImage.src = resolveImageSource(img);
  lightboxImage.alt = title || '';
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.classList.add('open');
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.classList.remove('open');
  lightboxImage.src = '';
  currentImages = [];
  currentIndex = 0;
}

function stepLightbox(delta) {
  if (!currentImages.length) return;
  currentIndex = (currentIndex + delta + currentImages.length) % currentImages.length;
  lightboxImage.src = resolveImageSource(currentImages[currentIndex]);
}

function buildParams(product) {
  const { paramTypes } = Store.getState();
  const fragment = document.createDocumentFragment();
  paramTypes.forEach((param) => {
    const key = param.key;
    if (!product.params || !(key in product.params)) return;
    if (param.hidden) return;
    const value = product.params[key];
    const displayKey = param.label || key;
    const span = document.createElement('span');
    span.innerHTML = `<strong>${displayKey}</strong>${value}${param.unit ? `<small> ${param.unit}</small>` : ''}`;
    fragment.appendChild(span);
  });
  return fragment;
}

function renderProducts(isInitial = false) {
  if (!grid) return;
  if (isInitial) {
    createSkeleton();
  }
  const products = Store.getFilteredProducts();
  if (!products.length) {
    const lang = Store.getLanguage();
    grid.innerHTML = `<p class="empty-state">${lang === 'zh' ? '暂无匹配的产品。' : 'No products match the current filters.'}</p>`;
    return;
  }
  grid.innerHTML = '';
  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.tabIndex = 0;
    card.dataset.id = product.id;
    const thumb = document.createElement('div');
    thumb.className = 'product-thumb';
    const img = document.createElement('img');
    img.dataset.src = product.cover;
    img.alt = product.name;
    img.loading = 'lazy';
    thumb.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'product-meta';
    const title = document.createElement('h3');
    title.textContent = product.name;
    const intro = document.createElement('p');
    intro.className = 'product-intro';
    intro.textContent = product.intro || '';
    const params = document.createElement('div');
    params.className = 'product-params';
    params.appendChild(buildParams(product));
    const status = document.createElement('p');
    status.className = 'product-status';
    status.setAttribute('role', 'status');
    status.hidden = true;

    meta.append(title, intro, params, status);
    card.append(thumb, meta);
    grid.appendChild(card);

    observeImage(img, card);

    let statusTimer;
    const showStatus = (message, { persist = false } = {}) => {
      if (!status) return;
      window.clearTimeout(statusTimer);
      status.textContent = message;
      status.hidden = false;
      if (!persist) {
        statusTimer = window.setTimeout(() => {
          status.hidden = true;
        }, 3200);
      }
    };
    const hideStatus = () => {
      window.clearTimeout(statusTimer);
      status.hidden = true;
    };

    const open = () => {
      const images = resolveProductImages(product);
      if (images.length) {
        openLightbox(images, 0, { title: product.name });
        hideStatus();
      } else {
        const message = Store.getLanguage() === 'zh' ? '暂无可用图集' : 'No gallery images available';
        showStatus(message);
      }
    };

    card.addEventListener('click', () => {
      open();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function mountLightbox() {
  lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  lightboxImage = lightbox.querySelector('img');
  lightboxPrev = lightbox.querySelector('.lightbox-prev');
  lightboxNext = lightbox.querySelector('.lightbox-next');
  lightboxClose = lightbox.querySelector('.lightbox-close');

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => stepLightbox(-1));
  lightboxNext.addEventListener('click', () => stepLightbox(1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox.classList.contains('open')) {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      if (event.key === 'ArrowRight') stepLightbox(1);
    }
  });
}

const initGallery = {
  mount() {
    grid = document.getElementById('productsGrid');
    chipGroup = document.getElementById('categoryChips');
    if (!grid || !chipGroup) return;
    renderFilters();
    renderProducts(true);
    mountLightbox();
    Store.on('filterchange', () => {
      renderFilters();
      renderProducts();
    });
    Store.on('languagechange', renderFilters);
  },
  renderFilters,
  renderProducts
};

export { initGallery, resolveProductImages, openLightbox };
