import React from "react";
import { useNavigate } from "react-router-dom";
import { Compass, MapPin, Calendar } from "lucide-react";

export const TripsTab = ({
  userTrips = [],
  joinedTrips = [],
  groupFilter,
  setGroupFilter,
  tripsLoading,
  isOwnProfile,
}) => {
  const navigate = useNavigate();

  const currentTrips =
    groupFilter === "hosted" ? userTrips : joinedTrips;

  const getTripState = (trip) => {
    const now = new Date();

    const rawStatus = String(
      trip.status || trip.tripStatus || ""
    ).toLowerCase();

    // Backend status has priority
    if (
      ["cancelled", "canceled"].includes(rawStatus)
    ) {
      return "cancelled";
    }

    if (
      ["completed", "complete", "finished"].includes(rawStatus)
    ) {
      return "completed";
    }

    if (
      ["active", "ongoing", "started", "in_progress"].includes(
        rawStatus
      )
    ) {
      return "active";
    }

    const startDate = trip.startDate
      ? new Date(trip.startDate)
      : null;

    const endDate = trip.endDate
      ? new Date(trip.endDate)
      : null;

    // If trip has an end date and it has passed
    if (
      endDate &&
      !Number.isNaN(endDate.getTime()) &&
      now >= endDate
    ) {
      return "completed";
    }

    // If trip has started
    if (
      startDate &&
      !Number.isNaN(startDate.getTime()) &&
      now >= startDate
    ) {
      return "active";
    }

    return "upcoming";
  };

  const getTripBadge = (trip) => {
    const state = getTripState(trip);

    if (state === "cancelled") {
      return {
        label: "Cancelled",
        className:
          "bg-red-50 text-red-600 border-red-200",
      };
    }

    if (state === "completed") {
      return {
        label: "Completed",
        className:
          "bg-secondary-100 text-secondary-600 border-border",
      };
    }

    if (state === "active") {
      return {
        label: "In Progress",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }

    // Upcoming
    const maxCompanions = Number(trip.maxCompanions);
    const membersList = trip.companions || trip.members || [];
    const companionCount = Array.isArray(membersList)
      ? membersList.length
      : 0;

    // Do not show "0 Slots Left" when the backend
    // hasn't supplied a valid capacity.
    if (
      !Number.isFinite(maxCompanions) ||
      maxCompanions <= 0
    ) {
      return {
        label: "Upcoming",
        className:
          "bg-primary-50 text-primary-600 border-primary-200",
      };
    }

    const slots = Math.max(
      0,
      maxCompanions - companionCount
    );

    if (slots === 0) {
      return {
        label: "Full",
        className:
          "bg-amber-50 text-amber-600 border-amber-200",
      };
    }

    return {
      label: `${slots} ${
        slots === 1 ? "Slot" : "Slots"
      } Left`,
      className:
        "bg-emerald-50 text-success border-emerald-200",
    };
  };

  if (tripsLoading && currentTrips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2.5 pb-1 border-b border-border">
          <div className="w-28 h-8 bg-secondary-100 animate-pulse rounded-xl" />
          <div className="w-28 h-8 bg-secondary-100 animate-pulse rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-secondary-100 animate-pulse rounded-3xl border border-border"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 pb-1 border-b border-border select-none">
        <button
          onClick={() => setGroupFilter("hosted")}
          className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-200 ${
            groupFilter === "hosted"
              ? "bg-primary-600 text-white shadow-soft"
              : "bg-surface text-secondary-600 border border-border hover:bg-secondary-50"
          }`}
        >
          Hosted Trips ({userTrips?.length || 0})
        </button>

        <button
          onClick={() => setGroupFilter("joined")}
          className={`flex-1 sm:flex-initial text-center px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-200 ${
            groupFilter === "joined"
              ? "bg-primary-600 text-white shadow-soft"
              : "bg-surface text-secondary-600 border border-border hover:bg-secondary-50"
          }`}
        >
          Joined Trips ({joinedTrips?.length || 0})
        </button>
      </div>

      {currentTrips.length === 0 ? (
        <div className="bg-surface/50 border border-border rounded-3xl p-10 sm:p-14 text-center select-none shadow-sm">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-sm border border-border">
            <div className="absolute inset-0 bg-primary-600/5 rounded-full blur-xl animate-pulse" />

            <Compass className="w-8 h-8 text-primary-600 relative z-10" />
          </div>

          <h3 className="text-base font-bold text-dark mb-1">
            {isOwnProfile && groupFilter === "joined"
              ? "You haven't joined any travel trips yet."
              : groupFilter === "hosted"
              ? "No Trips Hosted"
              : "No Trips Joined"}
          </h3>

          <p className="text-[13px] text-muted font-medium max-w-sm mx-auto mb-4">
            {isOwnProfile && groupFilter === "joined"
              ? "Explore active travel trips and join other travelers on their journeys!"
              : groupFilter === "hosted"
              ? "This traveler has not hosted any short-term trips yet."
              : "This traveler has not joined any short-term trips yet."}
          </p>

          {isOwnProfile && (
            <button
              onClick={() => navigate("/social/buddy")}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-6 py-2.5 font-bold text-sm transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Find Travel Groups
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTrips.map((trip) => {
            const tripState = getTripState(trip);
            const badge = getTripBadge(trip);

            const dateFormatted = trip.startDate
              ? new Date(trip.startDate).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                  }
                )
              : "TBD";

            return (
              <div
                key={trip._id}
                onClick={() =>
                  navigate(`/social/buddy/${trip._id}`)
                }
                className="bg-surface border border-border p-5 rounded-3xl hover:shadow-md transition-all duration-300 cursor-pointer space-y-3 shadow-soft hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Category + Lifecycle */}
                <div className="flex justify-between items-center select-none gap-2">
                  <span className="bg-primary-50 text-primary-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-primary-200 truncate">
                    {trip.category || "Trip"}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full border whitespace-nowrap ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Title */}
                <h4
                  className="text-sm font-bold text-dark truncate leading-tight mt-1"
                  title={trip.title}
                >
                  {trip.title}
                </h4>

                {/* Location + Date */}
                <div className="flex justify-between items-center text-xs text-muted font-medium select-none border-t border-border pt-3 mt-1">
                  <span className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    <MapPin className="w-4 h-4 text-danger shrink-0" />

                    <span className="truncate">
                      {trip.destination}
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Calendar className="w-4 h-4 text-muted" />

                    {dateFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TripsTab;