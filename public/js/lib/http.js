// public/js/lib/http.js

// === Helpers de DOM / UI que ya usas ===
export const $ = (s) => document.querySelector(s);
export const fmt = (n) => "$" + Number(n || 0).toFixed(2);

// === BASE de la API (estilo client.js) ===
const BASE_URL = "/api";

/** Normaliza la URL para que siempre pegue a /api, evitando doble // o doble /api */
function apiURL(path) {
  if (!path) return BASE_URL;
  // absoluto (http/https) → déjalo tal cual por si llamas externos (poco común aquí)
  if (/^https?:\/\//i.test(path)) return path;
  // si ya viene con /api al inicio, respétalo
  if (path.startsWith("/api/")) return path;
  // asegura el slash
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** GET JSON con params (solo lectura) */
export async function fetchJSON(path, params) {
  // Construye URL sobre /api
  const url = new URL(apiURL(path), window.location.origin);
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Envía/recibe JSON (misma-origin) → estilo client.js (siempre /api) */
export async function request(path, options = {}) {
  const url = apiURL(path);
  const opts = { credentials: "same-origin", ...options };

  // Si body es objeto (no FormData), lo enviamos como JSON
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers = { ...(opts.headers || {}), "Content-Type": "application/json" };
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    let msg;
    try { msg = (await res.json()).message || res.statusText; }
    catch { msg = res.statusText; }
    throw new Error(msg);
  }

  // Si no hay JSON, devuelve null
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

// === Normalizaciones que ya usabas ===
export function normalizeProduct(p) {
  return {
    id: p.id ?? p.idProducto ?? p.id_product,
    name: p.name ?? p.nombre ?? "(sin nombre)",
    price: p.price ?? p.precio ?? 0,
    image_url: p.image_url ?? p.imagen_url ?? "",
    category_name: p.category_name ?? p.categoria_name ?? "",
    category_id: p.category_id ?? p.categoria_id ?? null,
  };
}

export function pickProducts(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.products)) return res.products;
  return [];
}
