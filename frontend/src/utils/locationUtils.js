export const formatLocation = (location) => {
  if (!location) return "";
  const parts = location.split(",").map((p) => p.trim());
  const shortLoc = parts.slice(0, 2).join(", ");
  return shortLoc.length > 30 ? shortLoc.slice(0, 27) + "..." : shortLoc;
};

export const WEATHER_LOCATION_ALIASES = {
  rajgad: "Pune",
  sinhagad: "Pune",
  torna: "Pune",
  purandar: "Pune",
  harishchandragad: "Ahmednagar",
  kalsubai: "Igatpuri",
  visapur: "Lonavala",
  lohagad: "Lonavala",
  pawna: "Lonavala",
  kamshet: "Lonavala",
  devkund: "Kolad",
  alibaug: "Mumbai",
  alibag: "Mumbai",
  diveagar: "Roha",
  moregaon: "Pune",
  jejuri: "Pune",
  lavasa: "Pune",
  chikhaldara: "Amravati",
  trimbakeshwar: "Nashik",
  "prati shirdi": "Pune",
  kaas: "Satara",
  kokan: "Ratnagiri",
  konkan: "Ratnagiri"
};

export const resolveWeatherQuery = (destination) => {
  if (!destination || typeof destination !== "string") return "";
  const cleaned = destination.trim();
  const lower = cleaned.toLowerCase();

  for (const [alias, city] of Object.entries(WEATHER_LOCATION_ALIASES)) {
    if (lower.includes(alias)) {
      return city;
    }
  }

  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    for (const part of parts) {
      const partLower = part.toLowerCase();
      for (const [alias, city] of Object.entries(WEATHER_LOCATION_ALIASES)) {
        if (partLower.includes(alias)) {
          return city;
        }
      }
    }
    return parts[1] || parts[0];
  }

  return parts[0] || "";
};
