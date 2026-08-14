import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-xl border border-brand-navy/15 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand-terracotta focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20 transition-colors";

export function FormField({
  label,
  htmlFor,
  children,
  required,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-brand-navy">
        {label}
        {required && <span className="text-brand-terracotta"> *</span>}
      </label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldClass} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} min-h-24`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={fieldClass} {...props} />;
}
