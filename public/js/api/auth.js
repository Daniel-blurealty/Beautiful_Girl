import { request } from "../lib/http.js";

export function me() {
  return request("/auth/me");
}

export function login(email, password) {
  return request("/auth/", {
    method: "POST",
    body: { email, password },
  });
}

export function registerUser(name, email, password) {
  return request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}
