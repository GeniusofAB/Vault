// ============================================================================
// mods.js — реестр модов.
//
// Сами файлы лежат прямо в репозитории, рядом с сайтом:
//
//   /mods/<id>.vpk   — сам мод
//   /mods/<id>.json  — его метаданные (формат — см. ниже)
//   /pic/<id>.png    — превью карточки (необязательно; нет файла —
//                      будет цветная заглушка с иконкой категории)
//
// GitHub Pages — чистая статика, листинга директорий нет, поэтому список id
// приходится держать явно здесь. Это единственное, что нужно трогать руками
// при добавлении/удалении мода (плюс сами файлы).
//
// Формат mods/<id>.json:
// {
//   "title": "Crimson Compact HUD",
//   "author": "rusty_forge",
//   "category": "hud",              // id из categories ниже
//   "tags": ["compact", "competitive"],
//   "description": "...",
//   "fileSizeMB": 6.8,
//   "dateAdded": "2026-06-02",
//   "downloads": 5310,
//   "previewColor": "#E5484D"       // цвет заглушки, если нет pic/<id>.png
// }
// ============================================================================

export const categories = [
  { id: "fonts", label: "Шрифты", icon: "text_fields" },
  { id: "icons", label: "Иконки", icon: "apps" },
  { id: "loading", label: "Загрузочные экраны", icon: "wallpaper" },
  { id: "hud", label: "HUD", icon: "dashboard" },
  { id: "wards", label: "Вардены", icon: "visibility" },
  { id: "couriers", label: "Курьеры", icon: "flight" },
  { id: "fx", label: "Эффекты", icon: "auto_awesome" },
  { id: "sounds", label: "Звуки", icon: "volume_up" },
];

export const modIds = [
  "aurora-loading-screens",
  "crimson-hud",
  "inter-tight-font",
  "glyph-icon-pack",
  "ember-wards",
  "skybound-courier",
  "arcane-spellburst-fx",
  "lofi-ambient-sfx",
  "goldrush-loading",
  "mono-serif-font",
];
