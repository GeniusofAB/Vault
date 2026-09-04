import { categories, modIds } from "./mods.js";

const state = {
  query: "",
  activeCategories: new Set(),
  sort: "new",
  cart: [],
};

let modsData = [];
const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
const FALLBACK_CATEGORY = { icon: "help", label: "Без категории" };

const els = {
  searchInput: document.getElementById("searchInput"),
  searchClear: document.getElementById("searchClear"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  grid: document.getElementById("grid"),
  statsLine: document.getElementById("statsLine"),
  emptyState: document.getElementById("emptyState"),
  sortSelect: document.getElementById("sortSelect"),
  resetFilters: document.getElementById("resetFilters"),
  categoryList: document.getElementById("categoryList"),
  mobileMenuToggle: document.getElementById("mobileMenuToggle"),
  sidebar: document.getElementById("sidebar"),
  sidebarClose: document.getElementById("sidebarClose"),
  overlay: document.getElementById("overlay"),
  cartBtn: document.getElementById("cartBtn"),
  cartBadge: document.getElementById("cartBadge"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalClose: document.getElementById("modalClose"),
  modalCover: document.getElementById("modalCover"),
  modalIcon: document.getElementById("modalIcon"),
  modalCategory: document.getElementById("modalCategory"),
  modalTitle: document.getElementById("modalTitle"),
  modalAuthor: document.getElementById("modalAuthor"),
  modalTags: document.getElementById("modalTags"),
  modalDesc: document.getElementById("modalDesc"),
  modalSize: document.getElementById("modalSize"),
  modalDate: document.getElementById("modalDate"),
  modalDownload: document.getElementById("modalDownload"),
  modalAddCart: document.getElementById("modalAddCart"),
  extraDownloads: document.getElementById("extraDownloads"),
  cartOverlay: document.getElementById("cartOverlay"),
  cartModalClose: document.getElementById("cartModalClose"),
  cartItemsList: document.getElementById("cartItemsList"),
  cartEmpty: document.getElementById("cartEmpty"),
  cartClearBtn: document.getElementById("cartClearBtn"),
  cartDownloadBtn: document.getElementById("cartDownloadBtn"),
  cartFooter: document.getElementById("cartFooter"),
};

// LOAD MODS
async function loadMods() {
  const results = await Promise.allSettled(
    modIds.map(async (id) => {
      const res = await fetch(`mods/${id}.json`);
      if (!res.ok) throw new Error(`${res.status}`);
      const meta = await res.json();
      return { id, ...meta, vpkUrl: `mods/${id}.vpk`, picUrl: `pic/${id}.png` };
    })
  );
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
}

// UTILITIES
function formatSize(mb) {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} ГБ` : `${mb.toFixed(1)} МБ`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalize(str) {
  return str.toLowerCase().replace(/[\s\-_]/g, "");
}

function matchesQuery(mod, query) {
  if (!query) return true;
  const q = normalize(query);
  const titleNorm = normalize(mod.title);
  const authorNorm = normalize(mod.author);
  const tagsNorm = mod.tags.map(normalize);
  return (
    titleNorm.includes(q) ||
    authorNorm.includes(q) ||
    tagsNorm.some((t) => t.includes(q))
  );
}

// THEME
function initTheme() {
  const savedTheme = localStorage.getItem("vault-theme") || "dark";
  document.documentElement.dataset.theme = savedTheme;
  els.themeIcon.textContent = savedTheme === "dark" ? "light_mode" : "dark_mode";

  els.themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    els.themeIcon.textContent = next === "dark" ? "light_mode" : "dark_mode";
    localStorage.setItem("vault-theme", next);
  });
}

// CATEGORIES
function buildCategories() {
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<span class="material-symbols-rounded">${cat.icon}</span>${cat.label}`;
    btn.addEventListener("click", () => {
      state.activeCategories.has(cat.id)
        ? state.activeCategories.delete(cat.id)
        : state.activeCategories.add(cat.id);
      btn.classList.toggle("active");
      render();
    });
    els.categoryList.appendChild(btn);
  });
}

// RENDER
function render() {
  const filtered = modsData
    .filter((m) => matchesQuery(m, state.query))
    .filter(
      (m) =>
        state.activeCategories.size === 0 ||
        state.activeCategories.has(m.category)
    )
    .sort((a, b) => {
      switch (state.sort) {
        case "new":
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        case "old":
          return new Date(a.dateAdded) - new Date(b.dateAdded);
        case "az":
          return a.title.localeCompare(b.title);
        case "za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  els.grid.innerHTML = "";
  filtered.forEach((mod) => {
    const card = createCard(mod);
    els.grid.appendChild(card);
  });

  els.emptyState.hidden = filtered.length !== 0;
  els.grid.hidden = filtered.length === 0;
  els.statsLine.textContent = `${filtered.length} из ${modsData.length} модов`;
  els.searchClear.style.display = state.query ? "flex" : "none";
}

function createCard(mod) {
  const cat = categoryById[mod.category] || FALLBACK_CATEGORY;
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="card-cover">
      <span class="material-symbols-rounded">${cat.icon}</span>
      <img class="cover-img" src="${mod.picUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
    </div>
    <div class="card-body">
      <span class="card-category">${cat.label}</span>
      <h3 class="card-title">${mod.title}</h3>
      <p class="card-author">${mod.author}</p>
      <div class="card-tags">${mod.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <div class="card-footer">${formatSize(mod.fileSizeMB)}</div>
    </div>
  `;
  card.addEventListener("click", () => openModal(mod));
  return card;
}

// MODAL
let currentModal = null;

function openModal(mod) {
  currentModal = mod;
  const cat = categoryById[mod.category] || FALLBACK_CATEGORY;
  els.modalIcon.textContent = cat.icon;
  els.modalCategory.textContent = cat.label;
  els.modalTitle.textContent = mod.title;
  els.modalAuthor.textContent = `Автор: ${mod.author}`;
  els.modalDesc.textContent = mod.description;
  els.modalSize.textContent = formatSize(mod.fileSizeMB);
  els.modalDate.textContent = formatDate(mod.dateAdded);
  els.modalDownload.href = mod.externalUrl || mod.vpkUrl;

  els.modalTags.innerHTML = mod.tags
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  // Cover image
  const existingImg = els.modalCover.querySelector("img");
  if (existingImg) existingImg.remove();
  const img = document.createElement("img");
  img.src = mod.picUrl;
  img.style.display = "none";
  els.modalCover.appendChild(img);

  // Extra downloads
  els.extraDownloads.innerHTML = "";
  checkExtraDownload(`mods/nf/${mod.id}.vpk`, "Без эффектов");
  checkExtraDownload(`mods/dlc/${mod.id}.vpk`, "Доп. файлы");
  checkExtraDownload(`mods/styles/${mod.id}.vpk`, "Второй стиль");

  els.modalOverlay.hidden = false;
}

function checkExtraDownload(url, label) {
  fetch(url, { method: "HEAD" })
    .then((res) => {
      if (res.ok) {
        const btn = document.createElement("a");
        btn.className = "btn-secondary";
        btn.href = url;
        btn.download = "";
        btn.target = "_blank";
        btn.rel = "noopener noreferrer";
        btn.innerHTML = `<span class="material-symbols-rounded">download</span>${label}`;
        els.extraDownloads.appendChild(btn);
      }
    })
    .catch(() => {});
}

function closeModal() {
  els.modalOverlay.hidden = true;
  currentModal = null;
}

// CART
function addToCart(mod) {
  if (!state.cart.find((m) => m.id === mod.id)) {
    state.cart.push(mod);
    updateCartBadge();
  }
}

function removeFromCart(modId) {
  state.cart = state.cart.filter((m) => m.id !== modId);
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  els.cartBadge.textContent = state.cart.length;
}

function renderCart() {
  if (state.cart.length === 0) {
    els.cartEmpty.hidden = false;
    els.cartItemsList.innerHTML = "";
    els.cartFooter.hidden = true;
  } else {
    els.cartEmpty.hidden = true;
    els.cartFooter.hidden = false;
    els.cartItemsList.innerHTML = state.cart
      .map(
        (mod) => `
      <div class="cart-item">
        <div class="cart-item-image">
          <span class="material-symbols-rounded">package</span>
        </div>
        <div class="cart-item-info">
          <p class="cart-item-title">${mod.title}</p>
          <p class="cart-item-author">${mod.author}</p>
        </div>
        <button class="cart-item-remove" data-id="${mod.id}" aria-label="Удалить">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    `
      )
      .join("");

    document.querySelectorAll(".cart-item-remove").forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
    });
  }
}

function downloadCart() {
  // Simple multi-download: open each in new tab
  state.cart.forEach((mod) => {
    window.open(mod.externalUrl || mod.vpkUrl, "_blank");
  });
}

function openCartModal() {
  renderCart();
  els.cartOverlay.hidden = false;
}

function closeCartModal() {
  els.cartOverlay.hidden = true;
}

// MOBILE MENU
function openSidebar() {
  els.sidebar.classList.add("open");
  els.overlay.classList.add("open");
}

function closeSidebar() {
  els.sidebar.classList.remove("open");
  els.overlay.classList.remove("open");
}

// EVENT LISTENERS
els.searchInput.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

els.searchClear.addEventListener("click", () => {
  els.searchInput.value = "";
  state.query = "";
  render();
});

els.sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});

els.resetFilters.addEventListener("click", () => {
  state.query = "";
  state.activeCategories.clear();
  els.searchInput.value = "";
  document.querySelectorAll(".category-btn").forEach((btn) => btn.classList.remove("active"));
  render();
});

els.modalClose.addEventListener("click", closeModal);
els.modalOverlay.addEventListener("click", (e) => {
  if (e.target === els.modalOverlay) closeModal();
});

els.modalAddCart.addEventListener("click", () => {
  if (currentModal) {
    addToCart(currentModal);
    closeModal();
  }
});

els.mobileMenuToggle.addEventListener("click", openSidebar);
els.sidebarClose.addEventListener("click", closeSidebar);
els.overlay.addEventListener("click", closeSidebar);

els.cartBtn.addEventListener("click", openCartModal);
els.cartModalClose.addEventListener("click", closeCartModal);
els.cartClearBtn.addEventListener("click", () => {
  state.cart = [];
  updateCartBadge();
  renderCart();
});
els.cartDownloadBtn.addEventListener("click", downloadCart);

// BOOT
async function boot() {
  initTheme();
  buildCategories();
  els.statsLine.textContent = "Загрузка...";
  modsData = await loadMods();
  render();
}

boot();