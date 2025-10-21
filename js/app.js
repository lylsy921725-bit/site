import { renderNav, renderHero, renderProducts, renderAbout, renderContact } from './renderers.js';
import { loadSiteJSON } from './store.js';

window.addEventListener('DOMContentLoaded', init);

async function init() {
  let data;
  try {
    data = await loadSiteJSON();
  } catch (error) {
    console.error('site.json 加载失败', error);
    data = (error && error.fallback) || { site: {}, paramTypes: [], categories: [], products: [] };
  }
  window.SITE = data;
  safeRun(() => renderNav(data.site || {}));
  safeRun(() => renderHero(data.site || {}));
  safeRun(() => renderProducts(data));
  safeRun(() => renderAbout(data.site || {}));
  safeRun(() => renderContact(data.site || {}));
}

function safeRun(fn) {
  if (typeof fn !== 'function') return;
  try {
    fn();
  } catch (error) {
    console.error(error);
  }
}

