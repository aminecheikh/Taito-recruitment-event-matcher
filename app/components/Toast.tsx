"use client";

import { useEffect, useMemo, useState } from "react";
import { createToastController, type Toast } from "./toastController";

/** A short confirmation that goes away on its own after a few seconds; it can be closed early. */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const controller = useMemo(() => createToastController(setToast), []);
  useEffect(() => controller.dispose, [controller]);
  return { toast, showToast: controller.show, dismissToast: controller.dismiss };
}

export function ToastView({ toast, onDismiss }: { toast: Toast | null; onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex justify-center" aria-live="polite">
      {toast && (
        <p key={toast.id} role="status" className="notice notice-success pointer-events-auto flex items-center gap-3 shadow-lg">
          <span>{toast.text}</span>
          <button type="button" className="btn btn-sm btn-quiet" aria-label="Close message" onClick={onDismiss}>
            ×
          </button>
        </p>
      )}
    </div>
  );
}
