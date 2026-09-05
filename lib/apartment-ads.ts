// Public measurement IDs, not credentials. No form values are sent to Google.
export const APARTMENT_ADS_ID = "AW-18348960770";
const destination = "AW-18348960770/bbBvCLyHhe8cEILYu61E";
type AdsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
let initialized = false;
let permitted = false;
export function setApartmentAdsConsent(allowed: boolean) {
  const w = window as AdsWindow;
  if (!initialized && allowed) {
    w.dataLayer ??= [];
    w.gtag ??= function (...args: unknown[]) { w.dataLayer!.push(args); };
    w.gtag("consent", "default", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    w.gtag("js", new Date());
    initialized = true;
  }
  permitted = allowed;
  w.gtag?.("consent", "update", { ad_storage: allowed ? "granted" : "denied", ad_user_data: allowed ? "granted" : "denied", ad_personalization: "denied", analytics_storage: "denied" });
  if (allowed) w.gtag?.("config", APARTMENT_ADS_ID, { send_page_view: false, allow_ad_personalization_signals: false });
}
export function recordApartmentConversion(id: string) {
  if (!permitted) return;
  (window as AdsWindow).gtag?.("event", "conversion", { send_to: destination, transaction_id: id, value: 0, currency: "ILS" });
}
