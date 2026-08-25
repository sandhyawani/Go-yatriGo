import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

export const NearbyTrips = ({ nearbyTrips }) => {
  const navigate = useNavigate();
  if (!nearbyTrips || nearbyTrips.length === 0) return null;

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-slate-400 tracking-wide">
          Active Travel Groups
        </h3>
        <Link
          to="/social/buddy"
          className="text-[10px] font-bold text-slate-400 hover:text-[#7C3AED] transition-colors"
        >
          See All
        </Link>
      </div>
      <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-2 overflow-x-hidden">
        {nearbyTrips.map((trip) => {
          const maxCap = trip.maxMembers || trip.maxCompanions || 0;
          const currentCount = trip.members?.length || trip.companions?.length || 0;
          const slotsOpen = maxCap > 0 ? Math.max(0, maxCap - currentCount) : null;

          return (
            <div
              key={trip._id}
              className="flex items-start gap-3 group cursor-pointer"
              onClick={() => {
                navigate(`/social/buddy/${trip._id}`);
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold text-sm shrink-0">
                {trip.destination
                  ? trip.destination.substring(0, 2).toUpperCase()
                  : "TR"}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[12px] font-semibold text-slate-800 truncate"
                  title={trip.title}
                >
                  {trip.title}
                </p>
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-300" />{" "}
                  {trip.destination}
                </p>
                {slotsOpen !== null && (
                  <p className="text-[9px] font-semibold text-[#7C3AED] mt-0.5">
                    {slotsOpen} {slotsOpen === 1 ? "slot" : "slots"} open
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 hover:bg-[#7C3AED] hover:text-white px-3 py-1.5 rounded-xl transition-colors shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/social/buddy/${trip._id}`);
                }}
              >
                Join
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NearbyTrips;

