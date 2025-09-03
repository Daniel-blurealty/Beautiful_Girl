// public/js/lib/confirmDialog.js
export function confirmDialog({
  title = "Confirmar",
  text = "¿Seguro que deseas continuar?",
  okText = "Aceptar",
  cancelText = "Cancelar",
} = {}) {
  const dlg = document.getElementById("confirmDlg");
  if (!dlg) {
    console.warn("[confirmDialog] #confirmDlg no existe; usando window.confirm");
    return Promise.resolve(window.confirm(text));
  }

  const titleEl = dlg.querySelector("#confirmTitle") || dlg.querySelector("h3");
  const textEl  = dlg.querySelector("#confirmText")  || dlg.querySelector("p");
  const okBtn   = dlg.querySelector("#confirmOk")    || dlg.querySelector("button[value='ok']");
  const cancelBtn = dlg.querySelector("#confirmCancel") || dlg.querySelector("button[value='cancel']");

  if (titleEl)  titleEl.textContent = title;
  if (textEl)   textEl.textContent  = text;
  if (okBtn)    okBtn.textContent   = okText;
  if (cancelBtn) cancelBtn.textContent = cancelText;

  return new Promise((resolve) => {
    const onClose = () => {
      dlg.removeEventListener("close", onClose);
      resolve(dlg.returnValue === "ok");
    };
    dlg.addEventListener("close", onClose, { once: true });
    dlg.showModal(); // IMPORTANTE: modal (no show())
  });
}
