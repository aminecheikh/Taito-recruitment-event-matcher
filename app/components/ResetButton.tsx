"use client";

const CONFIRM_TEXT = "Reset all demo data to the starting state? This cannot be undone.";

export function ResetButton({ action, className }: { action: () => Promise<void>; className: string }) {
  return (
    <form
      action={action}
      className="sm:ml-auto"
      onSubmit={(event) => {
        if (!window.confirm(CONFIRM_TEXT)) event.preventDefault();
      }}
    >
      <button type="submit" className={className}>Reset demo data</button>
    </form>
  );
}
