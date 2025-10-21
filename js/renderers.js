import { Store } from './store.js';
import { initRouter } from './router.js';
import { initGallery } from './gallery.js';

const langStrings = {
  zh: {
    hero: {
      tag: '智序木构 · 全栈交付',
      title: '木纪元智造',
      subtitle: '以AI与机器人重塑可持续木结构建筑，让自然与科技共鸣。',
      cta: '探索产品矩阵',
      secondary: '联系顾问'
    },
    nav: { home: '首页', products: '产品探索', about: '关于', contact: '联系我们' },
    products: { eyebrow: 'Product Atlas', title: '产品探索' },
    filters: { label: '产品筛选', all: '全部' },
    about: { eyebrow: 'About', title: '关于我们' },
    contact: { eyebrow: 'Contact', title: '联系我们' }
  },
  en: {
    hero: {
      tag: 'Orchestrated Timber · Full-stack Delivery',
      title: 'Erawood Fabrication',
      subtitle: 'AI-directed timber engineering for regenerative destinations across the globe.',
      cta: 'Discover Collection',
      secondary: 'Talk to us'
    },
    nav: { home: 'Home', products: 'Products', about: 'About', contact: 'Contact' },
    products: { eyebrow: 'Product Atlas', title: 'Product Exploration' },
    filters: { label: 'Product filters', all: 'All' },
    about: { eyebrow: 'About', title: 'About Us' },
    contact: { eyebrow: 'Contact', title: 'Contact Us' }
  }
};

const refs = {
  app: null,
  heroImage: null,
  heroSource: null,
  heroOverlay: null,
  brandLogo: null,
  brandLink: null,
  brandZh: null,
  brandEn: null,
  aboutContent: null,
  contactAddress: null,
  contactPhone: null,
  contactEmail: null,
  contactYoutube: null,
  footerText: null,
  langToggle: null,
  searchInput: null,
  productsToolbar: null,
  navLinks: []
};

const defaults = {
  heroDesktop: '',
  heroMobile: '',
  heroAlt: 'Erawood Fabrication hero',
  logo: 'assets/logo.svg',
  footer: '© Erawood Fabrication',
  brandZh: '木纪元智造',
  brandEn: 'ErawoodFabrication'
};

let heroMediaQuery;
let listenersBound = false;
let galleryMounted = false;
let routerStarted = false;
const heroState = {
  desktop: '',
  mobile: '',
  alt: ''
};

function ensureRefs() {
  if (!refs.app) {
    refs.app = document.getElementById('app');
  }
  if (!refs.heroImage) {
    refs.heroImage = document.getElementById('heroImage');
    if (refs.heroImage) {
      defaults.heroDesktop = refs.heroImage.getAttribute('src') || defaults.heroDesktop;
      defaults.heroAlt = refs.heroImage.getAttribute('alt') || defaults.heroAlt;
    }
  }
  if (!refs.heroSource) {
    refs.heroSource = document.querySelector('.hero-media source');
    if (refs.heroSource && !defaults.heroMobile) {
      defaults.heroMobile = refs.heroSource.getAttribute('srcset') || defaults.heroDesktop;
    }
  }
  if (!refs.heroOverlay) {
    refs.heroOverlay = document.querySelector('.hero-overlay');
  }
  if (!refs.brandLogo) {
    refs.brandLogo = document.querySelector('.brand-logo');
  }
  if (!refs.brandLink) {
    refs.brandLink = document.querySelector('.brand-link');
  }
  if (!refs.brandZh) {
    refs.brandZh = document.querySelector('.brand-zh');
    if (refs.brandZh && !defaults.brandZh) {
      defaults.brandZh = refs.brandZh.textContent || defaults.brandZh;
    }
  }
  if (!refs.brandEn) {
    refs.brandEn = document.querySelector('.brand-en');
    if (refs.brandEn && !defaults.brandEn) {
      defaults.brandEn = refs.brandEn.textContent || defaults.brandEn;
    }
  }
  if (!refs.aboutContent) {
    refs.aboutContent = document.getElementById('aboutContent');
  }
  if (!refs.contactAddress) {
    refs.contactAddress = document.getElementById('contactAddress');
  }
  if (!refs.contactPhone) {
    refs.contactPhone = document.getElementById('contactPhone');
  }
  if (!refs.contactEmail) {
    refs.contactEmail = document.getElementById('contactEmail');
  }
  if (!refs.contactYoutube) {
    refs.contactYoutube = document.getElementById('contactYoutube');
  }
  if (!refs.footerText) {
    refs.footerText = document.getElementById('footerText');
  }
  if (!refs.langToggle) {
    refs.langToggle = document.getElementById('langToggle');
  }
  if (!refs.searchInput) {
    refs.searchInput = document.getElementById('productSearch');
  }
  if (!refs.productsToolbar) {
    refs.productsToolbar = document.querySelector('.products-toolbar');
  }
  refs.navLinks = Array.from(document.querySelectorAll('.primary-nav a'));
}

function getLocalizedValue(source, lang) {
  const locale = typeof lang === 'string' ? lang : 'zh';
  if (source == null) return '';
  if (typeof source === 'string' || typeof source === 'number') {
    return String(source);
  }
  if (typeof source === 'object') {
    if (typeof source[locale] === 'string' && source[locale].trim()) {
      return source[locale];
    }
    if (locale.startsWith('zh') && typeof source.zh === 'string' && source.zh.trim()) {
      return source.zh;
    }
    if (locale.startsWith('en') && typeof source.en === 'string' && source.en.trim()) {
      return source.en;
    }
    const values = Object.values(source).filter((value) => typeof value === 'string' && value.trim());
    if (values.length) return values[0];
  }
  return '';
}

function applyTheme(site = {}) {
  ensureRefs();
  if (!refs.app) return;
  const accent = site.theme?.accent || '#1BB9A5';
  const bg = site.theme?.bg || '#0B0F14';
  refs.app.style.setProperty('--accent', accent);
  refs.app.style.setProperty('--bg-base', bg);
}

function updateBranding(site = {}, lang = 'zh') {
  ensureRefs();
  const label = lang === 'zh' ? site.brandZh || defaults.brandZh : site.brandEn || site.brandZh || defaults.brandEn;
  if (refs.brandLogo) {
    refs.brandLogo.src = site.logo || defaults.logo;
    refs.brandLogo.alt = label;
  }
  if (refs.brandLink) {
    refs.brandLink.setAttribute('aria-label', label);
  }
}

function updateNavLabels(site = {}) {
  ensureRefs();
  if (!Array.isArray(site.nav)) return;
  refs.navLinks.forEach((link, index) => {
    if (site.nav[index]) {
      link.textContent = site.nav[index];
    }
  });
}

function applyLanguageStrings(lang) {
  ensureRefs();
  const strings = langStrings[lang] || langStrings.zh;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document
    .querySelectorAll('[data-i18n]')
    .forEach((node) => {
      const path = node.getAttribute('data-i18n').split('.');
      let value = strings;
      for (const key of path) {
        if (value && key in value) {
          value = value[key];
        }
      }
      if (typeof value === 'string') {
        node.textContent = value;
      }
    });
  document.querySelectorAll('[data-i18n-placeholder-zh]').forEach((input) => {
    const zh = input.dataset.i18nPlaceholderZh;
    const en = input.dataset.i18nPlaceholderEn;
    input.placeholder = lang === 'zh' ? zh : en;
  });
  if (refs.productsToolbar) {
    refs.productsToolbar.setAttribute('aria-label', strings.filters.label);
  }
  if (refs.langToggle) {
    refs.langToggle.querySelectorAll('span').forEach((span) => {
      span.classList.toggle('active', span.dataset.lang === lang);
    });
  }
}

function guessMime(path = '') {
  const ext = path.split('.').pop()?.toLowerCase();
  const mapping = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif'
  };
  return mapping[ext] || '';
}

function updateHeroSources(site = {}) {
  ensureRefs();
  const hero = site.hero || {};
  heroState.desktop = hero.image || defaults.heroDesktop || '';
  heroState.mobile = hero.mobileImage || defaults.heroMobile || heroState.desktop;
  const lang = Store.getLanguage ? Store.getLanguage() : 'zh';
  heroState.alt = getLocalizedValue(hero.alt, lang) || defaults.heroAlt;

  if (refs.heroSource) {
    refs.heroSource.srcset = heroState.mobile || '';
    const type = guessMime(heroState.mobile);
    if (type) {
      refs.heroSource.type = type;
    } else {
      refs.heroSource.removeAttribute('type');
    }
  }
}

function applyHeroImage() {
  ensureRefs();
  if (!refs.heroImage) return;
  const useMobile = heroMediaQuery?.matches ?? false;
  const nextSrc = useMobile ? heroState.mobile || heroState.desktop : heroState.desktop || heroState.mobile;
  if (nextSrc) {
    refs.heroImage.src = nextSrc;
  }
  refs.heroImage.alt = heroState.alt || defaults.heroAlt;
}

function updateHeroOverlay(site = {}) {
  ensureRefs();
  if (!refs.heroOverlay) return;
  const overlayValue = site.hero?.overlay ?? 0.35;
  refs.heroOverlay.style.setProperty('--hero-overlay', overlayValue);
}

function renderHeroCopy(site = {}) {
  const lang = Store.getLanguage ? Store.getLanguage() : 'zh';
  updateBranding(site, lang);
  updateHeroSources(site);
  applyHeroImage();
  updateHeroOverlay(site);
}

function updateAbout(site = {}) {
  ensureRefs();
  const lang = Store.getLanguage ? Store.getLanguage() : 'zh';
  if (refs.aboutContent) {
    const text = getLocalizedValue(site.about, lang);
    refs.aboutContent.textContent = text;
    refs.aboutContent.hidden = !text;
  }
}

function updateContact(site = {}) {
  ensureRefs();
  const lang = Store.getLanguage ? Store.getLanguage() : 'zh';
  const contact = site.contact || {};
  const social = contact.social || {};

  if (refs.contactAddress) {
    const address = getLocalizedValue(contact.address, lang);
    refs.contactAddress.textContent = address;
    refs.contactAddress.hidden = !address;
  }

  if (refs.contactPhone) {
    const phone = getLocalizedValue(contact.phone, lang);
    if (phone) {
      refs.contactPhone.textContent = phone;
      refs.contactPhone.href = `tel:${phone.replace(/\s+/g, '')}`;
      refs.contactPhone.hidden = false;
    } else {
      refs.contactPhone.textContent = '';
      refs.contactPhone.removeAttribute('href');
      refs.contactPhone.hidden = true;
    }
  }

  if (refs.contactEmail) {
    const email = getLocalizedValue(contact.email, lang);
    if (email) {
      refs.contactEmail.textContent = email;
      refs.contactEmail.href = `mailto:${email}`;
      refs.contactEmail.hidden = false;
    } else {
      refs.contactEmail.textContent = '';
      refs.contactEmail.removeAttribute('href');
      refs.contactEmail.hidden = true;
    }
  }

  if (refs.contactYoutube) {
    let youtubeUrl = '';
    let youtubeLabel = '';
    if (typeof social.youtube === 'string') {
      youtubeUrl = social.youtube;
    } else if (social.youtube && typeof social.youtube === 'object') {
      youtubeUrl = social.youtube.url || social.youtube.href || '';
      youtubeLabel = getLocalizedValue(social.youtube.label || social.youtube.title || social.youtube.text, lang);
      if (!youtubeLabel) {
        youtubeLabel = getLocalizedValue(social.youtube, lang);
      }
    }
    refs.contactYoutube.textContent = youtubeLabel || (lang === 'zh' ? 'YouTube' : 'YouTube');
    if (youtubeUrl) {
      refs.contactYoutube.href = youtubeUrl;
      refs.contactYoutube.hidden = false;
    } else {
      refs.contactYoutube.removeAttribute('href');
      refs.contactYoutube.hidden = true;
    }
  }
}

function handleLanguageChange(lang) {
  applyLanguageStrings(lang);
  const { site } = Store.getState();
  updateBranding(site, lang);
  renderHeroCopy(site);
  updateAbout(site);
  updateContact(site);
  updateNavLabels(site);
  if (galleryMounted) {
    initGallery.renderProducts();
  }
}

function handleFilterChange() {
  ensureRefs();
  const filters = Store.getFilters ? Store.getFilters() : { search: '' };
  if (refs.searchInput && document.activeElement !== refs.searchInput) {
    refs.searchInput.value = filters.search || '';
  }
}

function handleDataChange() {
  const { site } = Store.getState();
  renderNav(site);
  renderHero(site);
  renderAbout(site);
  renderContact(site);
  if (galleryMounted) {
    initGallery.renderFilters();
    initGallery.renderProducts(true);
  }
}

function handleHeroMediaChange() {
  applyHeroImage();
}

function setupListeners() {
  if (listenersBound) return;
  listenersBound = true;
  ensureRefs();

  if (refs.langToggle) {
    refs.langToggle.addEventListener('click', () => {
      const next = Store.getLanguage() === 'zh' ? 'en' : 'zh';
      Store.setLanguage(next);
    });
  }

  if (refs.searchInput) {
    refs.searchInput.addEventListener('input', (event) => {
      Store.setSearch(event.target.value.trim());
    });
  }

  Store.on('languagechange', ({ detail }) => handleLanguageChange(detail));
  Store.on('filterchange', () => handleFilterChange());
  Store.on('datachange', () => handleDataChange());

  if (!heroMediaQuery && typeof window !== 'undefined') {
    heroMediaQuery = window.matchMedia('(max-width: 767px)');
    heroMediaQuery.addEventListener('change', handleHeroMediaChange);
  }

  applyLanguageStrings(Store.getLanguage ? Store.getLanguage() : 'zh');
  if (!routerStarted) {
    initRouter.start();
    routerStarted = true;
  }
}

export function renderNav(site = {}) {
  ensureRefs();
  setupListeners();
  const lang = Store.getLanguage ? Store.getLanguage() : 'zh';
  if (refs.brandZh) {
    refs.brandZh.textContent = site.brandZh || defaults.brandZh;
  }
  if (refs.brandEn) {
    refs.brandEn.textContent = site.brandEn || defaults.brandEn;
  }
  updateBranding(site, lang);
  updateNavLabels(site);
  applyTheme(site);
  if (refs.footerText) {
    refs.footerText.textContent = site.footer || defaults.footer;
  }
}

export function renderHero(site = {}) {
  setupListeners();
  renderHeroCopy(site);
}

export function renderProducts() {
  setupListeners();
  if (!galleryMounted) {
    initGallery.mount();
    galleryMounted = true;
  } else {
    initGallery.renderFilters();
    initGallery.renderProducts(true);
  }
  handleFilterChange();
}

export function renderAbout(site = {}) {
  setupListeners();
  updateAbout(site);
}

export function renderContact(site = {}) {
  setupListeners();
  updateContact(site);
}

