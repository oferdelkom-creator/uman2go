export function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span
      dir="ltr"
      className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-2.5 py-1 text-xs font-bold text-brand-terracotta-dark"
    >
      <span aria-hidden>
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </span>
      <span className="tabular-nums">{rating.toFixed(1)}</span>
    </span>
  );
}
