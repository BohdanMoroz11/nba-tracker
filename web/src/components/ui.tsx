import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { injuryTone } from "../lib";
import { tip } from "../glossary";

// ---------- tooltips ----------
// One listener for the whole app: any element with data-tip shows a tooltip on hover or keyboard focus.
// data-tip-title adds a heading. data-tip-overflow shows it only when the element's text is cut off,
// which is how truncated summaries reveal their full text.

type TipState = { title?: string; body: string; rect: DOMRect };

const cutOff = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;

export function Tooltips() {
  const [t, setT] = useState<TipState | null>(null);
  useEffect(() => {
    let current: HTMLElement | null = null;
    let timer: number | undefined;
    const hide = () => {
      current = null;
      clearTimeout(timer);
      setT(null);
    };
    const over = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-tip]") ?? null;
      if (el === current) return;
      hide();
      if (!el || !el.dataset.tip) return;
      if ("tipOverflow" in el.dataset && !cutOff(el)) return;
      current = el;
      timer = window.setTimeout(() => setT({ title: el.dataset.tipTitle, body: el.dataset.tip!, rect: el.getBoundingClientRect() }), e.type === "focusin" ? 0 : 180);
    };
    const out = (e: MouseEvent) => !e.relatedTarget && hide();
    document.addEventListener("mouseover", over);
    document.addEventListener("focusin", over);
    document.addEventListener("mouseout", out);
    document.addEventListener("pointerdown", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("hashchange", hide);
    return () => {
      document.removeEventListener("mouseover", over);
      document.removeEventListener("focusin", over);
      document.removeEventListener("mouseout", out);
      document.removeEventListener("pointerdown", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("hashchange", hide);
    };
  }, []);
  return t ? createPortal(<TipBox {...t} />, document.body) : null;
}

function TipBox({ title, body, rect }: TipState) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const box = ref.current!.getBoundingClientRect();
    const gap = 6;
    const above = rect.top - box.height - gap;
    const top = above >= 8 ? above : Math.min(rect.bottom + gap, innerHeight - box.height - 8);
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - box.width / 2, innerWidth - box.width - 8));
    setPos({ left, top });
  }, [rect]);
  return (
    <div
      ref={ref}
      role="tooltip"
      className="pointer-events-none fixed z-[60] max-w-[min(340px,calc(100vw-16px))] whitespace-pre-line rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] leading-snug text-ink/90 shadow-xl"
      style={pos ?? { left: 0, top: 0, visibility: "hidden" }}
    >
      {title && <div className="mb-0.5 font-semibold text-ink">{title}</div>}
      {body}
    </div>
  );
}

/** A glossary term: dotted underline, explainer on hover. */
export function Term({ k, extra, className = "", children }: { k: string; extra?: string; className?: string; children: ReactNode }) {
  return <span {...tip(k, extra)} tabIndex={0} className={`explain ${className}`}>{children}</span>;
}

/** Briefly highlights its content when the value changes within the same scope (a live update), never on first render. */
export function Flash({ value, scope, className = "", children }: { value?: string; scope: string; className?: string; children?: ReactNode }) {
  const prev = useRef({ value, scope });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (prev.current.value !== value && prev.current.scope === scope && value) setN((x) => x + 1);
    prev.current = { value, scope };
  }, [value, scope]);
  return <span key={n} className={`${n ? "flash" : ""} ${className}`}>{children ?? value}</span>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-line pb-2">
      <h3 className="font-display text-xl font-bold tracking-wide">{children}</h3>
      {aside && <div className="text-xs text-mute">{aside}</div>}
    </div>
  );
}

export function Stat({ value, label, big }: { value: ReactNode; label: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={`tnum font-display font-bold leading-none ${big ? "text-4xl" : "text-2xl"}`}>{value}</div>
      <div className="mt-1 text-xs text-mute">{label}</div>
    </div>
  );
}

export function InjuryPill({ status, small }: { status?: string; small?: boolean }) {
  const tone = injuryTone(status);
  if (!tone) return null;
  const cls = tone === "out" ? "bg-out/15 text-out ring-out/40" : "bg-doubt/15 text-doubt ring-doubt/40";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ring-1 ${cls} ${small ? "px-1.5 text-[11px]" : "px-2 py-0.5 text-xs"}`}>
      {status}
    </span>
  );
}

export function Headshot({ src, name, className = "" }: { src?: string; name: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
    return (
      <div className={`grid place-items-center bg-panel-2 font-display font-bold text-mute ${className}`} aria-hidden>
        {initials}
      </div>
    );
  }
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className={`object-cover object-top ${className}`} />;
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-mute" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-mute border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorNote({ error, what }: { error: unknown; what: string }) {
  return (
    <div className="rounded-lg border border-out/40 bg-out/10 p-4 text-sm">
      Couldn't load {what}: {(error as Error)?.message ?? "unknown error"}. ESPN may be slow; it retries automatically, or reload the page.
    </div>
  );
}

export function ImportanceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-line" {...tip("importance", `${value}/100`)}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(value, 3)}%`, background: color }} />
    </div>
  );
}

export function Modal({ onClose, label, className = "", children }: { onClose: () => void; label: string; className?: string; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <button className="absolute inset-0 bg-black/65" onClick={onClose} aria-label="Close" />
      <div className={`modal-in relative flex h-full w-full flex-col overflow-hidden bg-court shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl sm:border sm:border-line ${className}`}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-3 py-1 text-sm hover:bg-black/70">
          Close
        </button>
        {children}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value, onChange, options, className = "",
}: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={`inline-flex rounded-lg bg-panel p-0.5 ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${o.value === value ? "bg-panel-2 text-ink shadow" : "text-mute hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
