// Branded fallback shown instead of a blank "no photo" placeholder whenever
// a hotel/driver/guide has no real photo uploaded yet - guests should never
// see empty space or a text placeholder where an image belongs.
const ICONS = {
  hotel: (
    <path d="M4 21V10l8-5 8 5v11M9 21v-6h6v6M4 21h16" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  car: (
    <path
      d="M4 17h1a2 2 0 1 0 4 0h6a2 2 0 1 0 4 0h1v-4l-2-4H8L5 13H3v4h1zM6 13h12"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  guide: (
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
} as const;

export function DefaultCardImage({ kind = "hotel" }: { kind?: keyof typeof ICONS }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-navy to-brand-terracotta">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-12 w-12 text-white/70">
        {ICONS[kind]}
      </svg>
    </div>
  );
}
