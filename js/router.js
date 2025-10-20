import { Store } from './store.js';

const sections = ['home', 'products', 'about', 'contact'];
let observer;
let backToTop;
let nav;
let navToggle;
let mobileOpen = false;

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
