import { categories, modIds } from "./mods.js";

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------
const state = {
  query: "",
  activeCategories: new Set(),
  sort: "new",
};

// Заполняется асинхронно в boot() — см. loadMods() ниже.
let modsData = [];

const PRESET_SEEDS = [
  { name: "Аметист", hex: "#8C5CF5" },
  { name: "Янтарь", hex: "#F0A83B" },
  { name: "Багрянец", hex: "#E5484D" },
  { name: "Бирюза", hex: "#2DD4BF" },
  { name: "Изумруд", hex: "#4ADE80" },
];

const els = {
  grid: document.getElementById("grid"),
  stats: document.getElementById("statsLine"),
  empty: document.getElementById("emptyState"),
  search: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  chipRow: document.getElementById("chipRow"),
  sortSelect: document.getElementById("sortSelect"),
  resetFilters: document.getElementById("resetFilters"),
  swatchRow: document.getElementById("swatchRow"),
  seedColorInput: document.getElementById("seedColorInput"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalClose: document.getElementById("modalClose"),
  modalCover: document.getElementById("modalCover"),
  modalCoverIcon: document.getElementById("modalCoverIcon"),
  modalCategory: document.getElementById("modalCategory"),
  modalTitle: document.getElementById("modalTitle"),
  modalAuthor: document.getElementById("modalAuthor"),
  modalTags: document.getElementById("modalTags"),
  modalDesc: document.getElementById("modalDesc"),
  modalSize: document.getElementById("modalSize"),
  modalDate: document.getElementById("modalDate"),
};

const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

async function loadMods() {
  const results = await Promise.allSettled(
    modIds.map(async (id) => {
      const res = await fetch(`mods/${id}.json`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const meta = await res.json();
      return {
        id,
        ...meta,
        vpkUrl: `mods/${id}.vpk`,
        picUrl: `pic/${id}.png`,
      };
    })
  );

  const loaded = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") loaded.push(r.value);
    else console.warn(`Не удалось загрузить мод "${modIds[i]}": ${r.reason}`);
  });
  return loaded;
}

// ---------------------------------------------------------------------------
// theme + dynamic color (the "Material You" bit — self-contained, no CDN
// dependency, so the live re-theme always works offline too)
// ---------------------------------------------------------------------------

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

const hsl = (h, s, l) => `hsl(${h.toFixed(1)} ${clamp(s, 0, 100).toFixed(1)}% ${clamp(l, 0, 100).toFixed(1)}%)`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function applySeedColor(hex, isDark) {
  const [h, rawS] = hexToHsl(hex);
  const s = Math.max(rawS, 42); // keep it vivid even for near-grey picks
  const h2 = h; // secondary: same hue, muted
  const h3 = (h + 55) % 360; // tertiary: analogous accent for contrast

  const set = (name, val) => document.documentElement.style.setProperty(name, val);

  if (isDark) {
    set("--md-primary", hsl(h, s, 80));
    set("--md-on-primary", hsl(h, s * 0.5, 18));
    set("--md-primary-container", hsl(h, s * 0.7, 32));
    set("--md-on-primary-container", hsl(h, s * 0.4, 92));

    set("--md-secondary", hsl(h2, Math.min(s * 0.3, 22), 78));
    set("--md-on-secondary", hsl(h2, 10, 20));
    set("--md-secondary-container", hsl(h2, 14, 28));
    set("--md-on-secondary-container", hsl(h2, 18, 90));

    set("--md-tertiary", hsl(h3, Math.min(s * 0.65, 60), 78));
    set("--md-on-tertiary", hsl(h3, 30, 20));
    set("--md-tertiary-container", hsl(h3, 40, 30));
    set("--md-on-tertiary-container", hsl(h3, 30, 90));

    set("--md-background", hsl(h, 12, 8));
    set("--md-on-background", hsl(h, 8, 90));
    set("--md-surface", hsl(h, 12, 8));
    set("--md-on-surface", hsl(h, 8, 90));
    set("--md-surface-variant", hsl(h, 12, 28));
    set("--md-on-surface-variant", hsl(h, 8, 80));
    set("--md-outline", hsl(h, 6, 55));
    set("--md-outline-variant", hsl(h, 10, 28));
    set("--md-surface-container-low", hsl(h, 12, 11));
    set("--md-surface-container", hsl(h, 12, 13));
    set("--md-surface-container-high", hsl(h, 12, 17));
    set("--md-surface-container-highest", hsl(h, 12, 22));
  } else {
    set("--md-primary", hsl(h, s, 42));
    set("--md-on-primary", hsl(h, s * 0.3, 99));
    set("--md-primary-container", hsl(h, s * 0.55, 90));
    set("--md-on-primary-container", hsl(h, s * 0.6, 16));

    set("--md-secondary", hsl(h2, 20, 38));
    set("--md-on-secondary", hsl(h2, 10, 99));
    set("--md-secondary-container", hsl(h2, 30, 90));
    set("--md-on-secondary-container", hsl(h2, 20, 18));

    set("--md-tertiary", hsl(h3, Math.min(s * 0.6, 55), 36));
    set("--md-on-tertiary", hsl(h3, 20, 99));
    set("--md-tertiary-container", hsl(h3, 55, 88));
    set("--md-on-tertiary-container", hsl(h3, 35, 18));

    set("--md-background", hsl(h, 25, 99));
    set("--md-on-background", hsl(h, 8, 12));
    set("--md-surface", hsl(h, 25, 99));
    set("--md-on-surface", hsl(h, 8, 12));
    set("--md-surface-variant", hsl(h, 16, 90));
    set("--md-on-surface-variant", hsl(h, 8, 32));
    set("--md-outline", hsl(h, 6, 48));
    set("--md-outline-variant", hsl(h, 14, 84));
    set("--md-surface-container-low", hsl(h, 25, 97));
    set("--md-surface-container", hsl(h, 22, 95));
    set("--md-surface-container-high", hsl(h, 20, 92));
    set("--md-surface-container-highest", hsl(h, 18, 89));
  }
}

function buildSwatches() {
  PRESET_SEEDS.forEach((seed) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.style.background = seed.hex;
    btn.title = seed.name;
    btn.setAttribute("aria-label", seed.name);
    btn.dataset.hex = seed.hex;
    btn.addEventListener("click", () => setSeed(seed.hex));
    els.swatchRow.appendChild(btn);
  });
  const customBtn = document.createElement("button");
  customBtn.type = "button";
  customBtn.className = "custom-swatch";
  customBtn.title = "Свой цвет";
  customBtn.setAttribute("aria-label", "Выбрать свой цвет");
  customBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
  customBtn.addEventListener("click", () => els.seedColorInput.click());
  els.swatchRow.appendChild(customBtn);
}

function markActiveSwatch(hex) {
  [...els.swatchRow.querySelectorAll(".swatch")].forEach((s) => {
    s.classList.toggle("active", s.dataset.hex.toLowerCase() === hex.toLowerCase());
  });
}

function setSeed(hex) {
  const isDark = document.documentElement.dataset.theme !== "light";
  applySeedColor(hex, isDark);
  markActiveSwatch(hex);
  els.seedColorInput.value = hex;
  localStorage.setItem("pakvault-seed", hex);
}

function initTheme() {
  const savedTheme = localStorage.getItem("pakvault-theme") || "dark";
  const savedSeed = localStorage.getItem("pakvault-seed") || "#8C5CF5";
  document.documentElement.dataset.theme = savedTheme;
  els.themeIcon.textContent = savedTheme === "light" ? "dark_mode" : "light_mode";
  applySeedColor(savedSeed, savedTheme !== "light");
  markActiveSwatch(savedSeed);
  els.seedColorInput.value = savedSeed;

  els.themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    els.themeIcon.textContent = next === "light" ? "dark_mode" : "light_mode";
    localStorage.setItem("pakvault-theme", next);
    applySeedColor(localStorage.getItem("pakvault-seed") || "#8C5CF5", next !== "light");
  });

  els.seedColorInput.addEventListener("input", (e) => setSeed(e.target.value));
}

// ---------------------------------------------------------------------------
// filter chips
// ---------------------------------------------------------------------------

function buildChips() {
  categories.forEach((cat) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.dataset.cat = cat.id;
    chip.innerHTML = `<span class="material-symbols-outlined">${cat.icon}</span>${cat.label}`;
    chip.addEventListener("click", () => {
      if (state.activeCategories.has(cat.id)) state.activeCategories.delete(cat.id);
      else state.activeCategories.add(cat.id);
      chip.classList.toggle("active");
      render();
    });
    els.chipRow.appendChild(chip);
  });
}

// ---------------------------------------------------------------------------
// search parsing — supports the same "by:/tag:/sort:" mini-syntax as the
// original D2PFX viewer, piped together: "tag:icons|by:NightSky|sort:az"
// ---------------------------------------------------------------------------

function parseQuery(raw) {
  const clauses = raw.split("|").map((c) => c.trim()).filter(Boolean);
  const result = { text: [], by: [], tag: [], sort: null };
  clauses.forEach((clause) => {
    const m = clause.match(/^(by|tag|sort):(.+)$/i);
    if (m) {
      const key = m[1].toLowerCase();
      const val = m[2].trim().toLowerCase();
      if (key === "sort") result.sort = val;
      else result[key].push(val);
    } else if (clause) {
      result.text.push(clause.toLowerCase());
    }
  });
  return result;
}

function matchesQuery(mod, parsed) {
  const title = mod.title.toLowerCase();
  const author = mod.author.toLowerCase();
  const tags = mod.tags.map((t) => t.toLowerCase());

  if (parsed.text.length && !parsed.text.every((t) => title.includes(t) || author.includes(t))) return false;
  if (parsed.by.length && !parsed.by.every((b) => author.includes(b))) return false;
  if (parsed.tag.length && !parsed.tag.every((t) => tags.some((mt) => mt.includes(t)))) return false;
  return true;
}

const SORTERS = {
  new: (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded),
  old: (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded),
  az: (a, b) => a.title.localeCompare(b.title),
  za: (a, b) => b.title.localeCompare(a.title),
};

// ---------------------------------------------------------------------------
// rendering
// ---------------------------------------------------------------------------

function formatSize(mb) {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} ГБ` : `${mb.toFixed(1)} МБ`;
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function cardTemplate(mod) {
  const cat = categoryById[mod.category];
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.style.setProperty("--cover", mod.previewColor || "#8C5CF5");
  card.innerHTML = `
    <div class="card-cover">
      <span class="material-symbols-outlined">${cat.icon}</span>
      <img class="cover-img" src="${mod.picUrl}" alt="" loading="lazy" decoding="async" onerror="this.remove()">
    </div>
    <div class="card-body">
      <span class="card-category">${cat.label}</span>
      <h3 class="card-title">${mod.title}</h3>
      <p class="card-author">${mod.author}</p>
      <div class="card-tags">${mod.tags.map((t) => `<span class="tag-pill">${t}</span>`).join("")}</div>
      <div class="card-footer">
        <span>${formatSize(mod.fileSizeMB)}</span>
      </div>
    </div>`;
  const open = () => openModal(mod);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  return card;
}

function getFiltered() {
  const parsed = parseQuery(state.query);
  const sortKey = parsed.sort && SORTERS[parsed.sort] ? parsed.sort : state.sort;
  return modsData
    .filter((m) => matchesQuery(m, parsed))
    .filter((m) => state.activeCategories.size === 0 || state.activeCategories.has(m.category))
    .sort(SORTERS[sortKey]);
}

function render() {
  const filtered = getFiltered();
  els.grid.innerHTML = "";
  filtered.forEach((mod, i) => {
    const card = cardTemplate(mod);
    card.style.animationDelay = `${Math.min(i, 10) * 25}ms`;
    els.grid.appendChild(card);
  });
  els.empty.hidden = filtered.length !== 0;
  els.grid.hidden = filtered.length === 0;
  els.stats.textContent = `${filtered.length} из ${modsData.length} модов`;
  els.clearSearch.hidden = state.query.length === 0;
}

// ---------------------------------------------------------------------------
// modal
// ---------------------------------------------------------------------------

let lastFocused = null;

function openModal(mod) {
  const cat = categoryById[mod.category];
  els.modalCover.style.setProperty("--cover", mod.previewColor || "#8C5CF5");
  els.modalCoverIcon.textContent = cat.icon;

  // пересоздаём картинку превью на каждое открытие, чтобы не мелькала
  // обложка предыдущего мода, пока грузится/не грузится новая
  els.modalCover.querySelector(".cover-img")?.remove();
  const img = document.createElement("img");
  img.className = "cover-img";
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  img.onerror = () => img.remove();
  img.src = mod.picUrl;
  els.modalCover.appendChild(img);

  els.modalCategory.textContent = cat.label;
  els.modalTitle.textContent = mod.title;
  els.modalAuthor.textContent = `Автор: ${mod.author}`;
  els.modalTags.innerHTML = mod.tags.map((t) => `<span class="tag-pill">${t}</span>`).join("");
  els.modalDesc.textContent = mod.description;
  els.modalSize.textContent = formatSize(mod.fileSizeMB);
  els.modalDate.textContent = formatDate(mod.dateAdded);
  els.modalDownload.href = mod.vpkUrl;

  lastFocused = document.activeElement;
  els.modalOverlay.hidden = false;
  els.modalClose.focus();
  document.body.style.overflow = "hidden";
}

function closeModal() {
  els.modalOverlay.hidden = true;
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

els.modalClose.addEventListener("click", closeModal);
els.modalOverlay.addEventListener("click", (e) => { if (e.target === els.modalOverlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !els.modalOverlay.hidden) closeModal(); });

// ---------------------------------------------------------------------------
// wire up controls
// ---------------------------------------------------------------------------

let debounceTimer;
els.search.addEventListener("input", (e) => {
  state.query = e.target.value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(render, 120);
});
els.clearSearch.addEventListener("click", () => {
  els.search.value = "";
  state.query = "";
  render();
  els.search.focus();
});
els.sortSelect.addEventListener("change", (e) => { state.sort = e.target.value; render(); });
els.resetFilters.addEventListener("click", () => {
  state.query = "";
  state.activeCategories.clear();
  els.search.value = "";
  [...els.chipRow.querySelectorAll(".chip")].forEach((c) => c.classList.remove("active"));
  render();
});

// ---------------------------------------------------------------------------
// boot
// ---------------------------------------------------------------------------

async function boot() {
  buildSwatches();
  buildChips();
  initTheme();
  els.stats.textContent = "Загрузка…";
  modsData = await loadMods();
  render();
}

boot();
