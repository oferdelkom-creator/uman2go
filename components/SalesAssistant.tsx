"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

type Message = { role: "user" | "assistant"; content: string };
const copy = {
  he: {
    title: "עוזר הנסיעה של UMAN2GO",
    intro: "עוזר AI שיעזור למצוא לינה, הסעות וטיולים שמתאימים לכם.",
    name: "שם מלא",
    contact: "טלפון או אימייל",
    consent:
      "אני מסכים/ה לשמירת פרטי הקשר והשיחה ל־30 יום, כדי שצוות UMAN2GO יוכל להמשיך לטפל בפנייה. הנתונים נמחקים בתוך שעה מתום התקופה. תוכן השיחה מועבר ל־Claude לצורך מתן תשובות.",
    start: "שמירה והתחלת שיחה",
    saved: "פרטי הקשר נשמרו. אפשר להמשיך כאן גם לאחר רענון העמוד באותו דפדפן.",
    greeting:
      "שלום! אני עוזר ה־AI של UMAN2GO. במה אפשר לעזור לקראת הנסיעה לאומן או לאוקראינה?",
    message: "מה תרצו לברר?",
    send: "שליחה",
    waiting: "מכין תשובה…",
    human: "שיחה עם נציג בוואטסאפ",
    reset: "פתיחת שיחה חדשה",
    error: "הפעולה לא הושלמה. אפשר לנסות שוב או לפנות לנציג.",
    note: "הצעות ומידע ראשוני; הזמנה, זמינות ותשלום מאושרים מול הספק. בטיולים מאורגנים התשלום הוא ישירות למארגן.",
  },
  en: {
    title: "Your UMAN2GO travel assistant",
    intro:
      "An AI assistant for accommodation, transport and tours that fit your trip.",
    name: "Full name",
    contact: "Phone or email",
    consent:
      "I agree to storing my contact details and conversation for 30 days so the UMAN2GO team can follow up. Data is deleted within one hour after expiry. Conversation content is sent to Claude to generate replies.",
    start: "Save and start chatting",
    saved:
      "Your contact details are saved. You can resume after refreshing in the same browser.",
    greeting:
      "Hello! I am the UMAN2GO AI assistant. How can I help with your trip to Uman or Ukraine?",
    message: "What would you like to know?",
    send: "Send",
    waiting: "Preparing a reply…",
    human: "Contact a representative on WhatsApp",
    reset: "Start a new conversation",
    error:
      "The action could not be completed. Please retry or contact a representative.",
    note: "Initial information only; booking, availability and payment are confirmed with the provider. Organized-tour payments go directly to the organizer.",
  },
};

function MessageText({ content }: { content: string }) {
  // Only known internal routes and the official WhatsApp link become clickable.
  return content
    .split(
      /(https:\/\/wa\.me\/972523181877|\/(?:en\/|fr\/|uk\/)?(?:plan|hotels|transport|tours|organized-tours|flights|vip)(?:\/[a-zA-Z0-9_-]+)?)/g,
    )
    .map((part, index) =>
      /^(?:https:\/\/wa\.me\/972523181877|\/(?:en\/|fr\/|uk\/)?(?:plan|hotels|transport|tours|organized-tours|flights|vip)(?:\/[a-zA-Z0-9_-]+)?)$/.test(
        part,
      ) ? (
        <a key={index} href={part} className="underline text-brand-terracotta">
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
}

export default function SalesAssistant() {
  const locale = useLocale();
  const t = locale === "he" ? copy.he : copy.en;
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/sales-assistant/session", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error();
        if (alive) {
          setEnabled(data.enabled);
          if (data.session) {
            setStarted(true);
            setMessages(data.session.messages ?? []);
          }
        }
      })
      .catch(() => {
        if (alive) setError(t.error);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [t.error]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/sales-assistant/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          contact: form.get("contact"),
          consent: form.get("consent") === "on",
          locale,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(locale === "he" ? data.error : t.error);
      setStarted(true);
      setMessages([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/sales-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(locale === "he" ? data.error : t.error);
      setMessages((previous) => [
        ...previous,
        { role: "user", content: message },
        { role: "assistant", content: data.reply },
      ]);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error); // Reload persisted history; a failed provider reply may still leave a saved user message.
      try {
        const r = await fetch("/api/sales-assistant/session", {
          cache: "no-store",
        });
        const data = await r.json();
        if (r.ok && data.session) setMessages(data.session.messages ?? []);
      } catch {}
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/sales-assistant/session", {
        method: "DELETE",
      });
      if (!r.ok) throw new Error();
      setStarted(false);
      setMessages([]);
      setDraft("");
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-brand-navy">{t.title}</h1>
      <p className="mt-3 text-foreground/70">{t.intro}</p>
      {loading ? (
        <p className="mt-6" role="status">
          {t.waiting}
        </p>
      ) : !enabled ? (
        <p className="mt-6">{t.error}</p>
      ) : !started ? (
        <form
          onSubmit={start}
          className="mt-6 grid gap-4 rounded-2xl border p-6 bg-white"
        >
          <label className="grid gap-2">
            {t.name}
            <input
              name="fullName"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className="rounded-lg border p-3"
            />
          </label>
          <label className="grid gap-2">
            {t.contact}
            <input
              name="contact"
              required
              minLength={7}
              maxLength={160}
              dir="auto"
              className="rounded-lg border p-3"
            />
          </label>
          <label className="flex gap-3 text-sm leading-6">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-1 shrink-0"
            />
            <span>{t.consent}</span>
          </label>
          <button
            disabled={busy}
            className="rounded-xl bg-brand-terracotta p-3 text-white disabled:opacity-50"
          >
            {busy ? t.waiting : t.start}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border bg-white p-4 sm:p-6">
          <p className="text-sm text-green-800">{t.saved}</p>
          <div
            role="log"
            aria-label={t.title}
            aria-live="polite"
            className="mt-4 max-h-[50vh] overflow-y-auto space-y-3"
          >
            <p className="rounded-xl bg-brand-cream p-3">{t.greeting}</p>
            {messages.map((m, i) => (
              <p
                key={i}
                dir="auto"
                className={`whitespace-pre-wrap break-words rounded-xl p-3 ${m.role === "user" ? "bg-brand-navy text-white" : "bg-brand-cream"}`}
              >
                <MessageText content={m.content} />
              </p>
            ))}
            {busy && <p role="status">{t.waiting}</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="mt-5 flex gap-2">
            <label className="sr-only" htmlFor="sales-message">
              {t.message}
            </label>
            <input
              id="sales-message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              placeholder={t.message}
              disabled={busy}
              className="min-w-0 flex-1 rounded-xl border p-3"
            />
            <button
              disabled={busy || !draft.trim()}
              className="rounded-xl bg-brand-terracotta px-4 text-white disabled:opacity-50"
            >
              {t.send}
            </button>
          </form>
          <button
            onClick={reset}
            disabled={busy}
            className="mt-4 text-sm underline disabled:opacity-50"
          >
            {t.reset}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
      <a
        href="https://wa.me/972523181877"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block font-semibold text-brand-terracotta underline"
      >
        {t.human}
      </a>
      <p className="mt-4 text-xs leading-6 text-foreground/60">{t.note}</p>
    </section>
  );
}
