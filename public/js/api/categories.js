import { request } from "../lib/http.js";

export async function listCategories() {
    const res = await request("/categories"); // ← devuelve { data: [...] }
    return Array.isArray(res) ? res : (res?.data ?? []);
}

export function createCategory(data) {
    return request("/categories", { method: "POST", body: data });
}

export function updateCategory(id, data) {
    return request(`/categories/${id}`, { method: "PUT", body: data });
}

export function deleteCategory(id) {
    return request(`/categories/${id}`, { method: "DELETE" });
}
