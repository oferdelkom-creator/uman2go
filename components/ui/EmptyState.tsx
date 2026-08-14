export function EmptyState({
  title,
  description,
  className = "",
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-br from-brand-navy to-brand-navy-dark p-10 text-center text-white ${className}`}
    >
      <svg width="64" height="40" viewBox="0 0 64 40" fill="none" aria-hidden>
        <path d="M0 40 A32 32 0 0 1 64 40 Z" fill="#e8a33d" opacity="0.9" />
        <path d="M14 30 L20 20 L24 24 L34 12" stroke="#faf6ef" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="30" y="18" width="8" height="12" rx="1" fill="#faf6ef" />
        <rect x="44" y="24" width="10" height="6" rx="1.5" fill="#faf6ef" />
        <circle cx="46.5" cy="31" r="1.5" fill="#1b3a5f" />
        <circle cx="52" cy="31" r="1.5" fill="#1b3a5f" />
        <path
          d="M32 6 l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L26.2 10.2l4-.6Z"
          fill="#e8a33d"
        />
      </svg>
      <p className="font-display text-lg font-bold">{title}</p>
      {description && <p className="text-sm text-white/80">{description}</p>}
    </div>
  );
}
