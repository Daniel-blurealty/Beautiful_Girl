import { request } from "../lib/http.js";

export async function listOrders() {
  const res = await request("/orders");
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export function createOrder(items) {
  return request("/orders", {
    method: "POST",
    body: { items },
  });
}

export function getOrder(id) {
  return request(`/orders/${id}`);
}

export function updateOrder(id, status) {
  return request(`/orders/${id}`, {
    method: "PUT",
    body: { status: status }
  });
}

export function deleteOrder(id) {
  return request(`/orders/${id}`, {
    method: "DELETE",
  });
}
