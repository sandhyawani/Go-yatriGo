import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Check, ArrowRight, Clock } from "lucide-react";
import axiosInstance from "../../api/axios";

const JourneyInvitationCard = ({ invitation, onAction }) => {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(null);

  const journey = invitation.journeyId || {};
  const organizer = invitation.inviterId || {};

  const handleAccept = async () => {
    setLoadingAction("accept");
    try {
      const res = await axiosInstance.post(
      `/journeys/invitations/${invitation._id}/accept`
      );
      if (res.data?.success) {
        if (onAction) onAction(invitation._id, "accepted");

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
      `/journeys/invitations/${invitation._id}/reject`
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

  const isAccepted = invitation.status === "accepted";
  const isDeclined = invitation.status === "rejected" || invitation.status === "declined";

  const getDaysLeft = () => {
    if (!journey.startDate) return Infinity;
    const diffMs = new Date(journey.startDate) - new Date();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft();
  const isExpired =
  invitation.status === "expired" ||
  daysLeft <= 0 ||
  journey.status === "Completed" ||
  journey.status === "Cancelled";

  const isExpiringSoon = !isExpired && daysLeft <= 2 && daysLeft > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#7C3AED]/40 transition-all space-y-3 relative overflow-hidden group animate-fade-in">
      {}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
          src={
          organizer.profilePic ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(organizer.name || "Organizer")}&background=8b5cf6&color=fff&bold=true`}

          alt={organizer.name}
          className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700" />

          <p className="text-xs text-slate-600 dark:text-slate-300 truncate m-0">
            <span className="font-bold text-slate-900 dark:text-white mr-1">
              {organizer.name || "A traveler"}
            </span>
            invited you to join
          </p>
        </div>
        {isAccepted ?
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30">
            <Check className="w-2.5 h-2.5 stroke-[3]" /> Accepted
          </span> :
        isDeclined ?
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            Declined
          </span> :
        isExpired ?
        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1 shrink-0 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/30">
            <Clock className="w-2.5 h-2.5 text-rose-500" /> Expired
          </span> :
        isExpiringSoon ?
        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/30">
            <Clock className="w-2.5 h-2.5 text-amber-500" /> {daysLeft}d left
          </span> :

        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
            <Clock className="w-2.5 h-2.5 text-slate-400" /> {daysLeft === Infinity ? "No expiry" : daysLeft > 0 ? `${daysLeft}d left` : "Ending soon"}
          </span>}

      </div>

      {}
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 transition-colors group-hover:bg-slate-100/70 dark:group-hover:bg-slate-800">
        <img
        src={
        journey.coverImage ||
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"}

        alt={journey.title || "Journey"}
        className="w-14 h-14 rounded-lg object-cover shrink-0 shadow-xs" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate m-0 group-hover:text-[#7C3AED] transition-colors">
              {journey.title || "Secret Trip"}
            </h4>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 uppercase tracking-wider shrink-0">
              {journey.journeyType || "Travel Group"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="flex items-center gap-1 truncate font-semibold text-slate-700 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-[#FF5A7A] shrink-0" />{" "}
              {journey.destination || "Anywhere"}
            </span>
            {journey.startDate &&
            <>
                <span>•</span>
                <span className="flex items-center gap-1 shrink-0 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  {new Date(journey.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric"
                })}
                </span>
              </>}

          </div>
        </div>
      </div>

      {}
      <div className="flex items-center gap-2 pt-1">
        {isAccepted ?
        <Link
        to={`/social/journeys/${journey._id}`}
        className="flex-1 py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all">

            <span>Open Journey</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link> :
        isDeclined ?
        <div className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs font-semibold text-center select-none border border-slate-200/50 dark:border-slate-700/50">
            Invitation Declined
          </div> :
        isExpired ?
        <div className="flex-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-xs font-semibold text-center select-none border border-slate-200/50 dark:border-slate-700/50">
            Invitation Expired
          </div> :

        <>
            <button
          type="button"
          onClick={handleAccept}
          disabled={loadingAction !== null}
          className="flex-1 py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-semibold shadow-sm shadow-[#7C3AED]/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap">

              {loadingAction === "accept" ?
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :

            <>
                  <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" /> Accept
                </>}

            </button>

            <button
          type="button"
          onClick={handleDecline}
          disabled={loadingAction !== null}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center">

              {loadingAction === "decline" ? "..." : "Decline"}
            </button>
          </>}


        {journey._id && !isAccepted &&
        <Link
        to={`/social/journeys/${journey._id}`}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 flex items-center justify-center border border-slate-200/60 dark:border-slate-800"
        title="Preview Hub">

            <ArrowRight className="w-4 h-4" />
          </Link>}

      </div>
    </div>);

};

export default JourneyInvitationCard;