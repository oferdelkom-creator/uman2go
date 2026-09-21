import { getTranslations } from "next-intl/server";

export default async function TelegramLink({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("common");
  return (
    <a
      href="https://t.me/UMAN2GO_RidesBot"
      target="_blank"
      rel="noopener noreferrer"
      className={compact
        ? "mt-4 block text-sm text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
        : "inline-flex items-center justify-center gap-2 rounded-full bg-[#168AC0] px-7 py-3 text-base font-display font-semibold text-white transition-colors hover:bg-[#116F9B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"}
    >
      {t("telegramTaxi")}
    </a>
  );
}
