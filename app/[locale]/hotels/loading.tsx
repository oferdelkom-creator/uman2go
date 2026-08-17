import { Section } from "@/components/ui/Section";

export default function HotelsLoading() {
  return (
    <Section>
      <div className="h-9 w-64 animate-pulse rounded-lg bg-brand-cream-deep" />
      <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded-lg bg-brand-cream-deep" />

      <div className="mt-6 h-24 animate-pulse rounded-2xl bg-brand-cream-deep" />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-brand-terracotta/10 ring-1 ring-brand-terracotta/5">
            <div className="aspect-[4/3] animate-pulse bg-brand-cream-deep" />
            <div className="flex flex-col gap-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-brand-cream-deep" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-brand-cream-deep" />
              <div className="mt-2 h-10 animate-pulse rounded-full bg-brand-cream-deep" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
