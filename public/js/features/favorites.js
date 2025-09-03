// public/js/features/favorites.js
import { fmt, request, normalizeProduct } from "../lib/http.js";
import { listFavorites, addFavorite, removeFavorite } from "../api/favorites.js";

export function createFavorites(els, deps = {}) {
  const { section, grid, meta, backBtn } = els;
  const { auth } = deps || {};
  let FAV_IDS = new Set();

  function card(p) {
    const n = normalizeProduct(p);
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <a class="img" href="#/producto/${encodeURIComponent(n.id)}"
         style="background-image:url('${n.image_url || "https://picsum.photos/seed/pink/600/400"}')"></a>
      <div class="body">
        <span class="brandtag">${n.category_name || ""}</span>
        <div class="name-row">
          <a class="name" href="#/producto/${encodeURIComponent(n.id)}">${n.name}</a>
          <button class="fav-btn" title="Quitar de favoritos" data-fav="${n.id}" aria-pressed="true">💖</button>
        </div>
        <div class="row card-actions">
          <div class="price">${fmt(n.price)}</div>
          <button class="btn add-to-cart"
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

  async function refreshFavIds() {
    const favs = await listFavorites();
    FAV_IDS = new Set(favs.map(p => Number(p.id)));
    return favs;
  }

  async function show() {
    // exige sesión; si no hay, abre login y vuelve al home
    const me = await auth?.refresh?.().catch(() => null);
    if (!me) { auth?.requireAuth?.(); location.hash = "#/"; return; }

    meta && (meta.textContent = "Cargando favoritos…");
    grid.innerHTML = `<div class="muted">Cargando…</div>`;

    const list = await refreshFavIds();
    if (!list.length) {
      grid.innerHTML = `<div class="muted">Aún no tienes productos en favoritos.</div>`;
      meta && (meta.textContent = "Sin favoritos");
      return;
    }

    grid.innerHTML = "";
    list.forEach(p => grid.appendChild(card(p)));
    meta && (meta.textContent = `Favoritos — ${list.length} producto(s)`);
  }

  // Toggle favorito desde la propia vista (si quitas uno, se refresca la grilla)
  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-fav]");
    if (!btn) return;
    const id = Number(btn.dataset.fav);
    try {
      await removeFavorite(id);
      await show(); // repinta, eliminando la card
    } catch (err) {
      console.error("removeFavorite error:", err);
    }
  });

  backBtn?.addEventListener("click", () => { location.hash = "#/"; });

  return { show };
}
