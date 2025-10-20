import { Store } from './store.js';
import { listFolderImages, normalizeFolderPath } from './media.js';

const AUTH_KEY = 'erawood_admin_auth';
const PASSWORD = '123';

const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const adminPassword = document.getElementById('adminPassword');

function openLogin() {
  if (!loginModal) return;
  loginModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => adminPassword?.focus(), 50);
}

function closeLogin() {
  if (!loginModal) return;
  loginModal.setAttribute('aria-hidden', 'true');
  adminPassword.value = '';
}

if (loginModal) {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F12') {
      openLogin();
    }
  });

  loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  adminPassword?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (adminPassword.value === PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, '1');
        closeLogin();
        window.location.href = 'admin.html';
      } else {
        adminPassword.classList.add('error');
        setTimeout(() => adminPassword.classList.remove('error'), 400);
      }
    }
  });

  loginModal.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      closeLogin();
    }
  });
}

function requireAuth() {
  if (sessionStorage.getItem(AUTH_KEY) !== '1') {
    window.location.replace('index.html');
    return false;
  }
  return true;
}

const isAdminPage = document.documentElement.dataset.page === 'admin';
if (isAdminPage && requireAuth()) {
  initAdminApp();
}

function slugify(value = '') {
  const safe = value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe;
}

function initAdminApp() {
  const adminNav = document.querySelectorAll('.admin-nav button');
  const sections = document.querySelectorAll('.admin-section');
  const categoryList = document.getElementById('categoryList');
  const addCategoryBtn = document.getElementById('addCategory');
  const saveCategoryBtn = document.getElementById('saveCategories');
  const paramBody = document.getElementById('paramTypeBody');
  const addParamBtn = document.getElementById('addParamType');
  const saveParamBtn = document.getElementById('saveParamTypes');
  const productList = document.getElementById('productList');
  const productEditor = document.getElementById('productEditor');
  const addProductBtn = document.getElementById('addProduct');
  const saveProductBtn = document.getElementById('saveProducts');
  const siteForm = document.getElementById('siteForm');
  const saveSiteBtn = document.getElementById('saveSite');
  const importFile = document.getElementById('importFile');
  const exportBtn = document.getElementById('exportData');
  const clearDraftBtn = document.getElementById('clearDraft');
  const overlaySlider = document.getElementById('heroOverlay');
  const overlayOutput = document.querySelector('.slider-output span');

  const siteFields = {
    brandZh: document.getElementById('brandZh'),
    brandEn: document.getElementById('brandEn'),
    accent: document.getElementById('accentColor'),
    navLabels: document.getElementById('navLabels'),
    heroImage: document.getElementById('heroImage'),
    heroMobileImage: document.getElementById('heroMobileImage'),
    heroOverlay: document.getElementById('heroOverlay'),
    heroFocalX: document.getElementById('heroFocalX'),
    heroFocalY: document.getElementById('heroFocalY'),
    heroAltZh: document.getElementById('heroAltZh'),
    heroAltEn: document.getElementById('heroAltEn'),
    aboutZh: document.getElementById('aboutZh'),
    aboutEn: document.getElementById('aboutEn'),
    contactAddress: document.getElementById('contactAddress'),
    contactPhone: document.getElementById('contactPhone'),
    contactEmail: document.getElementById('contactEmail'),
    contactYoutube: document.getElementById('contactYoutube'),
    footerText: document.getElementById('footerText')
  };

  const adminBrandZh = document.querySelector('.admin-brand-zh');
  const adminBrandEn = document.querySelector('.admin-brand-en');

  let data = { site: {}, categories: [], paramTypes: [], products: [] };
  let pendingProducts = [];
  let selectedProductId = null;

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  const renderEditorPlaceholder = () => {
    if (!productEditor) return;
    productEditor.dataset.state = 'closed';
    productEditor.innerHTML = `
      <div class="editor-placeholder">
        <h2>选择或新建产品</h2>
        <p>左侧选择一项后，这里将展示完整的编辑表单。</p>
      </div>
    `.trim();
    updateProductSelection();
  };

  function sync() {
    const state = Store.getState();
    data = clone(state);
    pendingProducts = clone(data.products);
    render();
  }

  function render() {
    renderNav();
    renderCategories();
    renderParamTypes();
    renderProducts();
    renderSite();
    if (selectedProductId) {
      const current = pendingProducts.find((item) => item.id === selectedProductId);
      if (!current) {
        selectedProductId = null;
        renderEditorPlaceholder();
        return;
      }
      if (productEditor.dataset.state === 'collapsed') {
        renderProductSummary(current);
      } else {
        editProduct(selectedProductId, { forceOpen: true });
      }
    } else {
      renderEditorPlaceholder();
    }
  }

  function renderNav() {
    adminBrandZh.textContent = data.site.brandZh || '木纪元智造';
    adminBrandEn.textContent = data.site.brandEn || 'ErawoodFabrication';
  }

  function showSection(key) {
    sections.forEach((section) => {
      section.hidden = section.dataset.section !== key;
    });
    adminNav.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.section === key);
    });
  }

  adminNav.forEach((button) => {
    button.addEventListener('click', () => {
      showSection(button.dataset.section);
    });
  });

  showSection('categories');

  function renderCategories() {
    categoryList.innerHTML = '';
    data.categories.forEach((category, index) => {
      const item = document.createElement('li');
      item.className = 'sortable-item';
      const input = document.createElement('input');
      input.value = category;
      input.addEventListener('input', () => {
        data.categories[index] = input.value;
      });
      const actions = document.createElement('div');
      actions.className = 'sortable-actions';

      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = '↑';
      up.className = 'icon-btn';
      up.addEventListener('click', () => moveItem(data.categories, index, index - 1));
      const down = document.createElement('button');
      down.type = 'button';
      down.textContent = '↓';
      down.className = 'icon-btn';
      down.addEventListener('click', () => moveItem(data.categories, index, index + 1));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.className = 'icon-btn';
      remove.addEventListener('click', () => {
        data.categories.splice(index, 1);
        renderCategories();
      });

      actions.append(up, down, remove);
      item.append(input, actions);
      categoryList.appendChild(item);
    });
  }

  function moveItem(arr, from, to) {
    if (to < 0 || to >= arr.length) return;
    const item = arr.splice(from, 1)[0];
    arr.splice(to, 0, item);
    render();
  }

  addCategoryBtn.addEventListener('click', () => {
    data.categories.push('新分类');
    renderCategories();
  });

  saveCategoryBtn.addEventListener('click', () => {
    Store.updateCategories(data.categories.filter(Boolean));
  });

  function renderParamTypes() {
    paramBody.innerHTML = '';
    data.paramTypes.forEach((param, index) => {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      const keyInput = document.createElement('input');
      keyInput.value = param.key;
      keyInput.addEventListener('input', () => {
        data.paramTypes[index].key = keyInput.value;
      });
      keyCell.appendChild(keyInput);
      const labelCell = document.createElement('td');
      const labelInput = document.createElement('input');
      labelInput.value = param.label || param.key;
      labelInput.addEventListener('input', () => {
        data.paramTypes[index].label = labelInput.value;
      });
      labelCell.appendChild(labelInput);
      const unitCell = document.createElement('td');
      const unitInput = document.createElement('input');
      unitInput.value = param.unit || '';
      unitInput.addEventListener('input', () => {
        data.paramTypes[index].unit = unitInput.value;
      });
      unitCell.appendChild(unitInput);
      const showCell = document.createElement('td');
      const showInput = document.createElement('input');
      showInput.type = 'checkbox';
      showInput.checked = !param.hidden;
      showInput.addEventListener('change', () => {
        data.paramTypes[index].hidden = !showInput.checked;
      });
      showCell.appendChild(showInput);
      const orderCell = document.createElement('td');
      const orderActions = document.createElement('div');
      orderActions.className = 'sortable-actions';
      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = '↑';
      up.className = 'icon-btn';
      up.addEventListener('click', () => moveItem(data.paramTypes, index, index - 1));
      const down = document.createElement('button');
      down.type = 'button';
      down.textContent = '↓';
      down.className = 'icon-btn';
      down.addEventListener('click', () => moveItem(data.paramTypes, index, index + 1));
      orderActions.append(up, down);
      orderCell.appendChild(orderActions);
      const actionCell = document.createElement('td');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '删除';
      remove.className = 'button ghost';
      remove.addEventListener('click', () => {
        data.paramTypes.splice(index, 1);
        renderParamTypes();
      });
      actionCell.appendChild(remove);
      row.append(keyCell, labelCell, unitCell, showCell, orderCell, actionCell);
      paramBody.appendChild(row);
    });
  }

  addParamBtn.addEventListener('click', () => {
    data.paramTypes.push({ key: '参数', unit: '', label: '参数', hidden: false });
    renderParamTypes();
  });

  saveParamBtn.addEventListener('click', () => {
    Store.updateParamTypes(data.paramTypes);
  });

  function renderProducts() {
    productList.innerHTML = '';
    pendingProducts.forEach((product, index) => {
      const item = document.createElement('li');
      item.className = 'sortable-item';
      item.dataset.id = product.id;
      item.tabIndex = 0;
      const name = document.createElement('span');
      name.textContent = product.name || '未命名产品';
      name.style.flex = '1';
      const actions = document.createElement('div');
      actions.className = 'sortable-actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = '编辑';
      editBtn.className = 'button ghost';
      editBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        editProduct(product.id);
      });
      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = '↑';
      up.className = 'icon-btn';
      up.addEventListener('click', (event) => {
        event.stopPropagation();
        moveItem(pendingProducts, index, index - 1);
        renderProducts();
      });
      const down = document.createElement('button');
      down.type = 'button';
      down.textContent = '↓';
      down.className = 'icon-btn';
      down.addEventListener('click', (event) => {
        event.stopPropagation();
        moveItem(pendingProducts, index, index + 1);
        renderProducts();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.className = 'icon-btn';
      remove.addEventListener('click', (event) => {
        event.stopPropagation();
        const idx = pendingProducts.findIndex((p) => p.id === product.id);
        if (idx >= 0) {
          pendingProducts.splice(idx, 1);
          if (selectedProductId === product.id) {
            selectedProductId = null;
            productEditor.innerHTML = '';
            renderEditorPlaceholder();
            updateProductSelection();
          }
          renderProducts();
        }
      });
      actions.append(editBtn, up, down, remove);
      item.append(name, actions);
      item.addEventListener('click', () => editProduct(product.id));
      productList.appendChild(item);
    });
    updateProductSelection();
  }

  function createParamFields(product, container) {
    container.innerHTML = '';
    container.classList.add('form-section', 'specs-section');

    const title = document.createElement('h3');
    title.textContent = '类别与参数';
    title.className = 'section-label';

    const grid = document.createElement('div');
    grid.className = 'param-grid param-grid--dense';

    const categoryBlock = document.createElement('div');
    categoryBlock.className = 'param-item param-item--category';

    const categoryLabel = document.createElement('label');
    const categorySelect = document.createElement('select');
    const categorySelectId = `category-${product.id}`;
    categoryLabel.setAttribute('for', categorySelectId);
    categoryLabel.textContent = '所属类别';

    categorySelect.id = categorySelectId;
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = data.categories.length ? '请选择分类' : '请先创建分类';
    categorySelect.appendChild(placeholderOption);

    const currentCategory = product.categories?.[0] || '';
    data.categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    categorySelect.value = currentCategory;
    categorySelect.disabled = !data.categories.length;
    categorySelect.addEventListener('change', () => {
      const value = categorySelect.value;
      product.categories = value ? [value] : [];
      renderProducts();
    });

    categoryBlock.append(categoryLabel, categorySelect);
    grid.appendChild(categoryBlock);

    if (!data.paramTypes.length) {
      const empty = document.createElement('p');
      empty.className = 'field-note';
      empty.textContent = '暂无参数类型，请先在上方模块中创建。';
      container.append(title, grid, empty);
      return;
    }

    data.paramTypes.forEach((param) => {
      const block = document.createElement('div');
      block.className = 'param-item';
      const label = document.createElement('label');
      label.textContent = param.label || param.key;
      const input = document.createElement('input');
      input.value = product.params?.[param.key] || '';
      input.addEventListener('input', () => {
        product.params = product.params || {};
        if (input.value) {
          product.params[param.key] = input.value;
        } else {
          delete product.params[param.key];
        }
      });
      block.append(label, input);
      grid.appendChild(block);
    });

    container.append(title, grid);
  }

  function createImageList(product, container) {
    container.innerHTML = '';
    container.classList.add('form-section');
    const mediaTitle = document.createElement('h3');
    mediaTitle.textContent = '图片';
    mediaTitle.className = 'section-label';

    const coverField = document.createElement('div');
    coverField.className = 'form-field';
    const coverLabel = document.createElement('label');
    coverLabel.textContent = '封面路径';
    const coverInput = document.createElement('input');
    coverInput.value = product.cover || '';
    coverInput.placeholder = 'assets/products/example/cover.svg';
    coverInput.addEventListener('input', () => {
      product.cover = coverInput.value;
    });
    coverField.append(coverLabel, coverInput);

    const folderField = document.createElement('div');
    folderField.className = 'form-field';
    const folderLabel = document.createElement('label');
    const folderInput = document.createElement('input');
    const folderId = `imageFolder-${product.id}`;
    folderLabel.setAttribute('for', folderId);
    folderLabel.textContent = '图集文件夹路径';
    folderInput.id = folderId;
    folderInput.placeholder = 'assets/products/capwell-01/';
    folderInput.value = product.imageFolder || '';

    const folderStatus = document.createElement('span');
    folderStatus.className = 'field-note';
    folderStatus.setAttribute('role', 'status');

    folderInput.addEventListener('input', () => {
      product.imageFolder = folderInput.value.trim();
      folderStatus.textContent = '';
      folderStatus.removeAttribute('data-state');
    });
    folderInput.addEventListener('blur', () => {
      if (!folderInput.value.trim()) return;
      const normalized = normalizeFolderPath(folderInput.value.trim());
      folderInput.value = normalized;
      product.imageFolder = normalized;
    });
    folderInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        syncFolder();
      }
    });

    const folderInline = document.createElement('div');
    folderInline.className = 'field-inline';
    const folderBtn = document.createElement('button');
    folderBtn.type = 'button';
    folderBtn.className = 'button ghost';
    folderBtn.textContent = '读取文件夹';

    const collection = document.createElement('div');
    collection.className = 'images-collection';

    const renderImages = () => {
      collection.innerHTML = '';
      const images = product.images || [];
      if (!images.length) {
        const empty = document.createElement('p');
        empty.className = 'field-note';
        empty.textContent = '当前无图片，请使用上方按钮读取文件夹。';
        collection.appendChild(empty);
        return;
      }
      const list = document.createElement('ul');
      list.className = 'image-pill-list';
      images.forEach((imgPath) => {
        const item = document.createElement('li');
        item.className = 'image-pill';
        const label = document.createElement('span');
        label.className = 'image-pill-path';
        label.textContent = imgPath;
        item.append(label);
        if (product.cover === imgPath) {
          item.dataset.state = 'cover';
          const badge = document.createElement('span');
          badge.className = 'image-pill-badge';
          badge.textContent = '封面';
          item.append(badge);
        }
        list.appendChild(item);
      });
      collection.appendChild(list);
    };

    async function syncFolder() {
      const raw = folderInput.value.trim();
      if (!raw) {
        folderStatus.textContent = '请填写文件夹路径';
        folderStatus.dataset.state = 'warning';
        return;
      }
      const normalized = normalizeFolderPath(raw);
      folderStatus.textContent = '读取中…';
      folderStatus.dataset.state = 'loading';
      folderBtn.disabled = true;
      try {
        const images = await listFolderImages(normalized, { revalidate: true });
        product.imageFolder = normalized;
        product.images = images;
        folderInput.value = normalized;
        if (!product.cover && images.length) {
          product.cover = images[0];
          coverInput.value = product.cover;
        }
        renderImages();
        folderStatus.textContent = images.length ? `已载入 ${images.length} 张图片` : '文件夹内未检测到图片';
        folderStatus.dataset.state = images.length ? 'success' : 'warning';
      } catch (error) {
        console.error('读取文件夹失败', error);
        folderStatus.textContent = '读取失败，请确认路径可访问';
        folderStatus.dataset.state = 'error';
      } finally {
        folderBtn.disabled = false;
      }
    }

    folderBtn.addEventListener('click', syncFolder);

    folderInline.append(folderInput, folderBtn);
    folderField.append(folderLabel, folderInline, folderStatus);

    renderImages();
    container.append(mediaTitle, coverField, folderField, collection);
  }


  function renderProductSummary(product) {
    if (!productEditor) return;
    productEditor.innerHTML = '';
    productEditor.dataset.state = 'collapsed';

    const summary = document.createElement('div');
    summary.className = 'editor-summary';

    const title = document.createElement('h2');
    title.textContent = product.name || '未命名产品';

    const meta = document.createElement('div');
    meta.className = 'editor-summary-meta';

    const category = document.createElement('span');
    category.textContent = product.categories?.[0] || '未设置分类';

    const imageCount = document.createElement('span');
    const count = product.images?.length || 0;
    imageCount.textContent = `图片 ${count}`;

    meta.append(category, imageCount);

    const cover = document.createElement('p');
    cover.className = 'editor-summary-cover';
    cover.textContent = product.cover || '未设置封面';

    const hint = document.createElement('p');
    hint.className = 'editor-summary-hint';
    hint.textContent = '再次点击左侧产品可展开完整表单';

    summary.append(title, meta, cover, hint);
    productEditor.appendChild(summary);
    updateProductSelection();
  }

  function editProduct(id, options = {}) {
    const forceOpen = options.forceOpen === true;
    const product = pendingProducts.find((item) => item.id === id) || null;
    if (!product) {
      selectedProductId = null;
      renderEditorPlaceholder();
      return;
    }

    if (!forceOpen && selectedProductId === id && productEditor.dataset.state === 'open') {
      renderProductSummary(product);
      return;
    }

    selectedProductId = id;
    productEditor.innerHTML = '';

    const form = document.createElement('form');
    form.className = 'product-editor-form compact';
    form.addEventListener('submit', (event) => event.preventDefault());

    const createField = (labelText, value, onInput, options = {}) => {
      const field = document.createElement('div');
      field.className = 'form-field';
      const label = document.createElement('label');
      label.textContent = labelText;
      const input = document.createElement(options.multiline ? 'textarea' : 'input');
      if (!options.multiline) {
        input.type = options.type || 'text';
      }
      input.value = value || '';
      if (options.placeholder) {
        input.placeholder = options.placeholder;
      }
      if (options.rows) {
        input.rows = options.rows;
      }
      if (options.required) {
        input.required = true;
      }
      input.addEventListener('input', () => onInput(input.value));
      field.append(label, input);
      return field;
    };

    const nameField = createField(
      '产品名称',
      product.name,
      (value) => {
        product.name = value;
        const generated = slugify(value);
        if (generated) {
          product.slug = generated;
        }
        renderProducts();
      },
      { placeholder: 'Capwell 01', required: true }
    );
    nameField.classList.add('form-field--full');

    const head = document.createElement('div');
    head.className = 'product-editor-top';
    head.append(nameField);

    const specsSection = document.createElement('div');
    createParamFields(product, specsSection);

    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'media-section';
    createImageList(product, imagesContainer);

    const actions = document.createElement('div');
    actions.className = 'product-editor-actions';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = '删除产品';
    deleteBtn.className = 'button ghost danger';
    deleteBtn.addEventListener('click', () => {
      const idx = pendingProducts.findIndex((item) => item.id === product.id);
      if (idx >= 0) {
        pendingProducts.splice(idx, 1);
        selectedProductId = null;
        productEditor.dataset.state = 'closed';
        productEditor.innerHTML = '';
        renderEditorPlaceholder();
        renderProducts();
        updateProductSelection();
      }
    });
    actions.append(deleteBtn);

    form.append(head, specsSection, imagesContainer, actions);

    productEditor.dataset.state = 'open';
    productEditor.appendChild(form);
    updateProductSelection();
  }

  addProductBtn.addEventListener('click', () => {
    const id = `p${Date.now()}`;
    const fallbackSlug = slugify('新产品') || id;
    const newProduct = {
      id,
      name: '新产品',
      slug: fallbackSlug,
      cover: 'assets/products/new/cover.svg',
      imageFolder: '',
      images: [],
      type: '',
      categories: [],
      tags: [],
      params: {},
      intro: ''
    };
    pendingProducts.push(newProduct);
    renderProducts();
    editProduct(id);
  });

  saveProductBtn.addEventListener('click', () => {
    Store.updateProducts(pendingProducts);
  });

  function updateProductSelection() {
    const items = productList.querySelectorAll('li');
    items.forEach((item) => {
      const id = item.dataset.id;
      item.classList.toggle('active', !!id && id === selectedProductId);
    });
  }

  function renderSite() {
    if (!data.site) return;
    siteFields.brandZh.value = data.site.brandZh || '';
    siteFields.brandEn.value = data.site.brandEn || '';
    siteFields.accent.value = data.site.theme?.accent || '#1BB9A5';
    siteFields.navLabels.value = data.site.nav?.join(', ') || '';
    siteFields.heroImage.value = data.site.hero?.image || '';
    siteFields.heroMobileImage.value = data.site.hero?.mobileImage || '';
    siteFields.heroOverlay.value = data.site.hero?.overlay ?? 0.35;
    overlayOutput.textContent = siteFields.heroOverlay.value;
    siteFields.heroFocalX.value = data.site.hero?.focal?.x ?? 0.5;
    siteFields.heroFocalY.value = data.site.hero?.focal?.y ?? 0.5;
    siteFields.heroAltZh.value = data.site.hero?.alt?.zh || '';
    siteFields.heroAltEn.value = data.site.hero?.alt?.en || '';
    siteFields.aboutZh.value = data.site.about?.zh || '';
    siteFields.aboutEn.value = data.site.about?.en || '';
    siteFields.contactAddress.value = data.site.contact?.address || '';
    siteFields.contactPhone.value = data.site.contact?.phone || '';
    siteFields.contactEmail.value = data.site.contact?.email || '';
    siteFields.contactYoutube.value = data.site.contact?.social?.youtube || '';
    siteFields.footerText.value = data.site.footer || '';
  }

  overlaySlider?.addEventListener('input', () => {
    overlayOutput.textContent = overlaySlider.value;
  });

  saveSiteBtn.addEventListener('click', () => {
    const navItems = siteFields.navLabels.value.split(',').map((item) => item.trim()).filter(Boolean);
    const updatedSite = {
      ...data.site,
      brandZh: siteFields.brandZh.value,
      brandEn: siteFields.brandEn.value,
      theme: {
        ...data.site.theme,
        accent: siteFields.accent.value,
        bg: data.site.theme?.bg || '#0B0F14'
      },
      nav: navItems.length ? navItems : data.site.nav,
      hero: {
        ...data.site.hero,
        image: siteFields.heroImage.value,
        mobileImage: siteFields.heroMobileImage.value,
        overlay: parseFloat(siteFields.heroOverlay.value) || 0,
        focal: {
          x: parseFloat(siteFields.heroFocalX.value) || 0,
          y: parseFloat(siteFields.heroFocalY.value) || 0
        },
        alt: {
          zh: siteFields.heroAltZh.value,
          en: siteFields.heroAltEn.value
        }
      },
      about: {
        zh: siteFields.aboutZh.value,
        en: siteFields.aboutEn.value
      },
      contact: {
        address: siteFields.contactAddress.value,
        phone: siteFields.contactPhone.value,
        email: siteFields.contactEmail.value,
        social: {
          youtube: siteFields.contactYoutube.value
        }
      },
      footer: siteFields.footerText.value
    };
    Store.updateSite(updatedSite);
  });

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(Store.exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  clearDraftBtn.addEventListener('click', () => {
    Store.clearDraft();
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
  });

  importFile.addEventListener('change', async () => {
    const file = importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.site || !json.products) {
        throw new Error('Invalid site.json');
      }
      Store.applyImport(json);
      importFile.value = '';
    } catch (error) {
      console.error('导入失败', error);
    }
  });

  Store.on('datachange', sync);

  Store.load().then(() => {
    sync();
  }).catch((error) => {
    console.error('加载数据失败', error);
  });
}
