import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Check, ArrowRight, Clock } from "lucide-react";
import axiosInstance from "../../api/axios";

const JourneyInvitationCard = ({ invitation, onAction }) => {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(null); // 'accept' | 'decline'

  const journey = invitation.journeyId || {};
  const organizer = invitation.inviterId || {};

  const handleAccept = async () => {
    setLoadingAction("accept");
    try {
      const res = await axiosInstance.post(
        `/journeys/invitations/${invitation._id}/accept`,
      );
      if (res.data?.success) {
        if (onAction) onAction(invitation._id, "accepted");
        // Open the journey after accepting.
        const redirectUrl =
          res.data.redirectUrl || `/social/journeys/${journey._id}`;
        navigate(redirectUrl);
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
      alert(err.response?.data?.message || "Failed to accept invitation");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDecline = async () => {
    setLoadingAction("decline");
    try {
      const res = await axiosInstance.post(
        `/journeys/invitations/${invitation._id}/reject`,
      );
      if (res.data?.success) {
        if (onAction) onAction(invitation._id, "rejected");
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      alert("Failed to decline invitation");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-brand-100 dark:border-slate-800 shadow-sm hover:border-[#8B5CF6]/40 transition-all space-y-3 relative overflow-hidden group animate-fade-in">
      {/* Top Row: Organizer Inviter + Expiry */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={
              organizer.profilePic ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(organizer.name || "Organizer")}&background=8b5cf6&color=fff&bold=true`
            }
            alt={organizer.name}
            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-brand-100 dark:ring-slate-700"
          />
          <p className="text-xs text-slate-600 dark:text-slate-300 truncate m-0">
            <span className="font-extrabold text-slate-900 dark:text-white mr-1">
              {organizer.name || "A traveler"}
            </span>
            invited you to join
          </p>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          <Clock className="w-2.5 h-2.5 text-[#8B5CF6]" /> 7d left
        </span>
      </div>

      {/* Middle Row: Trip Snapshot Box */}
      <div className="flex items-center gap-3 bg-brand-50/40 dark:bg-slate-800/40 p-2.5 rounded-xl border border-brand-100/80 dark:border-slate-700/60 transition-colors group-hover:bg-brand-50 dark:group-hover:bg-slate-800">
        <img
          src={
            journey.coverImage ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
          }
          alt={journey.title || "Trip"}
          className="w-14 h-14 rounded-lg object-cover shrink-0 shadow-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate m-0 group-hover:text-[#8B5CF6] transition-colors">
              {journey.title || "Secret Trip"}
            </h4>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] uppercase tracking-wider shrink-0">
              {journey.journeyType || "Squad"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="flex items-center gap-1 truncate font-semibold text-slate-700 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />{" "}
              {journey.destination || "Anywhere"}
            </span>
            {journey.startDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-[#8B5CF6]" />
                  {new Date(journey.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleAccept}
          disabled={loadingAction !== null}
          className="flex-1 py-2 px-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-extrabold shadow-sm shadow-[#8B5CF6]/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          {loadingAction === "accept" ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" /> Accept
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDecline}
          disabled={loadingAction !== null}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-extrabold transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center"
        >
          {loadingAction === "decline" ? "..." : "Decline"}
        </button>

        {journey._id && (
          <Link
            to={`/social/journeys/${journey._id}`}
            className="p-2 rounded-xl text-slate-400 hover:text-[#8B5CF6] hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-800"
            title="Preview Hub"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default JourneyInvitationCard;

