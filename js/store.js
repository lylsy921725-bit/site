const DRAFT_KEY = 'erawood_draft_v1';
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

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('草稿解析失败', error);
    return null;
  }
}

function persistDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('草稿保存失败', error);
  }
}

function mergeState(base, draft) {
  const source = draft ? { ...base, ...draft } : base;
  return {
    site: clone(source.site || base.site || {}),
    paramTypes: clone(source.paramTypes || []),
    categories: clone(source.categories || []),
    products: clone(source.products || [])
  };
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
    const draft = loadDraft();
    state = mergeState(data, draft);
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
      persistDraft(state);
    }
    notifyDataChange();
  },
  clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
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
    persistDraft(state);
    notifyDataChange();
  },
  updateParamTypes(newParamTypes) {
    state.paramTypes = clone(newParamTypes);
    persistDraft(state);
    notifyDataChange();
  },
  updateProducts(newProducts) {
    state.products = clone(newProducts);
    persistDraft(state);
    notifyDataChange();
  },
  updateSite(newSite) {
    state.site = clone(newSite);
    persistDraft(state);
    notifyDataChange();
  },
  exportData() {
    return clone(state);
  },
  applyImport(data) {
    state = mergeState(data, null);
    persistDraft(state);
    notifyDataChange();
  },
  isMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  }
};

window.Store = Store;
export { Store };
