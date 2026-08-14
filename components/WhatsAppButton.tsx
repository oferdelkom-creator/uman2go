import { WHATSAPP_NUMBER } from "@/lib/constants";

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="צרו קשר בוואטסאפ"
      className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden>
        <path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.5.7 4.8 1.9 6.8L3 29l6.8-2.1c1.9 1 4.1 1.6 6.2 1.6 7 0 12.7-5.6 12.7-12.6C28.7 8.6 23 3 16 3zm0 22.9c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1.2 1.3-3.9-.3-.4a10.6 10.6 0 0 1-1.7-5.7C5.3 9.8 10.1 5 16 5s10.7 4.8 10.7 10.6S21.9 25.9 16 25.9zm5.9-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-2-1.8-2.3-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.8-1-2.4-.3-.7-.5-.6-.7-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z" />
      </svg>
    </a>
  );
}
