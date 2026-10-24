"use client";

import { PrivacyNotice } from "@/components/PrivacyNotice";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

type Message = { role: "user" | "assistant"; content: string };
const copy = {
  he: {
    title: "עוזר הנסיעה של UMAN2GO",
    intro: "עוזר AI שיעזור למצוא לינה, הסעות וטיולים שמתאימים לכם.",
    name: "שם מלא",
    meet: "שלום, נעים להכיר! איך קוראים לך?",
    next: "נעים להכיר, נמשיך",
    contactIntro:
      "כדי שנוכל לחזור אליך אם השיחה תתנתק, מה הטלפון או המייל שלך?",
    editName: "שינוי השם",
    finish: "סיום שיחה ושליחת סיכום לצוות",
    automatic:
      "לאחר 5 דקות ללא הודעה חדשה, השיחה תסתיים וסיכום יישלח אוטומטית לצוות. אפשר גם לסיים עכשיו.",
    retryFinish: "ניסיון נוסף לשליחת הסיכום",
    finished: "תודה! השיחה הסתיימה והסיכום נשלח לצוות UMAN2GO להמשך טיפול.",
    contact: "טלפון או אימייל",
    consent:
      "אני מסכים/ה לשמירת פרטי הקשר והשיחה במערכת UMAN2GO לצורך מעקב וטיפול בפנייה, עד לבקשת מחיקה דרך הנציג, ולשליחת סיכום לצוות במייל. הגישה לשיחה בדפדפן פגה לאחר 30 יום; הפנייה נשמרת לצוות להמשך טיפול. תוכן השיחה מועבר ל־Claude לצורך תשובות וסיכום. בהכנת מונית מיידית, יעד ומספר נוסעים מועברים למיני־אפ בטלגרם לאחר פתיחת הקישור; הבקשה תישלח לנהגים רק באישורכם שם.",
    start: "שמירה והתחלת שיחה",
    saved: "פרטי הקשר נשמרו. אפשר להמשיך כאן גם לאחר רענון העמוד באותו דפדפן.",
    greeting:
      "נעים להכיר! במה אפשר לעזור לקראת הנסיעה לאומן או לאוקראינה — לינה, הסעה, טיול או הצטרפות כספק שירות?",
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
    meet: "Hello, nice to meet you! What is your name?",
    next: "Nice to meet you — continue",
    contactIntro:
      "What is your phone number or email so our team can follow up if we get disconnected?",
    editName: "Change name",
    finish: "Finish and send a summary to the team",
    automatic:
      "After 5 minutes without a new message, this conversation ends and a summary is emailed to the team automatically. You can also finish now.",
    retryFinish: "Retry sending the summary",
    finished:
      "Thank you! Your conversation has ended and a summary has been sent to the UMAN2GO team for follow-up.",
    contact: "Phone or email",
    consent:
      "I agree to storing my contact details and conversation in UMAN2GO for enquiry follow-up until I request deletion through the team, and emailing a summary to the team. Browser access expires after 30 days; the enquiry remains available to the team for follow-up. Conversation content is sent to Claude for replies and summaries. For an immediate taxi draft, destination and passenger count are transferred to the Telegram mini app when you open its link; submitting to drivers requires your confirmation there.",
    start: "Save and start chatting",
    saved:
      "Your contact details are saved. You can resume after refreshing in the same browser.",
    greeting:
      "Nice to meet you! What can I help with for your trip to Uman or Ukraine — accommodation, transport, a tour or joining as a service provider?",
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
  const locale = useLocale();
  // Only known internal routes and the official WhatsApp link become clickable.
  return content
    .split(
      /(https:\/\/t\.me\/UMAN2GO_RidesBot\?start=taxi_[a-f0-9]{48}|https:\/\/wa\.me\/972523181877|\/(?:en\/|fr\/|uk\/)?(?:join|plan|hotels|transport|tours|organized-tours|flights|vip|rosh-hashanah)(?:\/[a-zA-Z0-9_-]+)?)/g,
    )
    .map((part, index) =>
      /^(?:https:\/\/t\.me\/UMAN2GO_RidesBot\?start=taxi_[a-f0-9]{48}|https:\/\/wa\.me\/972523181877|\/(?:en\/|fr\/|uk\/)?(?:join|plan|hotels|transport|tours|organized-tours|flights|vip|rosh-hashanah)(?:\/[a-zA-Z0-9_-]+)?)$/.test(
        part,
      ) ? (
        <a
          key={index}
          href={part}
          className="underline text-brand-terracotta"
          target={part.startsWith("https://t.me/") ? "_blank" : undefined}
          rel={
            part.startsWith("https://t.me/") ? "noopener noreferrer" : undefined
          }
        >
          {part.startsWith("https://t.me/")
            ? locale === "he"
              ? "פתיחת בקשת המונית בטלגרם"
              : "Open taxi request in Telegram"
            : part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
}

export default function SalesAssistant({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const locale = useLocale();
  const t = locale === "he" ? copy.he : copy.en;
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<"name" | "contact">("name");
  const [fullName, setFullName] = useState("");
  const [completed, setCompleted] = useState(false);
  const [emailAccepted, setEmailAccepted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);
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
            setFullName(data.session.fullName ?? "");
            setCompleted(Boolean(data.session.completed));
            setEmailAccepted(Boolean(data.session.emailAccepted));
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
    if (!started || busy || emailAccepted) return;
    let alive = true;
    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/sales-assistant/session", {
          cache: "no-store",
        });
        const data = await response.json();
        if (alive && response.ok && data.session?.completed) {
          setCompleted(true);
          setEmailAccepted(Boolean(data.session.emailAccepted));
        }
      } catch {
        /* Keep the saved conversation available after transient network failures. */
      }
    }, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [started, busy, emailAccepted]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
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
          fullName,
          contact: form.get("contact"),
          consent: form.get("consent") === "on",
          retentionConsentVersion: "followup-v1",
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
    if (!message || busy || completed) return;
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
  async function finish() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/sales-assistant/finish", { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(locale === "he" ? data.error : t.error);
      setCompleted(true);
      setEmailAccepted(Boolean(data.emailAccepted));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      const r = await fetch("/api/sales-assistant/session", {
        cache: "no-store",
      }).catch(() => null);
      if (r?.ok) {
        const data = await r.json();
        setCompleted(Boolean(data.session?.completed));
        setEmailAccepted(Boolean(data.session?.emailAccepted));
      }
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
      setStep("name");
      setFullName("");
      setCompleted(false);
      setEmailAccepted(false);
      setMessages([]);
      setDraft("");
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="travel-assistant"
      className={
        embedded
          ? "mx-auto mt-6 max-w-2xl rounded-3xl bg-white p-5 text-start text-foreground shadow-xl sm:p-6"
          : "mx-auto max-w-2xl px-4 py-10"
      }
    >
      {embedded ? (
        <h2 className="text-2xl font-bold text-brand-navy">{t.title}</h2>
      ) : (
        <h1 className="text-3xl font-bold text-brand-navy">{t.title}</h1>
      )}
      <p className="mt-3 text-foreground/70">{t.intro}</p>
      <div className="mt-4"><PrivacyNotice /></div>
      {loading ? (
        <p className="mt-6" role="status">
          {t.waiting}
        </p>
      ) : !enabled ? (
        <p className="mt-6">{t.error}</p>
      ) : !started && step === "name" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (fullName.trim().length >= 2) {
              setFullName(fullName.trim());
              setStep("contact");
              setError("");
            }
          }}
          className="mt-5 grid gap-4"
        >
          <p className="rounded-xl bg-brand-cream p-3">{t.meet}</p>
          <label className="grid gap-2">
            {t.name}
            <input
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className="rounded-lg border p-3"
            />
          </label>
          <button className="rounded-xl bg-brand-terracotta p-3 text-white">
            {t.next}
          </button>
        </form>
      ) : !started ? (
        <form
          onSubmit={start}
          className="mt-6 grid gap-4 rounded-2xl border p-6 bg-white"
        >
          <p className="rounded-xl bg-brand-cream p-3">
            {fullName}, {t.contactIntro}
          </p>
          <button
            type="button"
            onClick={() => setStep("name")}
            disabled={busy}
            className="justify-self-start text-sm underline"
          >
            {t.editName}
          </button>
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
          <p className="text-xs leading-6 text-foreground/70">{t.automatic}</p>
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
            ref={log}
            role="log"
            aria-label={t.title}
            aria-live="polite"
            className="mt-4 max-h-[50vh] overflow-y-auto space-y-3"
          >
            <p className="rounded-xl bg-brand-cream p-3">
              {fullName}, {t.greeting}
            </p>
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
          </div>
          {completed && emailAccepted ? (
            <p
              role="status"
              className="mt-5 rounded-xl bg-green-50 p-3 text-green-900"
            >
              {t.finished}
            </p>
          ) : null}
          {!completed ? (
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
          ) : null}
          {!completed ? (
            <p className="mt-4 text-xs leading-6 text-foreground/70">
              {t.automatic}
            </p>
          ) : null}
          {!emailAccepted ? (
            <button
              onClick={finish}
              disabled={busy || Boolean(draft.trim())}
              className="mt-4 block rounded-xl border border-brand-terracotta p-3 text-sm font-semibold text-brand-terracotta disabled:opacity-50"
            >
              {completed ? t.retryFinish : t.finish}
            </button>
          ) : null}
          <button
            onClick={reset}
            disabled={busy || !completed}
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

