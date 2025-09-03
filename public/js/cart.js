// client/js/cart.js
const KEY = "cart";

export function getCart() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function setCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  const count = items.reduce((a, i) => a + i.quantity, 0);
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = count;
}

export function addToCart(p) {
  const items = getCart();
  const idx = items.findIndex(i => i.product_id === p.id);
  if (idx >= 0) items[idx].quantity += 1;
  else items.push({ product_id: p.id, name: p.name, price: Number(p.price), quantity: 1, image_url: p.image_url });
  setCart(items);
}
