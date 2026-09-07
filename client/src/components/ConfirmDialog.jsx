import Modal from "./Modal";
import Button from "./Button";
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  children,
  pending,
  confirmLabel = "Confirm",
  destructive = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      busy={pending}
      footer={
        <>
          <Button variant="secondary" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={onConfirm}
            className={destructive ? "!bg-red-700 !text-white" : ""}
          >
            {pending ? "Please wait…" : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
