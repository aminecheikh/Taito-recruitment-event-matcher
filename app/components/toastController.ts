/** How long a toast stays before it goes on its own. */
export const TOAST_MS = 3000;

export type Toast = { id: number; text: string };

/**
 * One toast at a time: a new message replaces the current one and restarts the timer, so quick
 * repeated actions never stack. Plain timers so it is testable without a browser.
 */
export function createToastController(onChange: (toast: Toast | null) => void, ms: number = TOAST_MS) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let seq = 0;
  const stop = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  return {
    show(text: string) {
      stop();
      seq += 1;
      onChange({ id: seq, text });
      timer = setTimeout(() => {
        timer = undefined;
        onChange(null);
      }, ms);
    },
    dismiss() {
      stop();
      onChange(null);
    },
    dispose: stop,
  };
}
