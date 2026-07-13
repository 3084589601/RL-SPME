"use client";

import { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---- types ---- */

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  exiting: boolean;
}

type Action =
  | { type: "ADD"; toast: Toast }
  | { type: "MARK_EXIT"; id: number }
  | { type: "REMOVE"; id: number };

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  warning: (msg: string) => void;
}

/* ---- constants ---- */

const LIFETIME = 3500;
const EXIT_ANIM_MS = 260;
let nextId = 1;

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS: Record<ToastType, string> = {
  success: "border-emerald-400 bg-emerald-50 text-emerald-800",
  error: "border-red-400 bg-red-50 text-red-800",
  info: "border-blue-400 bg-blue-50 text-blue-800",
  warning: "border-amber-400 bg-amber-50 text-amber-800",
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-amber-500",
};

/* ---- reducer ---- */

function toastReducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.toast];
    case "MARK_EXIT":
      return state.map((t) => (t.id === action.id ? { ...t, exiting: true } : t));
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

/* ---- context ---- */

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ---- provider ---- */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const scheduleRemove = useCallback((id: number) => {
    dispatch({ type: "MARK_EXIT", id });
    const rm = setTimeout(() => {
      dispatch({ type: "REMOVE", id });
      timers.current.delete(id);
    }, EXIT_ANIM_MS);
    timers.current.set(id, rm);
  }, []);

  const cancelTimer = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      cancelTimer(id);
      scheduleRemove(id);
    },
    [cancelTimer, scheduleRemove]
  );

  const add = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      dispatch({ type: "ADD", toast: { id, type, message, exiting: false } });
      const auto = setTimeout(() => scheduleRemove(id), LIFETIME);
      timers.current.set(id, auto);
    },
    [scheduleRemove]
  );

  const success = useCallback((msg: string) => add("success", msg), [add]);
  const error = useCallback((msg: string) => add("error", msg), [add]);
  const info = useCallback((msg: string) => add("info", msg), [add]);
  const warning = useCallback((msg: string) => add("warning", msg), [add]);

  useEffect(() => {
    const current = timers.current;
    return () => {
      current.forEach((t) => clearTimeout(t));
      current.clear();
    };
  }, []);

  return (
    <ToastCtx.Provider value={{ success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

/* ---- presentation ---- */

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="通知"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-[420px] backdrop-blur-sm transition-all",
              COLORS[t.type],
              t.exiting
                ? "opacity-0 translate-x-6 scale-95"
                : "opacity-100 translate-x-0 scale-100 animate-toast-enter"
            )}
            style={{ transitionDuration: `${EXIT_ANIM_MS}ms` }}
            role="alert"
          >
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", ICON_COLORS[t.type])} />
            <p className="flex-1 text-sm leading-relaxed break-words">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
              aria-label="关闭通知"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
