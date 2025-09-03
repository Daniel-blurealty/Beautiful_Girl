import { listCategories, createCategory, updateCategory, deleteCategory } from "../api/categories.js";
import { confirmDialog } from "../lib/confirmDialog.js";

export async function setupCategories() {
    const table = document.getElementById("catTable");
    const form = document.getElementById("catForm");
    const resetBtn = document.getElementById("catReset");
    const msg = document.getElementById("catMsg");

    async function render() {
        const cats = await listCategories();
        table.innerHTML = cats.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.nombre ?? c.name}</td>
        <td>${c.slug}</td>
        <td class="row-actions">
          <button class="btn light" data-edit="${c.id}">Editar</button>
          <button class="btn" data-del="${c.id}">Eliminar</button>
        </td>
      </tr>
    `).join("");
    }

    table.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const editId = btn.dataset.edit;
        const delId = btn.dataset.del;

        if (editId) {
            const tr = btn.closest("tr");
            form.id.value = editId;
            form.nombre.value = tr.children[1].textContent;
            form.slug.value = tr.children[2].textContent;
            form.descripcion.value = "";
        }
        if (delId) {
            const tr = btn.closest("tr");
            const catName = tr?.children?.[1]?.textContent || "esta categoría";

            const ok = await confirmDialog({
                title: "Eliminar categoría",
                text: `¿Eliminar "${catName}"? Esta acción no se puede deshacer.`,
                okText: "Sí, eliminar",
                cancelText: "Cancelar",
            });
            if (!ok) return;

            await deleteCategory(delId);
            await render();
            await fillProductCategories();
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: form.nombre.value.trim(),
            slug: form.slug.value.trim(),
            description: form.descripcion.value.trim(),
        };
        if (form.id.value) await updateCategory(form.id.value, payload);
        else await createCategory(payload);

        msg.textContent = "Guardado ✔";
        form.reset();
        await render();
        await fillProductCategories();
    });

    resetBtn?.addEventListener("click", () => form.reset());
    await render();

    async function fillProductCategories() {
        const select = document.getElementById("prodCategoria");
        if (!select) return;
        const cats = await listCategories();
        select.innerHTML = cats.map(c => `<option value="${c.id}">${c.nombre ?? c.name}</option>`).join("");
    }
    await fillProductCategories();
}
