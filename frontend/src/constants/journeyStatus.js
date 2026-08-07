export const JOURNEY_STATUS = {
  Planning: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    themeColor: "amber",
    label: "Planning Mode",
    description: "Acclimatizing notes, checklists, and group budgets setup"
  },
  Upcoming: {
    color: "bg-sky-50 text-sky-700 border-sky-200",
    themeColor: "sky",
    label: "Confirmed Upcoming",
    description: "Itinerary confirmed. Preparing gear and countdown tracker"
  },
  Ongoing: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    themeColor: "emerald",
    label: "Active Transit",
    description: "Trip active. Safety check-ins, coordination, and SOS online"
  },
  Completed: {
    color: "bg-slate-50 text-slate-600 border-slate-200",
    themeColor: "slate",
    label: "Journey Complete",
    description: "Trip completed. Explore footprint highlights and replay logs"
  },
  Cancelled: {
    color: "bg-rose-50 text-rose-700 border-rose-200",
    themeColor: "rose",
    label: "Trip Cancelled",
    description: "Expedition cancelled. Timelines and notes archived"
  }
};