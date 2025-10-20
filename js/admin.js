import { Store } from './store.js';

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
      editProduct(selectedProductId);
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
      editBtn.addEventListener('click', () => editProduct(product.id));
      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = '↑';
      up.className = 'icon-btn';
      up.addEventListener('click', () => {
        moveItem(pendingProducts, index, index - 1);
        renderProducts();
      });
      const down = document.createElement('button');
      down.type = 'button';
      down.textContent = '↓';
      down.className = 'icon-btn';
      down.addEventListener('click', () => {
        moveItem(pendingProducts, index, index + 1);
        renderProducts();
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.className = 'icon-btn';
      remove.addEventListener('click', () => {
        const idx = pendingProducts.findIndex((p) => p.id === product.id);
        if (idx >= 0) {
          pendingProducts.splice(idx, 1);
          if (selectedProductId === product.id) {
            selectedProductId = null;
            productEditor.innerHTML = '';
          }
          renderProducts();
        }
      });
      actions.append(editBtn, up, down, remove);
      item.append(name, actions);
      item.addEventListener('click', () => editProduct(product.id));
      productList.appendChild(item);
    });
  }

  function createParamFields(product, container) {
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'param-grid';
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
    container.appendChild(grid);
  }

  function createImageList(product, container) {
    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'images-editor';
    const coverField = document.createElement('div');
    coverField.className = 'image-item';
    const coverLabel = document.createElement('label');
    coverLabel.textContent = '封面路径';
    const coverInput = document.createElement('input');
    coverInput.value = product.cover || '';
    coverInput.addEventListener('input', () => {
      product.cover = coverInput.value;
    });
    coverField.append(coverLabel, coverInput);
    list.appendChild(coverField);

    const imagesTitle = document.createElement('h3');
    imagesTitle.textContent = '图片列表';
    imagesTitle.style.margin = '12px 0 0';
    list.appendChild(imagesTitle);

    const collection = document.createElement('div');
    collection.className = 'images-editor';

    const renderImages = () => {
      collection.innerHTML = '';
      (product.images || []).forEach((imgPath, index) => {
        const row = document.createElement('div');
        row.className = 'image-item';
        const input = document.createElement('input');
        input.value = imgPath;
        input.addEventListener('input', () => {
          product.images[index] = input.value;
        });
        const makeCover = document.createElement('button');
        makeCover.type = 'button';
        makeCover.textContent = '设为封面';
        makeCover.addEventListener('click', () => {
          product.cover = product.images[index];
          coverInput.value = product.cover;
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '删除';
        remove.addEventListener('click', () => {
          product.images.splice(index, 1);
          renderImages();
        });
        row.append(input, makeCover, remove);
        collection.appendChild(row);
      });
    };

    const addImageBtn = document.createElement('button');
    addImageBtn.type = 'button';
    addImageBtn.textContent = '新增图片路径';
    addImageBtn.className = 'button ghost';
    addImageBtn.addEventListener('click', () => {
      product.images = product.images || [];
      product.images.push('assets/products/new-image.svg');
      renderImages();
    });

    renderImages();
    list.append(collection, addImageBtn);
    container.appendChild(list);
  }

  function editProduct(id) {
    const product = pendingProducts.find((item) => item.id === id) || null;
    selectedProductId = id;
    productEditor.innerHTML = '';
    if (!product) return;
    const form = document.createElement('form');
    form.className = 'product-editor-form';
    form.addEventListener('submit', (event) => event.preventDefault());

    const createField = (labelText, value, onInput, options = {}) => {
      const field = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = labelText;
      const input = document.createElement(options.textarea ? 'textarea' : 'input');
      if (options.type) input.type = options.type;
      if (options.textarea) input.rows = options.rows || 3;
      input.value = value || '';
      input.addEventListener('input', () => onInput(input.value));
      field.append(label, input);
      return field;
    };

    const idField = createField('ID', product.id, (value) => {
      product.id = value;
    });
    const nameField = createField('名称', product.name, (value) => {
      product.name = value;
      renderProducts();
    });
    const slugField = createField('Slug', product.slug, (value) => {
      product.slug = value;
    });
    const typeField = createField('类型', product.type, (value) => {
      product.type = value;
    });
    const tagsField = createField('标签（逗号分隔）', (product.tags || []).join(','), (value) => {
      product.tags = value.split(',').map((item) => item.trim()).filter(Boolean);
    });
    const introField = createField('简介', product.intro, (value) => {
      product.intro = value;
    }, { textarea: true, rows: 4 });

    const categoryField = document.createElement('div');
    const categoryLabel = document.createElement('label');
    categoryLabel.textContent = '所属分类';
    const categorySelect = document.createElement('div');
    categorySelect.className = 'tag-input';
    data.categories.forEach((category) => {
      const option = document.createElement('label');
      option.style.display = 'flex';
      option.style.alignItems = 'center';
      option.style.gap = '6px';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = product.categories?.includes(category);
      checkbox.addEventListener('change', () => {
        product.categories = product.categories || [];
        if (checkbox.checked) {
          if (!product.categories.includes(category)) {
            product.categories.push(category);
          }
        } else {
          product.categories = product.categories.filter((item) => item !== category);
        }
      });
      const span = document.createElement('span');
      span.textContent = category;
      option.append(checkbox, span);
      categorySelect.appendChild(option);
    });
    categoryField.append(categoryLabel, categorySelect);

    const paramsContainer = document.createElement('div');
    const paramsTitle = document.createElement('h3');
    paramsTitle.textContent = '参数填写';
    paramsContainer.appendChild(paramsTitle);
    createParamFields(product, paramsContainer);

    const imagesContainer = document.createElement('div');
    const imagesTitle = document.createElement('h3');
    imagesTitle.textContent = '图片管理';
    imagesContainer.appendChild(imagesTitle);
    createImageList(product, imagesContainer);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = '删除产品';
    deleteBtn.className = 'button ghost';
    deleteBtn.addEventListener('click', () => {
      const idx = pendingProducts.findIndex((item) => item.id === product.id);
      if (idx >= 0) {
        pendingProducts.splice(idx, 1);
        selectedProductId = null;
        productEditor.innerHTML = '';
        renderProducts();
      }
    });

    form.append(
      idField,
      nameField,
      slugField,
      typeField,
      tagsField,
      introField,
      categoryField,
      paramsContainer,
      imagesContainer,
      deleteBtn
    );

    productEditor.appendChild(form);
  }

  addProductBtn.addEventListener('click', () => {
    const id = `p${Date.now()}`;
    const newProduct = {
      id,
      name: '新产品',
      slug: `product-${Date.now()}`,
      cover: 'assets/products/new/cover.svg',
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
