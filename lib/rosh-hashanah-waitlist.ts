export const WAITLIST_CAMPAIGN = 'rosh-hashanah-2027';
export const WAITLIST_CLOSE = '2027-10-01T00:00:00Z';
export const WAITLIST_CITIES = ['tel-aviv', 'new-york', 'london', 'paris'] as const;
export const CITY_LABELS: Record<string, string> = {'tel-aviv':'תל אביב','new-york':'ניו יורק',london:'לונדון',paris:'פריז'};
export function validateWaitlist(input: unknown) {
  if (!input || typeof input !== 'object') return null;
  const body = input as Record<string, unknown>;
  if (body.consent !== true || typeof body.city !== 'string' || !WAITLIST_CITIES.includes(body.city as typeof WAITLIST_CITIES[number])) return null;
  if (typeof body.passengers !== 'number' || !Number.isInteger(body.passengers) || body.passengers < 1 || body.passengers > 500) return null;
  if (body.installments !== null && (typeof body.installments !== 'number' || !Number.isInteger(body.installments) || body.installments < 1 || body.installments > 24)) return null;
  return { departure_city: body.city, passengers: body.passengers, installments: body.installments as number | null };
}
