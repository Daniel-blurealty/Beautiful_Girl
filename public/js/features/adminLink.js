// public/js/features/adminLink.js
export async function initAdminLink({ hostSelector = ".actions", href = "/admin.html" } = {}) {
  let me;
  try { me = await getMe(); } catch { return; }

  const role = (me?.user?.role ?? me?.role ?? "").toLowerCase();
  if (role !== "admin") return;

  const host =
    document.querySelector(hostSelector) ||
    document.querySelector("header nav") ||
    document.querySelector("header") ||
    document.body;

  if (!host || host.querySelector('[data-admin-link="true"]')) return;

  const a = document.createElement("a");
  a.href = href;
  a.textContent = "Panel Admin";
  a.setAttribute("data-admin-link", "true");
  a.className = "btn-admin";
  host.appendChild(a);

  if (!document.getElementById("admin-btn-styles")) {
    const style = document.createElement("style");
    style.id = "admin-btn-styles";
    style.textContent = `
      .btn-admin{
        display:inline-block;margin-left:.5rem;padding:.4rem .8rem;border-radius:10px;
        background:var(--rosa,#ff4d88);color:#fff;text-decoration:none;
        border:1px solid rgba(0,0,0,.03);box-shadow:0 2px 6px rgba(255,77,136,.2);font-weight:500;
      }
      .btn-admin:hover{opacity:.92}
    `;
    document.head.appendChild(style);
  }
}

async function getMe() {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) throw new Error("No auth");
  return res.json();
}
