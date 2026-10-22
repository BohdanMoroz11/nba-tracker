import { useEffect, useState, type ReactNode } from "react";
import { injuryTone } from "../lib";

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
    <div className="h-1 w-full overflow-hidden rounded-full bg-line" title={`Importance ${value}/100 (minutes, production, role, salary)`}>
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
