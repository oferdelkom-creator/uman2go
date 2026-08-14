// Redrawn from scratch as an inline SVG (the original PNG asset was lost
// with the rest of the old app). Composed from the brand's own motif: a
// navy horizon, a plane, a building, a car, and a Star of David.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      className={className}
      role="img"
      aria-label="Uman2Go"
    >
      <path d="M0 44 A32 30 0 0 1 64 44 Z" fill="#1b3a5f" />
      <rect x="27" y="20" width="9" height="24" rx="1" fill="#1c7c7c" />
      <rect x="29.5" y="24" width="1.8" height="1.8" fill="#faf6ef" />
      <rect x="33.5" y="24" width="1.8" height="1.8" fill="#faf6ef" />
      <rect x="29.5" y="29" width="1.8" height="1.8" fill="#faf6ef" />
      <rect x="33.5" y="29" width="1.8" height="1.8" fill="#faf6ef" />
      <path
        d="M4 38 L14 32 L18 34 L14 38 L20 38 L24 35 L27 36 L27 44 L4 44 Z"
        fill="#a0522d"
      />
      <circle cx="9" cy="44" r="2" fill="#2b1710" />
      <circle cx="21" cy="44" r="2" fill="#2b1710" />
      <path
        d="M38 26 L54 12 L58 13 L46 24 L52 23 L58 18 L60 19 L54 27 L42 30 Z"
        fill="#faf6ef"
      />
      <path
        d="M50 5 L52 9.5 L57 10 L53.3 13.2 L54.3 18 L50 15.5 L45.7 18 L46.7 13.2 L43 10 L48 9.5 Z"
        fill="#e8a33d"
      />
    </svg>
  );
}
