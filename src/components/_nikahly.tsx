import { ReactNode } from 'react';

export function Crescent({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M22 8a10 10 0 1 0 0 16 8 8 0 1 1 0-16Z" fill="#c9a84c" />
      <path d="M24 13.5l1 2 2 .3-1.5 1.4.4 2.1L24 18.4l-1.9 1 .4-2.2-1.5-1.4 2-.3 1-2Z" fill="#c9a84c" />
    </svg>
  );
}

export function GoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`nk-divider ${className}`} aria-hidden>
      <span className="nk-divider-mark" />
    </div>
  );
}

export function Bismillah({ className = '' }: { className?: string }) {
  return (
    <div className={`nk-bismillah ${className}`} dir="rtl" lang="ar">
      بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
    </div>
  );
}

export function SectionTitle({
  eyebrow, title, subtitle,
}: {
  eyebrow?: string; title: string; subtitle?: string;
}) {
  return (
    <div>
      {eyebrow && <div className="nk-eyebrow mb-2">{eyebrow}</div>}
      <h2 className="text-3xl md:text-4xl font-display font-semibold text-indigo-900 leading-tight">{title}</h2>
      {subtitle && <p className="text-indigo-900/60 mt-2">{subtitle}</p>}
    </div>
  );
}

export function Card({
  children, className = '', accent = false,
}: {
  children: ReactNode; className?: string; accent?: boolean;
}) {
  return (
    <div className={`nk-card ${accent ? 'border-gold-400/50' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Stat({
  label, value, hint, tone = 'indigo',
}: {
  label: string; value: string | number; hint?: string; tone?: 'indigo' | 'gold' | 'emerald' | 'rose';
}) {
  const toneClasses = {
    indigo: 'text-indigo-900',
    gold: 'text-gold-700',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
  };
  return (
    <Card className="p-5">
      <div className="nk-eyebrow mb-2">{label}</div>
      <div className={`text-4xl font-display font-semibold ${toneClasses[tone]}`}>{value}</div>
      {hint && <div className="text-xs text-indigo-900/55 mt-1">{hint}</div>}
    </Card>
  );
}
