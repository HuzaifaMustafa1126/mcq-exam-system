import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

let openDialogs = 0;
let previousOverflow;
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  busy = false,
  closeOnOverlay = false,
}) {
  const dialog = useRef(null);
  const close = useRef(onClose);
  const titleId = useId();
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const node = dialog.current;
    node.showModal();
    window.dispatchEvent(new Event("mcq:dialog-change"));
    node.querySelector("textarea, input, select, button")?.focus();
    return () => {
      node.close();
      window.dispatchEvent(new Event("mcq:dialog-change"));
      if (--openDialogs === 0) document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  const parts = Children.toArray(children);
  const form = parts.length === 1 && parts[0].type === "form" ? parts[0] : null;
  const content = form ? Children.toArray(form.props.children) : parts;
  const last = content.at(-1);
  const hasActions =
    isValidElement(last) &&
    last.type === "div" &&
    last.props.className === "dialog-actions";
  const actions = footer || (hasActions ? last : null);
  const body = hasActions ? content.slice(0, -1) : content;
  const layout = (
    <>
      <div className="modal-body">{body}</div>
      {actions && <footer className="modal-footer">{actions}</footer>}
    </>
  );
  return createPortal(
    <dialog
      ref={dialog}
      aria-modal="true"
      aria-labelledby={titleId}
      className="academy-modal modal-shell"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close.current();
      }}
      onClick={(event) => {
        if (closeOnOverlay && !busy && event.target === event.currentTarget)
          close.current();
      }}
    >
      <header className="modal-header">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-lg p-2"
        >
          <X size={20} />
        </button>
      </header>
      {form ? cloneElement(form, { className: "modal-form" }, layout) : layout}
    </dialog>,
    document.body,
  );
}
