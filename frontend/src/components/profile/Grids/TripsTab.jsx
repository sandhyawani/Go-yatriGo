import React from "react";
import { useNavigate } from "react-router-dom";
import { Compass, MapPin, Calendar } from "lucide-react";

export const TripsTab = ({
  userTrips,
  joinedTrips,
  groupFilter,
  setGroupFilter,
  tripsLoading,
}) => {
  const navigate = useNavigate();
  const currentTrips = groupFilter === "hosted" ? userTrips : joinedTrips;

  if (tripsLoading && currentTrips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2.5 pb-1 border-b border-slate-100">
          <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-xl" />
          <div className="w-24 h-8 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl border border-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub tabs filters */}
      <div className="flex gap-2.5 pb-1 border-b border-slate-100">
        <button
          onClick={() => setGroupFilter("hosted")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
            groupFilter === "hosted"
              ? "bg-[#6C4DF6] text-white shadow-sm shadow-[#6C4DF6]/20"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Hosted Squads
        </button>
        <button
          onClick={() => setGroupFilter("joined")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
            groupFilter === "joined"
              ? "bg-[#6C4DF6] text-white shadow-sm shadow-[#6C4DF6]/20"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Joined Squads
        </button>
      </div>

      {currentTrips.length === 0 ? (
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl animate-pulse" />
            <Compass className="w-10 h-10 text-slate-300 relative z-10" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {groupFilter === "hosted" ? "No Squads Hosted" : "No Squads Joined"}
          </h3>
          <p className="text-[13px] text-slate-500 font-medium">
            This traveler has not {groupFilter === "hosted" ? "hosted" : "joined"} any short-term squad trips yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentTrips.map((trip) => {
            const dateFormatted = new Date(trip.startDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            const slots = Math.max(
              0,
              trip.maxCompanions - (trip.companions?.length || 0)
            );
            return (
              <div
                key={trip._id}
                onClick={() => navigate(`/social/buddy/${trip._id}`)}
                className="bg-white border border-slate-100/80 p-5 rounded-3xl hover:shadow-md transition-all duration-300 cursor-pointer space-y-3 shadow-sm hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center select-none">
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {trip.category}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full">
                    {slots} Slots Left
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate leading-tight mt-1">
                  {trip.title}
                </h4>
                <div className="flex justify-between items-center text-[12px] text-slate-500 font-medium select-none border-t border-slate-50 pt-3 mt-1">
                  <span className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />{" "}
                    <span className="truncate">{trip.destination}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Calendar className="w-4 h-4 text-purple-400" /> {dateFormatted}
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
