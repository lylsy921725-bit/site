const IMAGE_EXTENSIONS = ['.avif', '.gif', '.heic', '.jpeg', '.jpg', '.png', '.svg', '.webp'];
const folderCache = new Map();

function getOrigin() {
  if (typeof window === 'undefined') return '';
  try {
    return window.location.origin;
  } catch (error) {
    return '';
  }
}

function normalizeAssetPath(value = '') {
  if (!value) return '';
  let cleaned = value.trim().replace(/\\/g, '/');
  if (!cleaned) return '';
  if (/^https?:/i.test(cleaned)) {
    return cleaned;
  }
  cleaned = cleaned.replace(/^(\.\.\/)+/, '');
  cleaned = cleaned.replace(/^(\.\/)+/, '');
  cleaned = cleaned.replace(/^\/+/, '');
  cleaned = cleaned.replace(/\/{2,}/g, '/');
  cleaned = cleaned.replace(/[#?].*$/, '');
  return cleaned;
}

function normalizeFolderPath(folderPath = '') {
  if (!folderPath) return '';
  let cleaned = folderPath.trim().replace(/\\/g, '/');
  if (!cleaned) return '';

  const origin = getOrigin();

  if (/^https?:/i.test(cleaned)) {
    try {
      const url = new URL(cleaned);
      cleaned = url.pathname || '';
    } catch (error) {
      cleaned = cleaned.replace(/^https?:\/\//i, '');
    }
  }

  if (origin && cleaned.startsWith(origin)) {
    cleaned = cleaned.slice(origin.length);
  }

  cleaned = cleaned.replace(/^(\.\.\/)+/, '');
  cleaned = cleaned.replace(/^(\.\/)+/, '');
  cleaned = cleaned.replace(/^\/+/, '');
  cleaned = cleaned.replace(/\/{2,}/g, '/');

  if (IMAGE_EXTENSIONS.some((ext) => cleaned.toLowerCase().endsWith(ext))) {
    const lastSlash = cleaned.lastIndexOf('/');
    cleaned = lastSlash >= 0 ? cleaned.slice(0, lastSlash + 1) : '';
  }

  const hashIndex = cleaned.indexOf('#');
  if (hashIndex !== -1) {
    cleaned = cleaned.slice(0, hashIndex);
  }
  const queryIndex = cleaned.indexOf('?');
  if (queryIndex !== -1) {
    cleaned = cleaned.slice(0, queryIndex);
  }

  if (!cleaned) return '';

  if (!cleaned.endsWith('/')) {
    cleaned = `${cleaned}/`;
  }

  return cleaned;
}

function isImage(path = '') {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function toRelativePath(href, baseUrl) {
  try {
    const absolute = new URL(href, baseUrl);
    const decoded = decodeURIComponent(absolute.pathname);
    return decoded.startsWith('/') ? decoded.slice(1) : decoded;
  } catch (error) {
    return href;
  }
}

function dedupe(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

async function parseJsonListing(response) {
  try {
    const json = await response.clone().json();
    const raw = Array.isArray(json) ? json : Array.isArray(json.files) ? json.files : [];
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.path || item.url || item.href || '';
        }
        return '';
      })
      .filter(isImage);
  } catch (error) {
    return [];
  }
}

async function parseXmlListing(response, baseUrl, normalized) {
  try {
    const text = await response.clone().text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const keys = Array.from(doc.getElementsByTagName('Key'));
    if (!keys.length) return [];
    return keys
      .map((node) => (node.textContent || '').trim())
      .filter((value) => value && isImage(value))
      .map((value) => {
        let candidate = value;
        if (!candidate.startsWith(normalized) && !candidate.startsWith('/')) {
          candidate = `${normalized}${candidate}`;
        }
        if (!candidate.startsWith('http')) {
          candidate = candidate.replace(/\/+/g, '/');
        }
        return toRelativePath(candidate, baseUrl);
      });
  } catch (error) {
    return [];
  }
}

async function parseHtmlListing(response, baseUrl) {
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const anchors = Array.from(doc.querySelectorAll('a'));
  return anchors
    .map((anchor) => anchor.getAttribute('href') || '')
    .filter((href) => href && !href.startsWith('../') && !href.includes('?'))
    .map((href) => toRelativePath(href, baseUrl))
    .filter(isImage);
}

export async function listFolderImages(folderPath, { revalidate = false } = {}) {
  const normalized = normalizeFolderPath(folderPath);
  if (!normalized) return [];
  if (!revalidate && folderCache.has(normalized)) {
    return folderCache.get(normalized);
  }
  const origin = getOrigin() || 'http://localhost';
  const baseUrl = new URL(normalized, origin.endsWith('/') ? origin : `${origin}/`);
  const response = await fetch(baseUrl.href, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`无法访问文件夹 ${normalized}`);
  }
  const contentType = response.headers.get('content-type') || '';
  let images = [];
  if (contentType.includes('application/json')) {
    images = await parseJsonListing(response);
    if (!images.length) {
      const fallback = await parseHtmlListing(response, baseUrl);
      images = fallback;
    }
  } else if (contentType.includes('xml')) {
    images = await parseXmlListing(response, baseUrl, normalized);
    if (!images.length) {
      const fallback = await parseHtmlListing(response, baseUrl);
      images = fallback;
    }
  } else {
    images = await parseHtmlListing(response, baseUrl);
  }
  const resolved = dedupe(images)
    .map((path) => toRelativePath(path, baseUrl))
    .map((path) => normalizeAssetPath(path))
    .filter(Boolean);
  const sorted = resolved.sort((a, b) => a.localeCompare(b, navigator.language || 'zh-CN'));
  folderCache.set(normalized, sorted);
  return sorted;
}

export function clearFolderCache() {
  folderCache.clear();
}

export { normalizeFolderPath, normalizeAssetPath };
