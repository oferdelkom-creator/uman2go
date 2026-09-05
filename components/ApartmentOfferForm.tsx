"use client";
import { useRef, useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import Script from "next/script";
import { APARTMENT_ADS_ID, recordApartmentConversion, setApartmentAdsConsent } from "@/lib/apartment-ads";

export default function ApartmentOfferForm() {
  const requestId = useRef<string | null>(null);
  const [measurement, setMeasurement] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "emailed" | "error">("idle");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const values = Object.fromEntries(new FormData(e.currentTarget));
    requestId.current ??= crypto.randomUUID();
    setStatus("sending");
    try {
      const attribution = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => ["utm_source", "utm_medium", "utm_campaign", "gclid"].includes(k)));
      const response = await fetch("/api/notify/apartment-offer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, id: requestId.current, attribution }), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || !result.saved) throw new Error("not saved");
      setStatus(result.emailAccepted ? "emailed" : "saved");
      try { recordApartmentConversion(requestId.current); } catch {}
      try { track("apartment_offer_saved", { campaign: "uman-september-2026", emailAccepted: !!result.emailAccepted }); } catch {}
    } catch { setStatus("error"); }
  }
  if (status === "saved" || status === "emailed") return <div role="status" className="rounded-xl bg-emerald-50 p-5 text-emerald-950">
    <p className="font-bold">Вашу пропозицію збережено.</p>
    <p className="mt-2">{status === "emailed" ? "Сповіщення передано поштовому сервісу. Це ще не підтвердження оренди." : "Поштове сповіщення не підтверджено. Для термінового зв’язку напишіть нам напряму на адресу нижче."}</p>
  </div>;
  const fields = [
    ["full_name", "Ваше ім’я", "text", true], ["email", "Електронна пошта для відповіді", "email", true],
    ["phone", "Телефон (необов’язково)", "tel", false], ["area", "Точна адреса квартири", "text", true],
    ["capacity", "Кількість безпечних спальних місць", "number", true], ["asking_price", "Ціна за всі 4 ночі, USD", "number", true],
  ] as const;
  return <form onSubmit={submit} className="space-y-4">
    {measurement && <Script id="apartment-google-ads" src={`https://www.googletagmanager.com/gtag/js?id=${APARTMENT_ADS_ID}`} strategy="afterInteractive" />}
    {fields.map(([name, label, type, required]) => <label key={name} className="block text-sm font-semibold" htmlFor={`offer-${name}`}>{label}
      <input id={`offer-${name}`} name={name} type={type} required={required} maxLength={250} min={type === "number" ? 1 : undefined} max={type === "number" ? (name === "capacity" ? 50 : 100000) : undefined} className="mt-1 block w-full rounded-xl border border-slate-300 p-3 font-normal focus:outline-2 focus:outline-teal-700" />
    </label>)}
    <label className="block text-sm font-semibold" htmlFor="offer-notes">Стан квартири, час пішки, посилання на фото/відео
      <textarea id="offer-notes" name="notes" maxLength={3000} rows={3} className="mt-1 block w-full rounded-xl border border-slate-300 p-3 font-normal" />
    </label>
    <div hidden aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
    <label className="flex gap-2 text-sm"><input type="checkbox" name="consent" required /> <span>Я власник або уповноважений представник. Квартира доступна 10–14 вересня. Погоджуюся на обробку цих даних для розгляду пропозиції та відповіді.</span></label>
    <label className="flex gap-2 text-xs"><input type="checkbox" checked={measurement} onChange={e => { setApartmentAdsConsent(e.target.checked); setMeasurement(e.target.checked); }} /> <span>Необов’язково: дозволяю cookies і передачу технічних даних Google для вимірювання реклами. Дані квартири та контакти не передаються. Відмова не впливає на заявку. <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Політика Google</a></span></label>
    <button disabled={status === "sending"} className="w-full rounded-xl bg-[#9a4726] p-4 font-bold text-white disabled:opacity-60">{status === "sending" ? "Зберігаємо…" : "Надіслати пропозицію"}</button>
    {status === "error" && <p role="alert" className="text-sm text-red-700">Не вдалося підтвердити збереження. Спробуйте ще раз або напишіть на email нижче.</p>}
    <p className="text-xs text-slate-600">Дані отримає команда UMAN2GO для розгляду квартири та зв’язку з вами. Не надсилайте документи чи платіжні реквізити. Для запиту на видалення даних: ofer.delkom@gmail.com.</p>
  </form>;
}
