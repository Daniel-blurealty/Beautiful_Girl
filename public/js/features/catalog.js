// public/js/features/catalog.js
import { fmt, fetchJSON, pickProducts, normalizeProduct, request } from "../lib/http.js";
import { listFavorites, addFavorite, removeFavorite } from "../api/favorites.js";

export function createCatalog(els, deps = {}) {
    const { catBar, meta, grid } = els;
    const { auth } = deps || {};

    // --- Estado ---
    let CATS = [];
    let CURRENT_CAT = null;
    let FAV_IDS = new Set();
    let IS_FAVORITES_VIEW = false; // Nueva bandera para controlar la vista de favoritos

    // --- Helpers favoritos ---
    function ensureFavButton() {
        let favBtn = catBar.querySelector('[data-role="fav-btn"]');
        const isLogged = !!deps.auth?.getUser?.();

        if (!favBtn) {
            favBtn = document.createElement("button");
            favBtn.className = "cat";
            favBtn.dataset.role = "fav-btn";
            favBtn.textContent = "❤️ Favoritos";
            favBtn.addEventListener("click", (e) => {
                e.preventDefault();
                location.hash = "#/favoritos";
            });
            catBar.appendChild(favBtn);
        }
        favBtn.classList.toggle("hidden", !isLogged);
        
        // Actualizar estado activo del botón de favoritos
        favBtn.classList.toggle("active", IS_FAVORITES_VIEW);
    }

    async function loadFavoritesIfLogged() {
        try {
            await request("/auth/me");
            const favs = await listFavorites();
            FAV_IDS = new Set(favs.map(p => Number(p.id)));
        } catch {
            FAV_IDS = new Set();
        }
    }

    // --- UI de cards ---
    function productCard(p) {
        const n = normalizeProduct(p);
        const isFav = FAV_IDS.has(Number(n.id));
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
    <a class="img" href="#/producto/${encodeURIComponent(n.id)}"
       style="background-image:url('${n.image_url || "https://picsum.photos/seed/pink/600/400"}')"></a>
    <div class="body">
      <span class="brandtag">${n.category_name || ""}</span>

      <div class="name-row">
        <a class="name" href="#/producto/${encodeURIComponent(n.id)}">${n.name}</a>
        <button class="fav-btn"
                title="${isFav ? "Quitar de favoritos" : "Agregar a favoritos"}"
                data-fav="${n.id}"
                aria-pressed="${isFav ? "true" : "false"}">
          ${isFav ? "💖" : "🤍"}
        </button>
      </div>

      <div class="row card-actions">
        <div class="price">${fmt(n.price)}</div>
        <button
          class="btn add-to-cart"
          data-id="${n.id}"
          data-name="${n.name}"
          data-price="${n.price}"
          data-image="${n.image_url || ""}"
        >Agregar</button>
      </div>
    </div>
  `;
        return div;
    }

    function renderGrid(items) {
        if (!items.length) {
            grid.innerHTML = `<div class="muted">No hay productos para mostrar.</div>`;
            return;
        }
        grid.innerHTML = "";
        items.forEach(p => grid.appendChild(productCard(p)));
    }

    // --- Categorías ---
    function setActiveCat(slugOrNull) {
        [...catBar.children].forEach(btn => {
            const isAll = slugOrNull == null && btn.textContent.trim().startsWith("Todo");
            const isFav = IS_FAVORITES_VIEW && btn.dataset.role === "fav-btn";
            const isCategory = btn.dataset.slug === slugOrNull;
            
            btn.classList.toggle("active", isAll || isFav || isCategory);
        });
    }

    async function loadCategories() {
        const res = await fetchJSON("/api/categories");
        CATS = (res.data || []).map(c => ({
            id: c.id,
            name: c.name ?? c.nombre,
            slug: c.slug || (c.name || c.nombre || "").toLowerCase().replace(/\s+/g, "-"),
            product_count: c.product_count ?? 0,
        }));

        catBar.innerHTML = "";
        const allBtn = document.createElement("button");
        allBtn.className = "cat active";
        allBtn.textContent = "Todo";
        allBtn.onclick = () => {
            IS_FAVORITES_VIEW = false; // Salir de la vista de favoritos
            showAllProducts();
        };
        catBar.appendChild(allBtn);

        for (const c of CATS) {
            const btn = document.createElement("button");
            btn.className = "cat";
            btn.dataset.slug = c.slug;
            btn.dataset.id = c.id;
            btn.textContent = `${c.name}${c.product_count ? ` (${c.product_count})` : ""}`;
            btn.onclick = () => {
                IS_FAVORITES_VIEW = false; // Salir de la vista de favoritos
                showCategory(c);
            };
            catBar.appendChild(btn);
        }
        ensureFavButton();
    }

    deps.auth?.onAuthChange?.(() => {
        ensureFavButton();
        if (!deps.auth?.getUser?.()) {
            // Si cerró sesión, salir de la vista de favoritos
            if (IS_FAVORITES_VIEW) {
                IS_FAVORITES_VIEW = false;
                location.hash = "#/";
            }
        }
    });

    // --- Listados ---
    async function showAllProducts() {
        CURRENT_CAT = null;
        IS_FAVORITES_VIEW = false;
        setActiveCat(null);
        meta.textContent = "Mostrando todos los productos.";
        grid.innerHTML = `<div class="muted">Cargando...</div>`;

        await loadFavoritesIfLogged();
        const res = await fetchJSON("/api/products");
        const items = pickProducts(res);
        renderGrid(items);

        meta.textContent = `Todos — ${items.length} producto(s)`;
    }

    async function showCategory(cat) {
        CURRENT_CAT = cat;
        IS_FAVORITES_VIEW = false;
        setActiveCat(cat.slug);
        grid.innerHTML = `<div class="muted">Cargando ${cat.name}…</div>`;
        meta.textContent = `Categoría: ${cat.name}`;

        await loadFavoritesIfLogged();

        let urlParams = { category_id: cat.id, sort: "new", page: 1, limit: 24 };
        let res = await fetchJSON("/api/products", urlParams);
        let items = pickProducts(res);

        const allMatch =
            !items.length || items.every(p => {
                const cid = p.category_id ?? p.categoria_id ?? null;
                return cid === cat.id;
            });

        if (!allMatch) {
            urlParams = { category: cat.slug, sort: "new", page: 1, limit: 24 };
            res = await fetchJSON("/api/products", urlParams);
            items = pickProducts(res);
        }

        renderGrid(items);
        meta.textContent = `${cat.name} — ${items.length} producto(s)`;
    }

    // --- Delegación de eventos (toggle favoritos) ---
    grid.addEventListener("click", async (e) => {
        const favBtn = e.target.closest("button[data-fav]");
        if (!favBtn) return;

        const id = Number(favBtn.dataset.fav);

        try {
            const me = await request("/auth/me").catch(() => null);
            if (!me) {
                if (deps.auth?.requireAuth) deps.auth.requireAuth();
                return;
            }

            const isActive = favBtn.getAttribute("aria-pressed") === "true";
            if (isActive) {
                await removeFavorite(id);
                FAV_IDS.delete(id);
                favBtn.setAttribute("aria-pressed", "false");
                favBtn.textContent = "🤍";
                favBtn.title = "Agregar a favoritos";
                
                // Si estamos en la vista de favoritos, actualizar la lista
                if (IS_FAVORITES_VIEW) {
                    await showFavorites();
                }
            } else {
                await addFavorite(id);
                FAV_IDS.add(id);
                favBtn.setAttribute("aria-pressed", "true");
                favBtn.textContent = "💖";
                favBtn.title = "Quitar de favoritos";
            }
        } catch (err) {
            console.error("Fav toggle error:", err);
        }
    });

    async function showFavorites() {
        // Asegura estado de sesión
        const me = await deps.auth?.refresh?.().catch(() => null);
        if (!me) {
            deps.auth?.requireAuth?.();
            location.hash = "#/";
            return;
        }

        CURRENT_CAT = null;
        IS_FAVORITES_VIEW = true; // Entrar a vista de favoritos
        setActiveCat("__fav__");
        meta.textContent = "Tus favoritos";
        grid.innerHTML = `<div class="muted">Cargando favoritos…</div>`;

        await loadFavoritesIfLogged();
        let items = [];
        try { 
            items = await listFavorites(); 
        } catch (err) {
            console.error("Error loading favorites:", err);
            grid.innerHTML = `<div class="muted">Error al cargar favoritos.</div>`;
            return;
        }

        if (!items.length) {
            grid.innerHTML = `<div class="muted">Aún no tienes productos en favoritos.</div>`;
            return;
        }
        renderGrid(items);
        meta.textContent = `Favoritos — ${items.length} producto(s)`;
    }

    // --- API pública ---
    return {
        loadCategories,
        showAllProducts,
        showCategory,
        showFavorites,
        _getState: () => ({ CATS, CURRENT_CAT, IS_FAVORITES_VIEW }),
        __els: els
    };
}