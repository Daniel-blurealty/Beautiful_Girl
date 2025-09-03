// public/js/features/productDetail.js
import { fmt, fetchJSON, normalizeProduct } from "../lib/http.js";

export function createProductDetail(els) {
  function showOnly(section) {
    document.getElementById("homeSection")?.classList.toggle("hidden", section !== "home");
    document.getElementById("categorySection")?.classList.toggle("hidden", section !== "category");
    document.getElementById("searchSection")?.classList.toggle("hidden", section !== "search");
    els.productSection.classList.toggle("hidden", section !== "product");
  }

  function imgFallback(url) {
    return url || "https://picsum.photos/seed/pink/1200/900";
  }

  async function show(idOrSlug) {
    showOnly("product");
    els.productView.innerHTML = `<div class="muted">Cargando producto…</div>`;

    const data = await fetchJSON(`/api/products/${encodeURIComponent(idOrSlug)}`);
    const n = normalizeProduct(data);

    els.productTitle.textContent = n.name;

    els.productView.innerHTML = `
      <article class="pd">
        <section class="pd-media">
          <figure class="pd-fig">
            <img id="pdImg" src="${imgFallback(n.image_url)}" alt="${n.name}" loading="eager" />
          </figure>
        </section>

        <section class="pd-info">
          ${n.category_name ? `<span class="brandtag">${n.category_name}</span>` : ""}
          <h1 class="pd-name">${n.name}</h1>

          <div class="pd-price-row">
            <div class="pd-price">${fmt(n.price)}</div>
          </div>

          <p class="pd-desc">${(data.description ?? data.descripcion ?? "").trim() || "Sin descripción."}</p>

          <div class="pd-actions">
            <button
              class="btn w100 add-to-cart"
              data-id="${n.id}"
              data-name="${n.name}"
              data-price="${n.price}"
              data-image="${n.image_url || ""}"
            ><i class="fas fa-cart-plus"></i> Agregar al carrito</button>
          </div>
        </section>
      </article>
    `;

    // Mini-zoom al pasar el mouse (desktop)
    const img = document.getElementById("pdImg");
    img?.addEventListener("mousemove", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
    });
  }

  return { show };
}
