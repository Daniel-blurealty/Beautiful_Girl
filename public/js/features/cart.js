// public/js/features/cart.js
import { request } from "../lib/http.js";
import { fmt } from "../lib/http.js";

// clave en localStorage
const KEY = "bg:cart";

function readCart() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function writeCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function calcSubtotal(items) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

export function initCart(els, deps) {
  // els: referencias al DOM
  // deps: { requireAuth } → del módulo auth, para proteger checkout
  const {
    openBtn, closeBtn, drawer, list, count, subtotal,
    checkoutBtn, receiptDlg, receiptContent, receiptClose, receiptPrint
  } = els;

  // estado
  let CART = readCart();

  // --------------- render ----------------
  function render() {
    // contador
    const totalQty = CART.reduce((s, i) => s + i.quantity, 0);
    if (count) count.textContent = String(totalQty);

    // subtotal
    if (subtotal) subtotal.textContent = fmt(calcSubtotal(CART));

    // lista
    if (list) {
      if (!CART.length) {
        list.innerHTML = `<div class="muted">Tu carrito está vacío.</div>`;
      } else {
        list.innerHTML = CART.map(item => `
          <div class="row item" data-id="${item.product_id}">
            <div class="col">
              <div class="name">${item.name}</div>
              <div class="muted">${fmt(item.price)}</div>
            </div>
            <div class="qty">
              <button class="ghost btn dec" data-id="${item.product_id}">−</button>
              <span class="q">${item.quantity}</span>
              <button class="ghost btn inc" data-id="${item.product_id}">+</button>
            </div>
            <button class="ghost btn rm" title="Quitar" data-id="${item.product_id}">✕</button>
          </div>
        `).join("");
      }
    }
  }

  function persistAndRender() {
    writeCart(CART);
    render();
  }

  // --------------- API pública ---------------
  function addToCart(prod) {
    const id = Number(prod.id);
    const price = Number(prod.price || 0);
    if (!id) return;

    const found = CART.find(i => i.product_id === id);
    if (found) {
      found.quantity += 1;
    } else {
      CART.push({
        product_id: id,
        name: prod.name || "(sin nombre)",
        price,
        image: prod.image || "",
        quantity: 1,
      });
    }
    persistAndRender();
    // abrir drawer si existe
    drawer?.classList.add("open");
  }

  function removeFromCart(id) {
    CART = CART.filter(i => i.product_id !== id);
    persistAndRender();
  }

  function changeQty(id, delta) {
    const it = CART.find(i => i.product_id === id);
    if (!it) return;
    it.quantity = Math.max(1, it.quantity + delta);
    persistAndRender();
  }

  // --------------- Eventos UI ---------------
  // Abrir/ cerrar drawer
  openBtn?.addEventListener("click", () => drawer?.classList.add("open"));
  closeBtn?.addEventListener("click", () => drawer?.classList.remove("open"));

  // Clicks dentro del drawer (inc/dec/remove)
  drawer?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains("inc")) {
      changeQty(Number(t.dataset.id), +1);
    } else if (t.classList.contains("dec")) {
      changeQty(Number(t.dataset.id), -1);
    } else if (t.classList.contains("rm")) {
      removeFromCart(Number(t.dataset.id));
    }
  });

  // Escucha global a botones .add-to-cart
  // (esto hace que funcione en home, categoría y resultados de búsqueda)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".add-to-cart");
    if (!btn) return;
    const prod = {
      id: Number(btn.dataset.id),
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      image: btn.dataset.image || "",
    };
    addToCart(prod);
  }, true);

  // --------------- Checkout ---------------
  checkoutBtn?.addEventListener("click", async () => {
    if (!CART.length) { alert("Tu carrito está vacío."); return; }

    // requiere sesión
    if (deps?.requireAuth) {
      let allowed = false;
      await deps.requireAuth(() => { allowed = true; });
      if (!allowed) return; // abrió login; el usuario intentará de nuevo
    }

    try {
      const itemsPayload = CART.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
      }));

      const order = await request("/api/orders", {
        method: "POST",
        body: { items: itemsPayload },
      });

      const now = new Date();
      const rows = CART.map(i => `
        <tr>
          <td>${i.name}</td>
          <td>${i.quantity}</td>
          <td>${fmt(i.price)}</td>
          <td>${fmt(i.price * i.quantity)}</td>
        </tr>
      `).join("");
      const totalLocal = calcSubtotal(CART);
      const totalMostrar = order.total ?? order.valor_total ?? totalLocal;

      if (receiptContent) {
        receiptContent.innerHTML = `
    <h3>¡Compra realizada con éxito! 🎉</h3>
    <div class="muted">Pedido #${order.id} • ${now.toLocaleDateString()}</div>
    <p class="success-msg">Gracias por tu compra. Hemos registrado tu pedido como <strong>pagado</strong>.</p>
    <table>
      <thead>
        <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><th colspan="3">Total pagado</th><th>${fmt(totalMostrar)}</th></tr>
      </tfoot>
    </table>
  `;
      }

      // limpiar carrito y refrescar UI
      CART = [];
      persistAndRender();
      drawer?.classList.remove("open");
      receiptDlg?.showModal();

    } catch (err) {
      alert("Error al crear la orden: " + (err.message || "desconocido"));
    }
  });

  // Cerrar recibo (botón "Cerrar")
  receiptClose?.addEventListener("click", () => {
    receiptDlg?.close();
  });

  // Aceptar recibo (botón "Aceptar")
  receiptPrint?.addEventListener("click", () => {
    receiptDlg?.close();
    // opcional: feedback extra
    // alert("¡Compra realizada con éxito! Gracias por tu pedido 💖");
  });


  // --------------- init ---------------
  render();

  // exponer APIs si te sirven
  return { addToCart, getCart: () => CART.slice(), render };
}
