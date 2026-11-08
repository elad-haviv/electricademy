"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@electricademy/ui";

/**
 * Accessible modal on the native <dialog> element, opened with showModal() while mounted:
 * the rest of the page is inert (focus stays inside), Escape and a click on the backdrop call onClose,
 * and on close focus goes back to the element that had it before (or to `returnFocus` if that one is gone).
 * Render it conditionally; unmounting closes it.
 */
export function Modal({
  title,
  onClose,
  children,
  variant = "center",
  returnFocus,
  headerExtra,
  className,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** "sheet": a bottom sheet on every screen size; "center": a bottom sheet on phones, centred from sm up. */
  variant?: "center" | "sheet";
  returnFocus?: RefObject<HTMLElement | null>;
  /** Shown in the header between the title and the close button. */
  headerExtra?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    // showModal focuses the first focusable element (the close button); prefer the one marked data-autofocus
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const fallback = returnFocus;
    return () => {
      dialog.close();
      // after React has removed the dialog and re-rendered the page
      requestAnimationFrame(() => {
        const visible = (el: HTMLElement | null | undefined) => el?.isConnected && el.getClientRects().length > 0;
        const target = visible(opener) ? opener : fallback?.current;
        if (visible(target)) target!.focus();
      });
    };
    // open once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCloseRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
      className={cn(
        "fixed m-0 max-h-none max-w-none overflow-visible bg-transparent p-0 text-slate-900 backdrop:bg-slate-950/50 dark:text-slate-100",
        variant === "sheet"
          ? "inset-x-0 top-auto bottom-0 w-full"
          : "inset-x-0 top-auto bottom-0 w-full sm:inset-0 sm:m-auto sm:h-fit sm:w-[calc(100%-2rem)] sm:max-w-sm",
      )}
    >
      <div
        className={cn(
          "flex flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] dark:bg-slate-900",
          variant === "center" && "sm:rounded-2xl",
          className,
        )}
      >
        {variant === "sheet" && <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />}
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          {headerExtra}
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="סגירה"
            className="-me-2 grid size-11 shrink-0 place-items-center rounded-lg text-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
