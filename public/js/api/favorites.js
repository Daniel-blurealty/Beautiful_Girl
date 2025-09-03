import { request } from "../lib/http.js";

export async function listFavorites() {
  const res = await request("/favorites");
  console.log("favorites",Array.isArray(res) ? res : (res?.data ?? []))
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export function addFavorite(productId) {
  return request("/favorites", { method: "POST", body: { product_id: Number(productId) } });
}

export function removeFavorite(productId) {
  return request(`/favorites/${productId}`, { method: "DELETE" });
}
