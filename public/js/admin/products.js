// public/js/admin/products.js
import { listProducts, deleteProduct, createProduct, updateProduct } from "../api/products.js";
import { listCategories } from "../api/categories.js";
import { confirmDialog } from "../lib/confirmDialog.js";


export async function setupProducts() {
    const table = document.getElementById("prodTable");
    const form = document.getElementById("productForm");
    const msg = document.getElementById("prodMsg");
    const resetBtn = document.getElementById("prodReset");
    const searchInp = document.getElementById("prodSearch");
    const sortSel = document.getElementById("prodSort");
    const reloadBtn = document.getElementById("prodReload");
    const catSelect = document.getElementById("prodCategoria");
    const submitBtn = form?.querySelector('button[type="submit"]');
    const imgInput = document.getElementById("prodImage");
    const imgPreview = document.getElementById("prodImagePreview");

    let CAT_MAP = {};

    // ---- estado/métodos de edición ----

    function enterEditMode(patch = {}) {
        form.dataset.mode = "edit";
        submitBtn && (submitBtn.textContent = "Actualizar");
        if (patch.id != null) form.id.value = patch.id;        // hidden id
    }

    function exitEditMode() {
        form.dataset.mode = "create";
        submitBtn && (submitBtn.textContent = "Guardar");
        form.id.value = "";           // muy importante: limpiar id
        form.reset();                 // limpia inputs (incluye file)
        // deja seleccionada la primera categoría (opcional)
        if (catSelect && catSelect.options.length) catSelect.selectedIndex = 0;
    }

    // Inicia en modo create
    exitEditMode();

    async function fillCategories() {
        const cats = await listCategories();
        // Normaliza nombre y arma el mapa
        CAT_MAP = Object.fromEntries(
            cats.map(c => [String(c.id), c.nombre ?? c.name])
        );
        // Opciones del select
        catSelect.innerHTML = cats
            .map(c => `<option value="${c.id}">${c.nombre ?? c.name}</option>`)
            .join("");
    }

    function row(p) {
        const catId = String(p.categoria_id ?? p.category_id ?? "");
        const catName = p.category_name ?? p.categoria_name ?? "—";
        const imgUrl = p.image_url ?? p.imagen_url ?? "";

        return `<tr data-id="${p.id}"
              data-cat-id="${catId}"
              data-image-url="${imgUrl}">
    <td>${p.id}</td>
    <td>${p.nombre || p.name}</td>
    <td>$${Number(p.precio ?? p.price).toFixed(2)}</td>
    <td>${p.stock}</td>
    <td>${catName}</td>
    <td class="row-actions">
      <button class="btn light" data-edit="${p.id}">Editar</button>
      <button class="btn" data-del="${p.id}">Eliminar</button>
    </td>
  </tr>`;
    }

    async function render() {
        const res = await listProducts({
            q: searchInp?.value?.trim() || undefined,
            sort: sortSel?.value || undefined,
            limit: 100
        });
        const list = Array.isArray(res) ? res : (res.data || res.items || []);
        table.innerHTML = list.map(row).join("");
    }

    // ---- eventos tabla ----
    table.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const editId = btn.dataset.edit;
        const delId = btn.dataset.del;

        if (editId) {
            // Entrar a edición con los valores de la fila
            const tr = btn.closest("tr");
            enterEditMode({ id: editId });

            const existing = tr.dataset.imageUrl;
            if (existing) {
                imgPreview.src = existing;
                imgPreview.style.display = "inline-block";
            } else {
                imgPreview.src = "";
                imgPreview.style.display = "none";
            }


            form.name.value = tr.children[1].textContent;
            form.price.value = tr.children[2].textContent.replace("$", "").trim();
            form.stock.value = tr.children[3].textContent;

            const currentCat = tr.children[4].textContent;
            if (currentCat && catSelect) {
                [...catSelect.options].forEach(o => (o.selected = o.value === currentCat));
            }
            // limpia campos no inferidos de la fila
            form.slug.value = "";
            form.description.value = "";
            form.image.value = "";
            if (imgInput) imgInput.value = "";

            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (delId) {
            const tr = btn.closest("tr");
            const name = tr?.children?.[1]?.textContent || "este producto";

            const ok = await confirmDialog({
                title: "Eliminar producto",
                text: `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
                okText: "Sí, eliminar",
                cancelText: "Cancelar",
            });
            if (!ok) return;

            await deleteProduct(delId);
            if (form.id.value === String(delId)) exitEditMode();
            await render();
        }
    });

    // ---- submit ----
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            name: form.name.value.trim(),
            slug: form.slug.value.trim(),
            description: form.description.value.trim(),
            price: Number(form.price.value),
            stock: Number(form.stock.value),
            category_id: Number(catSelect?.value),
            file: form.image.files?.[0]
        };

        try {
            if (form.dataset.mode === "edit" && form.id.value) {
                await updateProduct(form.id.value, data);
            } else {
                await createProduct(data);
            }
            msg.textContent = "Guardado ✔";
            form.reset();
            if (imgPreview) { imgPreview.src = ""; imgPreview.style.display = "none"; }
            exitEditMode();     // ← vuelve a modo crear
            await render();
        } catch (err) {
            alert(err.message || "Error guardando producto");
        }
    });

    // ---- cancelar / limpiar ----
    resetBtn?.addEventListener("click", () => {
        // que no solo limpie, sino que salga de modo edición
        form.reset();
        if (imgPreview) { imgPreview.src = ""; imgPreview.style.display = "none"; }
        exitEditMode();
    });

    // opcional: tecla Esc cancela edición
    form.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            exitEditMode();
        }
    });

    imgInput?.addEventListener("change", () => {
        const file = imgInput.files?.[0];
        if (!file) { imgPreview.src = ""; imgPreview.style.display = "none"; return; }
        if (!/^image\//.test(file.type)) { alert("Selecciona una imagen válida"); imgInput.value = ""; return; }
        if (file.size > 3 * 1024 * 1024) { alert("Máximo 3MB"); imgInput.value = ""; return; }
        imgPreview.src = URL.createObjectURL(file);
        imgPreview.style.display = "inline-block";
    });
    // ---- filtros ----
    reloadBtn?.addEventListener("click", render);
    searchInp?.addEventListener("keyup", (e) => { if (e.key === "Enter") render(); });
    sortSel?.addEventListener("change", render);

    await fillCategories();
    await render();
}
