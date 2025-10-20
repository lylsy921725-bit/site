const IMAGE_EXTENSIONS = ['.avif', '.gif', '.heic', '.jpeg', '.jpg', '.png', '.svg', '.webp'];
const folderCache = new Map();

function normalizeFolderPath(folderPath = '') {
  if (!folderPath) return '';
  const cleaned = folderPath.replace(/\\/g, '/');
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
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
  const baseUrl = new URL(normalized, window.location.href);
  const response = await fetch(normalized, { cache: 'no-store' });
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
  } else {
    images = await parseHtmlListing(response, baseUrl);
  }
  const resolved = dedupe(images).map((path) => toRelativePath(path, baseUrl));
  const sorted = resolved.sort((a, b) => a.localeCompare(b, navigator.language || 'zh-CN'));
  folderCache.set(normalized, sorted);
  return sorted;
}

export function clearFolderCache() {
  folderCache.clear();
}

export { normalizeFolderPath };
