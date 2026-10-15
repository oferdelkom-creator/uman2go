export const TRANSFER_PRICE_VERSION = "email-2026-10-15-v1";
export const TRANSFER_VEHICLES = [
  { code: "private", he: "רכב פרטי", en: "Private car", capacity: 4, totalCents: 31500, group: "car" },
  { code: "suv", he: "ג׳יפ", en: "SUV", capacity: 4, totalCents: 42000, group: "suv" },
  { code: "minivan", he: "מיניוואן 5–7 נוסעים", en: "Minivan, 5–7 passengers", capacity: 7, totalCents: 52500, group: "minivan" },
  { code: "vip8", he: "ספרינטר VIP, 8 נוסעים", en: "VIP Sprinter, 8 passengers", capacity: 8, totalCents: 78750, group: "sprinter" },
  { code: "vip12", he: "ספרינטר VIP, 12 נוסעים", en: "VIP Sprinter, 12 passengers", capacity: 12, totalCents: 94500, group: "sprinter" },
  { code: "sprinter18", he: "ספרינטר 18 נוסעים", en: "Sprinter, 18 passengers", capacity: 18, totalCents: 94500, group: "sprinter" },
  { code: "sprinter21", he: "ספרינטר 21 נוסעים", en: "Sprinter, 21 passengers", capacity: 21, totalCents: 94500, group: "sprinter" },
  { code: "minibus29", he: "מיניבוס 29 נוסעים", en: "Minibus, 29 passengers", capacity: 29, totalCents: 120750, group: "minibus" },
  ...[34, 38, 39, 42, 45, 57].map(capacity => ({ code: `bus${capacity}`, he: `אוטובוס ${capacity < 57 ? "Super VIP, " : ""}${capacity} נוסעים`, en: `${capacity < 57 ? "Super VIP coach" : "Coach"}, ${capacity} passengers`, capacity, totalCents: 189000, group: "bus" })),
];
export const TRANSFER_STOPS = [
  { code: "none", he: "ללא עצירות נוספות", en: "No extra stops" },
  { code: "medzhybizh-bratslav", he: "מז׳יבוז׳ וברסלב", en: "Medzhybizh and Bratslav" },
  { code: "berdychiv-medzhybizh-bratslav", he: "ברדיצ׳ב, מז׳יבוז׳ וברסלב", en: "Berdychiv, Medzhybizh and Bratslav" },
];
const extraCents: Record<string, [number, number]> = { car: [7350,10500], suv: [9450,14700], minivan: [10500,15750], sprinter: [21000,31500], minibus: [36750,57750], bus: [52500,84000] };
export const usd = (cents: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);
export function transferQuote(vehicleCode: string, stopsCode = "none", passengers?: number) {
  const vehicle = TRANSFER_VEHICLES.find(v => v.code === vehicleCode);
  const stops = TRANSFER_STOPS.find(s => s.code === stopsCode);
  if (!vehicle || !stops) throw new Error("Unknown vehicle or stops");
  if (passengers !== undefined && (!Number.isInteger(passengers) || passengers < 1 || passengers > vehicle.capacity)) throw new Error("Passenger count exceeds vehicle capacity");
  const supplementCents = stopsCode === "none" ? 0 : extraCents[vehicle.group][stopsCode === "medzhybizh-bratslav" ? 0 : 1];
  // The emailed list is customer-final: reverse its included 5%, never add 5% twice.
  const totalCents = vehicle.totalCents + supplementCents;
  const baseCents = Math.round(totalCents * 100 / 105);
  const customerFeeCents = totalCents - baseCents;
  const supplierFeeCents = Math.round(baseCents * 5 / 100);
  const depositCents = customerFeeCents + supplierFeeCents;
  const driverBalanceCents = baseCents - supplierFeeCents;
  return { version: TRANSFER_PRICE_VERSION, currency: "USD" as const, route: "Chisinau to Uman", direction: "chisinau-to-uman", oneWay: true, vehicleCode, vehicleHe: vehicle.he, vehicleEn: vehicle.en, stopsCode, stopsHe: stops.he, stopsEn: stops.en, capacity: vehicle.capacity, supplementCents, baseCents, customerFeeCents, supplierFeeCents, depositCents, driverBalanceCents, totalCents };
}
export function validateTransferDetails(raw: Record<string, unknown>, now = new Date()) {
  const text = (key: string, min: number, max: number) => { const value = raw[key]; if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new Error(`Invalid ${key}`); return value.trim(); };
  const departure_date = text("departure_date",10,10);
  const departure_time = text("departure_time",5,5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departure_date) || new Date(`${departure_date}T12:00:00Z`).toISOString().slice(0,10) !== departure_date || departure_date < new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Chisinau",year:"numeric",month:"2-digit",day:"2-digit"}).format(now) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(departure_time)) throw new Error("Invalid departure date or local time");
  const passengers = Number(raw.passengers);
  const quote = transferQuote(text("vehicle_code",1,30),text("stops_code",1,60),passengers);
  return { quote, departure_date, departure_time, passengers, pickup: text("pickup",3,400), notes: typeof raw.notes === "string" ? raw.notes.trim().slice(0,1500) : "" };
}
export function transferQuoteText(quote: ReturnType<typeof transferQuote>, locale: string) {
  return locale === "he" ? `קישינב → אומן, נסיעה בכיוון אחד. ${quote.vehicleHe}; ${quote.stopsHe}.\nמחיר כולל ללקוח: ${usd(quote.totalCents)} (כולל עמלת לקוח 5%). מקדמה לאתר: ${usd(quote.depositCents)}; יתרה ישירות לנהג: ${usd(quote.driverBalanceCents)}. המחיר הוא לרכב ולא לנוסע. זמינות הרכב והמסלול טעונה אישור ספק; ההזמנה מאושרת רק לאחר אישור ספק ואימות תשלום המקדמה.` : `Chisinau → Uman, one way. ${quote.vehicleEn}; ${quote.stopsEn}.\nCustomer total: ${usd(quote.totalCents)} (includes the 5% customer fee). Platform advance: ${usd(quote.depositCents)}; balance directly to the driver: ${usd(quote.driverBalanceCents)}. Price is per vehicle, not per passenger. Supplier availability and route approval are required; the booking is confirmed only after supplier approval and verified advance payment.`;
}

export function isTransferConfirmation(message:string){return /^(כן|מאשר|מאשרת|אני מאשר|אני מאשרת|מאשר הזמנה|מאשרת הזמנה|yes|i confirm|confirm|confirm booking|oui|так|підтверджую)[.!\s]*$/iu.test(message.trim());}
