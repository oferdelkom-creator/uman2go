const labels: Record<string, Record<string, string>> = {
  he: { wifi: "אינטרנט אלחוטי", mikveh: "מקווה", kosher_kitchen: "מטבח כשר", air_conditioning: "מיזוג אוויר", parking: "חניה" },
  en: { wifi: "Wi-Fi", mikveh: "Mikveh", kosher_kitchen: "Kosher kitchen", air_conditioning: "Air conditioning", parking: "Parking" },
  fr: { wifi: "Wi-Fi", mikveh: "Mikvé", kosher_kitchen: "Cuisine casher", air_conditioning: "Climatisation", parking: "Parking" },
  uk: { wifi: "Wi-Fi", mikveh: "Міква", kosher_kitchen: "Кошерна кухня", air_conditioning: "Кондиціонер", parking: "Паркування" },
};

export function amenityLabel(value: string, locale: string): string {
  return (labels[locale] ?? labels.en)[value] ?? value;
}

export function whatsappNumber(value: string | null | undefined): string {
  let number = (value ?? "").replace(/\D/g, "");
  if (number.startsWith("00")) number = number.slice(2);
  if (/^05\d{8}$/.test(number)) number = "972" + number.slice(1);
  return /^[1-9]\d{7,14}$/.test(number) ? number : "";
}
