// public/js/features/search.js
import { fmt, fetchJSON, pickProducts, normalizeProduct } from "../lib/http.js";

function productCard(p) {
  const n = normalizeProduct(p);
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="img" style="background-image:url('${n.image_url || "https://picsum.photos/seed/pink/600/400"}')"></div>
    <div class="body">
      <span class="brandtag">${n.category_name}</span>
      <div class="name">${n.name}</div>
      <div class="row">
        <div class="price">${fmt(n.price)}</div>
        <button class="btn">Agregar</button>
      </div>
    </div>
  `;
  return div;
}

export function createSearch(els) {
  // els: { searchSection, searchMeta, searchGrid }
  async function show(query) {
    const q = String(query || "").trim();
    els.searchGrid.innerHTML = `<div class="muted">Buscando “${q}”…</div>`;

    const res = await fetchJSON("/api/products", { q, sort: "new", page: 1, limit: 24 });
    const items = pickProducts(res);

    els.searchMeta.textContent = `“${q}” — ${items.length} resultado(s)`;
    els.searchGrid.innerHTML = items.length ? "" : `<div class="muted">No encontramos resultados.</div>`;
    items.forEach(p => els.searchGrid.appendChild(productCard(p)));
  }

  return { show };
}
