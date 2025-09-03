import { request as api } from "./lib/http.js";
import { setupCategories } from "./admin/categories.js";
import { setupProducts } from "./admin/products.js";
import { setupOrders } from "./admin/orders.js";

async function ensureAdmin() {
  try {
    const me = await api("/auth/me");
    console.log("[admin guard] me:", me);
    const role = (me?.user?.role ?? me?.role ?? "").toLowerCase();
    if (role !== "admin") {
      alert("Acceso solo para administradores");
      location.href = "/#/";
      return false;
    }
    const name = me?.user?.name ?? me?.name ?? "Admin";
    const badge = document.getElementById("adminUser");
    if (badge) badge.textContent = `${name} · admin`;
    return true;
  } catch (e) {
    console.error("[admin guard] error:", e);
    alert("Debes iniciar sesión como admin.");
    location.href = "/#/login";
    return false;
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const id = btn.dataset.tab;
      document.querySelectorAll("section[id^='tab-']").forEach((s) => s.classList.add("hidden"));
      document.getElementById(`tab-${id}`).classList.remove("hidden");
    });
  });
}

(async () => {
  if (!(await ensureAdmin())) return;
  setupTabs();
  await setupCategories();
  await setupProducts();
  await setupOrders();
})();
