// Base relativa (monolito)
const BASE_URL = "/api";

export async function request(path, options = {}) {
  const opts = { ...options };
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers = { ...(opts.headers || {}), "Content-Type": "application/json" };
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(BASE_URL + path, opts);
  if (!res.ok) {
    let msg;
    try { msg = (await res.json()).message || res.statusText; }
    catch { msg = res.statusText; }
    throw new Error(msg);
  }
  return res.json();
}
