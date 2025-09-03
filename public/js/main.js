// public/js/main.js

// ====== IMPORTS ======
import { $ } from "./lib/http.js";
import { createCatalog } from "./features/catalog.js";
import { createSearch } from "./features/search.js";
import { initAuth } from "./features/auth.js";
import { initCart } from "./features/cart.js";
import { createProductDetail } from "./features/productDetail.js";
import { createFavorites } from "./features/favorites.js";

// ====== REFS A TU DOM (usa tus IDs de index.html) ======
const els = {
  // Cat bar y meta
  catBar: $("#catBar"),
  meta: $("#searchMeta"),

  // Secciones
  homeSection: $("#homeSection"),
  categorySection: $("#categorySection"),
  searchSection: $("#searchSection"),

  // Grids
  homeGrid: $("#homeGrid"),
  catGrid: $("#catGrid"),
  searchGrid: $("#searchGrid"),

  // Controles de búsqueda
  searchInput: $("#searchInput"),
  searchBtn: $("#searchBtn"),

  // (si usas el título de categoría)
  catTitle: $("#catTitle"),

  // detalle del producto
  productSection: $("#productSection"),
  productTitle: $("#productTitle"),
  productView: $("#productView"),
  productBack: $("#productBack"),

  // Log
  loginOpen: $("#loginOpen"),
  logoutBtn: $("#logoutBtn"),
  userBadge: $("#userBadge"),
  loginDlg: $("#loginDlg"),
  registerDlg: $("#registerDlg"),
  loginForm: $("#loginForm"),
  registerForm: $("#registerForm"),
  openRegister: $("#openRegister"),

  // favoritos
  favoritesSection: $("#favoritesSection"),
  favGrid: $("#favGrid"),
  favMeta: $("#favMeta"),
  favBack: $("#favBack"),
};

// ====== INSTANCIAS DE MÓDULOS ======
const auth = initAuth({
  loginDlg: els.loginDlg,
  registerDlg: els.registerDlg,
  loginOpen: els.loginOpen,
  logoutBtn: els.logoutBtn,
  userBadge: els.userBadge,
  loginForm: els.loginForm,
  registerForm: els.registerForm,
  openRegister: els.openRegister,
});
const favorites = createFavorites({
  section: els.favoritesSection,
  grid: els.favGrid,
  meta: els.favMeta,
  backBtn: els.favBack,
}, { auth });
const catalog = createCatalog({
  catBar: els.catBar,
  meta: els.meta,
  grid: els.homeGrid, // 👈 por defecto apuntamos al grid de home
}, { auth });
const search = createSearch({
  searchSection: els.searchSection,
  searchMeta: els.meta,       // reutilizamos el mismo meta: #searchMeta
  searchGrid: els.searchGrid,
});
const productDetail = createProductDetail({
  productSection: els.productSection,
  productTitle: els.productTitle,
  productView: els.productView,
});
const cart = initCart({
  openBtn: $("#cartOpen"),
  closeBtn: $("#cartClose"),
  drawer: $("#cartDrawer"),
  list: $("#cartList"),
  count: $("#cartCount"),
  subtotal: $("#cartSubtotal"),
  checkoutBtn: $("#checkoutBtn"),
  receiptDlg: $("#receiptDlg"),
  receiptContent: $("#receiptContent"),
  receiptClose: $("#receiptClose"),
  receiptPrint: $("#receiptPrint"),
}, {
  requireAuth: auth.requireAuth,
});

// ====== UTILIDADES DE UI ======
function showOnly(section) {
  els.homeSection.classList.toggle("hidden", section !== "home");
  els.categorySection.classList.toggle("hidden", section !== "category");
  els.searchSection.classList.toggle("hidden", section !== "search");
  els.productSection.classList.toggle("hidden", section !== "product");
  els.favoritesSection.classList.toggle("hidden", section !== "favorites");
}

// ====== ROUTER ======
function parseHash() {
  const h = location.hash || "#/";
  const [, route = "", param = ""] = h.match(/^#\/([^/]*)(?:\/(.*))?$/) || [];
  return { route, param: decodeURIComponent(param) };
}

async function renderRoute() {
  const { route, param } = parseHash();

  if (!route) {
    // HOME
    showOnly("home");
    catalog._getState && console.debug("[route] home");
    catalog._getState && (catalog._getState().CURRENT_CAT = null);
    catalog.__els && (catalog.__els.grid = els.homeGrid);
    await catalog.showAllProducts();
    return;
  }

  if (route === "categoria" && param) {
    // CATEGORY
    showOnly("category");

    // Actualiza el puntero del grid del catálogo al de la categoría
    if (catalog.__els) catalog.__els.grid = els.catGrid;

    // Busca la categoría por slug con el estado de catalog
    const state = catalog._getState ? catalog._getState() : null;
    const cats = state?.CATS || [];
    const cat = cats.find(c => c.slug === param);
    if (els.catTitle) els.catTitle.textContent = cat?.name || "Categoría";

    if (cat) {
      await catalog.showCategory(cat);
    } else {
      els.catGrid.innerHTML = `<div class="muted">Categoría no encontrada.</div>`;
    }
    return;
  }

  if (route === "favoritos") {
    showOnly("favorites");                 // 👈 nueva sección
    if (els.catTitle) els.catTitle.textContent = "Favoritos"; // opcional, no afecta
    await favorites.show();
    return;
  }

  if (route === "buscar" && param) {
    // SEARCH
    showOnly("search");
    await search.show(param);
    return;
  }

  if (route === "producto" && param) {
    showOnly("product");
    // muestra el detalle
    await productDetail.show(param);
    return;
  }

  // Fallback → home
  location.hash = "#/";
}

// ====== EVENTOS DE BÚSQUEDA ======
els.searchBtn?.addEventListener("click", () => {
  const q = els.searchInput.value.trim();
  if (!q) {
    location.hash = "#/";
    return;
  }
  location.hash = "#/buscar/" + encodeURIComponent(q);
});

els.searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = els.searchInput.value.trim();
    if (!q) {
      location.hash = "#/";
      return;
    }
    location.hash = "#/buscar/" + encodeURIComponent(q);
  }
});

els.searchInput?.addEventListener("input", () => {
  if (!els.searchInput.value.trim()) {
    location.hash = "#/";   // 👈 resetear a la normalidad
  }
});

els.productBack?.addEventListener("click", () => {
  history.length > 1 ? history.back() : (location.hash = "#/");
});
document.querySelector(".brand")?.addEventListener("click", (e) => {
  // tu brand ya tiene href="#/", pero esto ayuda si algún handler futuro hace preventDefault
  e.preventDefault();
  location.hash = "#/";
});

// ====== BOOTSTRAP ======
window.addEventListener("DOMContentLoaded", async () => {
  try {
    await catalog.loadCategories(); // pinta barra de categorías (dinámica)
    await renderRoute();            // resuelve ruta inicial (#/, #/buscar/:q, etc.)
    await auth.refresh();
    window.addEventListener("hashchange", renderRoute);
  } catch (e) {
    console.error("Error inicializando:", e);
    els.homeGrid.innerHTML = `<div class="muted">Error cargando datos.</div>`;
  }
});
