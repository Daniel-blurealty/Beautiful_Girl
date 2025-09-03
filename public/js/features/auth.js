// public/js/features/auth.js
import { $, request } from "../lib/http.js";

export function initAuth(els = {}) {
  // Permite inyectar refs desde main.js, pero si no están, las buscamos.
  const refs = {
    loginDlg: els.loginDlg || $("#loginDlg"),
    registerDlg: els.registerDlg || $("#registerDlg"),
    loginOpen: els.loginOpen || $("#loginOpen"),
    logoutBtn: els.logoutBtn || $("#logoutBtn"),
    userBadge: els.userBadge || $("#userBadge"),
    loginForm: els.loginForm || $("#loginForm"),
    loginCancel: els.loginCancel || $("#loginCancel"),
    registerForm: els.registerForm || $("#registerForm"),
    registerCancel: els.registerCancel || $("#registerCancel"),
    openRegister: els.openRegister || $("#openRegister"),
  };

  const nameEl =
    document.getElementById("userName") ||
    refs.userBadge?.querySelector?.("#userName") ||
    null;

  let currentUser = null;
  const listeners = new Set(); // onAuthChange
  const getName = (me) =>
    me?.user?.name ?? me?.name ?? me?.user?.email ?? me?.email ?? "";

  function emit() { listeners.forEach(fn => fn(currentUser)); }

  function openLogin() { refs.loginDlg?.showModal(); }
  function closeLogin() { refs.loginDlg?.close(); }
  function openRegister() { refs.registerDlg?.showModal(); }
  function closeRegister() { refs.registerDlg?.close(); }

  function paintUser() {
    const isLogged = !!currentUser;
    const role = currentUser?.role || currentUser?.user?.role || "";

    // Toggle botones login/logout
    refs.loginOpen?.classList.toggle("hidden", isLogged);
    refs.logoutBtn?.classList.toggle("hidden", !isLogged);

    // Badge de usuario
    if (refs.userBadge) {
      refs.userBadge.classList.toggle("hidden", !isLogged);
      if (nameEl) {
        nameEl.textContent = isLogged ? getName(currentUser) : "";
      } else {
        refs.userBadge.textContent = isLogged ? getName(currentUser) : "";
      }
    }

    // Panel Admin
    const adminLink = document.getElementById("adminLink");
    if (adminLink) {
      if (role.toLowerCase() === "admin") {
        adminLink.classList.remove("hidden");
      } else {
        adminLink.classList.add("hidden");
      }
    }
  }

  async function refresh() {
    try {
      const data = await request("/auth/me");
      currentUser = data?.user || null;
    } catch { currentUser = null; }
    paintUser();
    emit();
    return currentUser;
  }

  // Listeners UI
  refs.loginOpen?.addEventListener("click", openLogin);
  refs.logoutBtn?.addEventListener("click", async () => {
    try { await request("/auth/logout", { method: "POST" }); } catch { }
    await refresh();
  });

  refs.openRegister?.addEventListener("click", (e) => {
    e.preventDefault();
    closeLogin();
    openRegister();
  });
  refs.loginCancel?.addEventListener("click", () => {
    closeLogin();
  });

  refs.loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitter = e.submitter;
    if (submitter && submitter.value === "cancel") {
      closeLogin();
      return;
    }
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email");
    const password = fd.get("password");
    try {
      await request("/auth/", { method: "POST", body: { email, password } });
      closeLogin();
      await refresh();
    } catch (err) {
      alert(err.message || "Credenciales inválidas");
    }
  });

  refs.registerCancel?.addEventListener("click", () => {
    closeRegister();
  });

  refs.registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const name = fd.get("name");
    const email = fd.get("email");
    const password = fd.get("password");

    try {
      await request("/auth/register", { method: "POST", body: { name, email, password } });
      closeRegister();
      // opcional: login automático
      await request("/auth/", { method: "POST", body: { email, password } });
      await refresh();
    } catch (err) {
      alert(err.message || "No se pudo registrar");
    }
  });

  // Utilidades exportadas
  function getUser() { return currentUser; }
  async function requireAuth(cb) {
    const u = await refresh();
    if (!u) { openLogin(); return; }
    cb?.(u);
  }
  function onAuthChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  return { refresh, getUser, requireAuth, onAuthChange };
}
