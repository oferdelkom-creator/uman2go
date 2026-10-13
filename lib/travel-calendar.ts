const DAY = 86_400_000;
const hebrew = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  timeZone: "UTC", year: "numeric", month: "long", day: "numeric",
});
const civil = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return part("year") + "-" + part("month") + "-" + part("day");
};
const rules = [
  { month: "Tishri", day: 1, days: 2, name: "ראש השנה / Rosh Hashanah", demand: "main Uman pilgrimage peak", leadDays: 7 },
  { month: "Tishri", day: 10, days: 1, name: "יום כיפור / Yom Kippur", demand: "holiday travel constraints; demand unverified", leadDays: 1 },
  { month: "Tishri", day: 15, days: 9, name: "סוכות ושמחת תורה / Sukkot and Simchat Torah (Diaspora)", demand: "potential holiday travel period, not confirmed demand", leadDays: 3 },
  { month: "Kislev", day: 25, days: 8, name: "חנוכה / Hanukkah", demand: "potential organized-tour period, not confirmed demand", leadDays: 2 },
  { month: "Adar", day: 14, days: 2, name: "פורים ושושן פורים / Purim and Shushan Purim", demand: "potential travel period, not confirmed demand", leadDays: 1 },
  { month: "Adar II", day: 14, days: 2, name: "פורים ושושן פורים / Purim and Shushan Purim", demand: "potential travel period, not confirmed demand", leadDays: 1 },
  { month: "Nisan", day: 15, days: 8, name: "פסח / Passover (Diaspora)", demand: "potential holiday travel period, not confirmed demand", leadDays: 3 },
  { month: "Iyar", day: 18, days: 1, name: 'ל״ג בעומר / Lag BaOmer', demand: "potential pilgrimage travel period, not confirmed demand", leadDays: 1 },
  { month: "Sivan", day: 6, days: 2, name: "שבועות / Shavuot (Diaspora)", demand: "potential holiday travel period, not confirmed demand", leadDays: 2 },
  { month: "Av", day: 15, days: 1, name: 'ט״ו באב / Tu BAv', demand: "potential group travel period, not confirmed demand", leadDays: 1 },
];

/** Local calendar arithmetic; no customer data or external calendar request. */
export function travelCalendarContext(now = new Date()) {
  const today = civil(now, "Europe/Kyiv");
  const base = new Date(today + "T12:00:00Z");
  const events = [];
  // Start before today so ongoing holidays remain in context. Cover next 15 months.
  for (let offset = -15; offset <= 460; offset++) {
    const date = new Date(base.getTime() + offset * DAY);
    const parts = hebrew.formatToParts(date);
    const month = parts.find((p) => p.type === "month")!.value;
    const day = Number(parts.find((p) => p.type === "day")!.value);
    for (const rule of rules) {
      if (month !== rule.month || day !== rule.day) continue;
      const end = civil(new Date(date.getTime() + (rule.days - 1) * DAY), "UTC");
      if (end < today) continue;
      events.push({
        name: rule.name,
        hebrewYear: Number(parts.find((p) => p.type === "year")!.value),
        startsAtSunsetOn: civil(new Date(date.getTime() - DAY), "UTC"),
        firstDay: civil(date, "UTC"),
        endsAtNightfallOn: end,
        planningWindowStarts: civil(new Date(date.getTime() - rule.leadDays * DAY), "UTC"),
        demand: rule.demand,
      });
    }
  }
  return {
    currentInstantUTC: now.toISOString(),
    dateInUman: today,
    dateInIsrael: civil(now, "Asia/Jerusalem"),
    calendarConvention: "Uman uses Diaspora holiday lengths. Israel differs for Passover, Shavuot and Simchat Torah. Hebrew dates change at sunset; exact candle-lighting, sunset, Shabbat-end and flight-permitted times require a verified city-specific source. Date boundaries here are not exact times.",
    seasonalPlanning: "Summer and school vacations may affect family travel; vacation dates depend on country. Elul and the days before Rosh Hashanah merit early planning. Other festivals are potential travel periods, not measured Uman occupancy. No live prices, availability, schedules, closures or crowd forecasts are supplied by this calendar.",
    upcomingOrOngoing: events,
    sourceReference: "https://www.hebcal.com/holidays/",
  };
}
