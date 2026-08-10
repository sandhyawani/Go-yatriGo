import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

export const NearbyTrips = ({ nearbyTrips }) => {
  if (!nearbyTrips || nearbyTrips.length === 0) return null;

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-slate-400 tracking-wide">
          Active Travel Groups
        </h3>
        <Link
          to="/social/buddy"
          className="text-[10px] font-bold text-slate-400 hover:text-[#6C4DF6] transition-colors"
        >
          See All
        </Link>
      </div>
      <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-2 overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden">
        {nearbyTrips.map((trip) => (
          <div
            key={trip._id}
            className="flex items-start gap-3 group cursor-pointer"
            onClick={() => {
              window.location.href = `/social/buddy/${trip._id}`;
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6C4DF6] flex items-center justify-center font-bold text-sm shrink-0">
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
              <p className="text-[9px] font-semibold text-[#6C4DF6] mt-0.5">
                {Math.max(0, (trip.maxMembers || trip.maxCompanions || 5) - (trip.members?.length || trip.companions?.length || 0))}{" "}
                slots open
              </p>
            </div>
            <Link
              to={`/social/buddy/${trip._id}`}
              className="text-[10px] font-bold text-[#6C4DF6] bg-[#6C4DF6]/10 hover:bg-[#6C4DF6] hover:text-white px-3 py-1.5 rounded-xl transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              Join
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyTrips;
