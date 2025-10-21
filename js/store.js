const DRAFT_KEY = 'erawood_draft_v1';
const PERSIST_KEY = 'erawood_saved_v1';
const LANG_KEY = 'erawood_lang';

const emitter = new EventTarget();

const defaultState = {
  site: null,
  paramTypes: [],
  categories: [],
  products: []
};
const hasStructuredClone = typeof structuredClone === 'function';

let state = hasStructuredClone ? structuredClone(defaultState) : JSON.parse(JSON.stringify(defaultState));
let language = localStorage.getItem(LANG_KEY) || 'zh';
let filters = {
  categories: new Set(),
  search: ''
};

const clone = (data) => JSON.parse(JSON.stringify(data));

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function mergeDeep(base = {}, override = {}) {
  const result = { ...base };
  Object.keys(override).forEach((key) => {
    const baseValue = result[key];
    const overrideValue = override[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = mergeDeep(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  });
  return result;
}

function readState(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('本地数据解析失败', error);
    return null;
  }
}

function writeState(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('本地数据保存失败', error);
    return false;
  }
}

function clearState(key) {
  localStorage.removeItem(key);
}

function mergeState(base, override) {
  const baseSite = clone(base?.site || {});
  const overrideSite = override?.site ? clone(override.site) : null;
  return {
    site: overrideSite ? mergeDeep(baseSite, overrideSite) : baseSite,
    paramTypes: clone(override?.paramTypes ?? base?.paramTypes ?? []),
    categories: clone(override?.categories ?? base?.categories ?? []),
    products: clone(override?.products ?? base?.products ?? [])
  };
}

function loadDraft() {
  return readState(DRAFT_KEY);
}

function loadPersisted() {
  return readState(PERSIST_KEY);
}

function commitState() {
  const snapshot = clone(state);
  const success = writeState(PERSIST_KEY, snapshot);
  if (success) {
    clearState(DRAFT_KEY);
    emit('saved', { updatedAt: Date.now() });
  }
  return success;
}

function emit(type, detail) {
  emitter.dispatchEvent(new CustomEvent(type, { detail }));
}

function notifyDataChange() {
  emit('datachange', clone(state));
}

async function fetchJSON(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('网络错误');
  return response.json();
}

const Store = {
  async load() {
    if (state.site) return state;
    const data = await fetchJSON('data/site.json');
    const persisted = loadPersisted();
    const draft = loadDraft();
    const base = mergeState(data, persisted);
    state = draft ? mergeState(base, draft) : base;
    notifyDataChange();
    return state;
  },
  on(event, handler) {
    emitter.addEventListener(event, handler);
  },
  off(event, handler) {
    emitter.removeEventListener(event, handler);
  },
  getState() {
    return state;
  },
  setState(partial, { persist = true } = {}) {
    state = {
      ...state,
      ...clone(partial)
    };
    if (persist) {
      commitState();
    }
    notifyDataChange();
  },
  clearDraft() {
    clearState(DRAFT_KEY);
    clearState(PERSIST_KEY);
  },
  getLanguage() {
    return language;
  },
  setLanguage(next) {
    language = next;
    localStorage.setItem(LANG_KEY, next);
    emit('languagechange', next);
  },
  getFilters() {
    return {
      categories: new Set(filters.categories),
      search: filters.search
    };
  },
  setCategoryFilters(list) {
    filters.categories = new Set(list);
    emit('filterchange', this.getFilters());
  },
  setSearch(keyword) {
    filters.search = keyword;
    emit('filterchange', this.getFilters());
  },
  toggleCategory(key) {
    if (filters.categories.has(key)) {
      filters.categories.delete(key);
    } else {
      filters.categories.add(key);
    }
    emit('filterchange', this.getFilters());
  },
  resetFilters() {
    filters = { categories: new Set(), search: '' };
    emit('filterchange', this.getFilters());
  },
  getFilteredProducts() {
    const activeCategories = Array.from(filters.categories);
    const keyword = filters.search.toLowerCase();
    return state.products.filter((product) => {
      const matchCategory = !activeCategories.length || activeCategories.some((key) => product.categories?.includes(key));
      const tokens = [product.name, product.slug, product.intro, ...(product.tags || [])]
        .filter(Boolean)
        .map((text) => text.toLowerCase());
      const matchKeyword = !keyword || tokens.some((text) => text.includes(keyword));
      return matchCategory && matchKeyword;
    });
  },
  updateCategories(newCategories) {
    state.categories = clone(newCategories);
    const success = commitState();
    notifyDataChange();
    return success;
  },
  updateParamTypes(newParamTypes) {
    state.paramTypes = clone(newParamTypes);
    const success = commitState();
    notifyDataChange();
    return success;
  },
  updateProducts(newProducts) {
    state.products = clone(newProducts);
    const success = commitState();
    notifyDataChange();
    return success;
  },
  updateSite(newSite) {
    state.site = clone(newSite);
    const success = commitState();
    notifyDataChange();
    return success;
  },
  exportData() {
    return clone(state);
  },
  applyImport(data) {
    state = mergeState(data, null);
    const success = commitState();
    notifyDataChange();
    return success;
  },
  isMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  }
};

window.Store = Store;
export { Store };
