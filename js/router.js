import { Store } from './store.js';

const sections = ['home', 'products', 'about', 'contact'];
let observer;
let backToTop;
let nav;
let navToggle;
let mobileOpen = false;
let screenQuery;
let pendingViewportUpdate = false;

function handleNavClick(event) {
  const href = event.currentTarget.getAttribute('href');
  if (href?.startsWith('#')) {
    event.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (mobileOpen) toggleNav(false);
    }
  }
}

function toggleNav(force) {
  mobileOpen = typeof force === 'boolean' ? force : !mobileOpen;
  const expanded = mobileOpen;
  navToggle.setAttribute('aria-expanded', expanded);
  nav.classList.toggle('open', expanded);
  document.body.classList.toggle('nav-open', expanded);
}

function assignScreenMode(mode) {
  document.documentElement.dataset.screen = mode;
  if (document.body) {
    document.body.dataset.screen = mode;
  } else {
    window.addEventListener(
      'DOMContentLoaded',
      () => {
        document.body.dataset.screen = mode;
      },
      { once: true }
    );
  }
}

function applyScreenMode(media) {
  const matches = media?.matches ?? false;
  const mode = matches ? 'mobile' : 'desktop';
  assignScreenMode(mode);
  if (mode === 'desktop' && mobileOpen) {
    toggleNav(false);
  }
}

function updateViewportUnit() {
  if (pendingViewportUpdate) return;
  pendingViewportUpdate = true;
  requestAnimationFrame(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    pendingViewportUpdate = false;
  });
}

function initResponsive() {
  if (typeof window === 'undefined') return;
  if (!screenQuery) {
    screenQuery = window.matchMedia('(max-width: 960px)');
    applyScreenMode(screenQuery);
    screenQuery.addEventListener('change', applyScreenMode);
    updateViewportUnit();
    window.addEventListener('resize', updateViewportUnit);
    window.addEventListener('orientationchange', updateViewportUnit);
    document.documentElement.dataset.responsiveBound = '1';
  }
}

function highlightSection(id) {
  document.querySelectorAll('.primary-nav a').forEach((link) => {
    const target = link.getAttribute('href');
    const match = target === `#${id}`;
    link.classList.toggle('active', match);
  });
}

function watchSections() {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          highlightSection(entry.target.id);
        }
      });
    },
    {
      rootMargin: '-45% 0px -45% 0px'
    }
  );
  sections.forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

function updateBackToTop() {
  const scrollY = window.scrollY;
  backToTop.classList.toggle('visible', scrollY > 300);
}

function initNav() {
  nav = document.querySelector('.primary-nav');
  navToggle = document.querySelector('.nav-toggle');
  backToTop = document.getElementById('backToTop');
  document.querySelectorAll('.primary-nav a').forEach((link) => {
    link.addEventListener('click', handleNavClick);
  });
  if (navToggle) {
    navToggle.addEventListener('click', () => toggleNav());
  }
  if (backToTop) {
    backToTop.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('top').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  window.addEventListener('scroll', updateBackToTop);
  watchSections();
  updateBackToTop();
}

const initRouter = {
  start() {
    initResponsive();
    initNav();
  },
  updateLabels() {
    // placeholder to support language updates
  }
};

Store.on('datachange', () => {
  watchSections();
});

export { initRouter };

if (typeof window !== 'undefined') {
  initResponsive();
}
