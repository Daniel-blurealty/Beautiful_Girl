import { listOrders, getOrder, updateOrder } from "../api/orders.js";

const STATUS_OPTIONS = [
    { value: "pending", label: "pendiente" },
    { value: "paid", label: "pagado" },
];

const statusToLabel = (v) => (STATUS_OPTIONS.find(s => s.value === (v || "").toLowerCase())?.label || v || "");
const money = (n) => "$" + Number(n || 0).toFixed(2);

export async function setupOrders() {
    const table = document.getElementById("ordersTable");
    const itemsBox = document.getElementById("orderDetail");
    const itemsTbody = document.getElementById("orderItems");
    const idLbl = document.getElementById("orderIdLbl");

    function row(o) {
        const created = new Date(o.created_at || o.createdAt || Date.now()).toLocaleString();
        const currentStatus = (o.status || "").toLowerCase();
        const total = money(o.total_amount ?? o.total ?? 0);

        const statusSelect = `
      <select data-status="${o.id}">
        ${STATUS_OPTIONS.map(s => `<option value="${s.value}" ${s.value === currentStatus ? "selected" : ""}>${s.label}</option>`).join("")}
      </select>
    `;

        // Si aún no traes nombre/email del usuario, deja vacío (o agrega cuando el backend lo devuelva)
        return `<tr>
      <td>${o.id}</td>
      <td>${o.user_name || o.usuario_nombre || ""}</td>
      <td>${o.user_email || o.usuario_email || ""}</td>
      <td>${total}</td>
      <td>${statusSelect}</td>
      <td>${created}</td>
      <td class="row-actions"><button class="btn light" data-view="${o.id}">Ver items</button></td>
    </tr>`;
    }

    async function render() {
        const orders = await listOrders();      // ← siempre array por el cliente
        table.innerHTML = orders.map(row).join("");
    }

    table.addEventListener("change", async (e) => {
        const sel = e.target.closest("select[data-status]");
        if (!sel) return;
        try {
            await updateOrder(sel.dataset.status, sel.value);  // ← PATCH { status }
        } catch (err) {
            alert(err.message || "No se pudo actualizar el estado");
            // Si falla, idealmente recargar la tabla para no dejar estado desincronizado
            render();
        }
    });

    table.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-view]");
        if (!btn) return;
        const id = btn.dataset.view;

        const items = await getOrder(id);  // ← siempre array por el cliente
        idLbl.textContent = `#${id}`;

        itemsTbody.innerHTML = items.map(it => {
            const name = it.product_name ?? it.nombre ?? it.name ?? "(producto)";
            const qty = it.quantity ?? it.cantidad ?? it.qty ?? 0;
            const up = Number(it.unit_price ?? it.precio_unidad ?? it.price_unit ?? it.price ?? 0);
            return `<tr>
        <td>${name}</td>
        <td>${qty}</td>
        <td>${money(up)}</td>
      </tr>`;
        }).join("");

        itemsBox.classList.remove("hidden");
        itemsBox.scrollIntoView({ behavior: "smooth" });
    });

    await render();
}