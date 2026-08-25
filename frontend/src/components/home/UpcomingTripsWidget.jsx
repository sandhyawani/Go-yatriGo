import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, Plane, Train, Car, Compass, ChevronRight, Clock } from "lucide-react";
import moment from "moment";
import Card from "../common/Card";
import Avatar from "../common/Avatar";

const getTransportIcon = (mode) => {
  const m = String(mode || "").toLowerCase();
  if (m.includes("flight") || m.includes("plane") || m.includes("air")) {
    return <Plane className="w-3.5 h-3.5 text-brand-600" />;
  }
  if (m.includes("train") || m.includes("rail")) {
    return <Train className="w-3.5 h-3.5 text-brand-600" />;
  }
  if (m.includes("car") || m.includes("drive") || m.includes("road")) {
    return <Car className="w-3.5 h-3.5 text-brand-600" />;
  }
  return <Compass className="w-3.5 h-3.5 text-brand-600" />;
};

const getCountdownBadge = (startDate) => {
  if (!startDate) return null;
  const now = moment().startOf("day");
  const start = moment(startDate).startOf("day");
  const diffDays = Math.ceil(start.diff(now, "days"));

  if (diffDays <= 0) {
    return {
      label: "Starts Today",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
  }
  if (diffDays === 1) {
    return {
      label: "Starts Tomorrow",
      style: "bg-amber-50 text-amber-700 border-amber-200"
    };
  }
  if (diffDays < 7) {
    return {
      label: `In ${diffDays} days`,
      style: "bg-brand-50 text-brand-700 border-brand-200"
    };
  }
  if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    return {
      label: `In ${weeks} ${weeks === 1 ? "week" : "weeks"}`,
      style: "bg-indigo-50 text-indigo-700 border-indigo-200"
    };
  }
  return {
    label: moment(startDate).format("MMM DD"),
    style: "bg-slate-50 text-slate-700 border-slate-200"
  };
};

const UpcomingTripsWidget = ({ upcomingTrips = [], title = "Upcoming Trips" }) => {
  const navigate = useNavigate();

  if (!upcomingTrips || upcomingTrips.length === 0) return null;

  return (
    <div className="space-y-3 font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between pl-1">
        <h3 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5 font-sans">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span>{title}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold bg-brand-50 text-brand-700 border border-brand-100">
            {upcomingTrips.length}
          </span>
        </h3>
        <Link
          to="/social/journeys"
          className="text-[10.5px] font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-[0.08em] flex items-center gap-0.5"
        >
          <span>View Hub</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Trips Grid / List */}
      <div className={`grid gap-3.5 ${upcomingTrips.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {upcomingTrips.map((trip) => {
          const tripId = trip._id || trip.id;
          const countdown = getCountdownBadge(trip.startDate);
          const isBuddy = trip.isBuddyTrip || trip.sourceType === "explore";
          const destinationName = (trip.destination || "TBD").split(",")[0].trim();
          const fromName = trip.from ? trip.from.split(",")[0].trim() : "";
          const startDateFormatted = trip.startDate ? moment(trip.startDate).format("MMM DD") : "TBD";
          const endDateFormatted = trip.endDate ? moment(trip.endDate).format("MMM DD, YYYY") : "";
          const dateRangeStr = endDateFormatted ? `${startDateFormatted} – ${endDateFormatted}` : startDateFormatted;

          const durationDays = trip.durationDays || (trip.startDate && trip.endDate
            ? Math.max(1, Math.ceil(moment(trip.endDate).diff(moment(trip.startDate), "days")) + 1)
            : null);

          const membersList = Array.isArray(trip.members) ? trip.members : [];
          const memberCount = Math.max(1, membersList.length || trip.memberCount || 1);

          const handleCardClick = () => {
            if (isBuddy && !trip.sourceId) {
              navigate(`/social/buddy/${tripId}`);
            } else {
              navigate(`/social/journeys/${tripId}`);
            }
          };

          return (
            <Card
              key={tripId}
              variant="default"
              padding="none"
              interactive
              onClick={handleCardClick}
              className="overflow-hidden group border-slate-200/80 hover:border-brand-300 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="p-4 sm:p-4.5 flex flex-col gap-3">
                {/* Card Top Row: Route & Countdown Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100/70">
                      {getTransportIcon(trip.transportation)}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 truncate capitalize">
                      {trip.journeyType || (isBuddy ? "Group Trip" : "Expedition")}
                    </span>
                  </div>

                  {countdown && (
                    <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1 ${countdown.style}`}>
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      {countdown.label}
                    </span>
                  )}
                </div>

                {/* Title and Destination */}
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors font-heading leading-snug truncate" title={trip.title}>
                    {trip.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-1">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">
                      {fromName ? `${fromName} → ` : ""}{destinationName}
                    </span>
                  </div>
                </div>

                {/* Info Bar: Dates, Duration & Members */}
                <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100/90 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                      Departure
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 truncate block">
                      {dateRangeStr}
                    </span>
                  </div>

                  {durationDays && (
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Duration
                      </span>
                      <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-md border border-brand-100 inline-block">
                        {durationDays} {durationDays === 1 ? "Day" : "Days"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Member avatars & CTA */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {membersList.length > 0 ? (
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {membersList.slice(0, 3).map((m, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-200 shrink-0"
                          >
                            <Avatar
                              user={m.user || m}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <span className="text-[10px] font-bold text-slate-500 truncate">
                      {memberCount} {memberCount === 1 ? "Traveler" : "Travelers"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-brand-600 group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all shrink-0">
                    <span>{isBuddy && !trip.sourceId ? "View Group" : "Workspace"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingTripsWidget;
