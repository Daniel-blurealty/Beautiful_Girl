import { request } from "../lib/http.js";

export async function listProducts(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.set(k, v);
  });
  const qs = usp.toString();
  return request(`/products${qs ? `?${qs}` : ""}`);
}

export function getProduct(idOrSlug) {
  return request(`/products/${encodeURIComponent(idOrSlug)}`);
}

export function createProduct(data) {
  const form = new FormData();
  if (data.name !== undefined) form.append("name", data.name);
  if (data.slug) form.append("slug", data.slug);
  if (data.description !== undefined) form.append("description", data.description);
  if (data.price !== undefined) form.append("price", String(data.price));
  if (data.stock !== undefined) form.append("stock", String(data.stock));
  if (data.category_id !== undefined) form.append("category_id", String(data.category_id));
  if (data.file) form.append("image", data.file);

  // request() detecta FormData y no setea Content-Type
  return request("/products", { method: "POST", body: form });
}

export function updateProduct(id, data) {
  const form = new FormData();
  if (data.name !== undefined) form.append("name", data.name);
  if (data.slug !== undefined) form.append("slug", data.slug);
  if (data.description !== undefined) form.append("description", data.description);
  if (data.price !== undefined) form.append("price", String(data.price));
  if (data.stock !== undefined) form.append("stock", String(data.stock));
  if (data.category_id !== undefined) form.append("category_id", String(data.category_id));
  if (data.file) form.append("image", data.file);

  return request(`/products/${id}`, { method: "PUT", body: form });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, { method: "DELETE" });
}
