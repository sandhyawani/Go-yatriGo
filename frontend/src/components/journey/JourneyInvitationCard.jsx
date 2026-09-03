import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Check, ArrowRight, Clock } from "lucide-react";
import axiosInstance from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { getEligibilityErrorMessage } from "../../utils/journeyLifecycle";

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
      showToast.error(getEligibilityErrorMessage(err, "Failed to accept invitation"));
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
      showToast.error(getEligibilityErrorMessage(err, "Failed to decline invitation"));
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
  const isOngoing = journey.status === "Ongoing";
  const isExpired =
    invitation.status === "expired" ||
    daysLeft <= 0 ||
    isOngoing ||
    journey.status === "Completed" ||
    journey.status === "Cancelled";

  const isExpiringSoon = !isExpired && daysLeft <= 2 && daysLeft > 0;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-brand/40 transition-all space-y-3 relative overflow-hidden group animate-fade-in">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        {(() => {
          const organizerId =
            organizer._id ||
            organizer.id ||
            (typeof organizer === "string" ? organizer : null);
          return (
            <div
              onClick={() => {
                if (organizerId) navigate(`/profile/${organizerId}`);
              }}
              className={`flex items-center gap-2 min-w-0 ${
                organizerId ? "cursor-pointer group/org transition-opacity hover:opacity-90" : ""
              }`}
            >
              <img
                src={
                  organizer.profilePic ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    organizer.name || "Host"
                  )}&background=0284c7&color=fff&bold=true`
                }
                alt={organizer.name}
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200 group-hover/org:ring-brand"
              />

              <p className="text-xs text-text-secondary truncate m-0">
                <span className="font-bold text-text-primary mr-1 group-hover/org:text-brand transition-colors">
                  {organizer.name || "A traveler"}
                </span>
                invited you to join
              </p>
            </div>
          );
        })()}
        {isAccepted ? (
          <span className="text-[10px] font-bold text-sky-800 flex items-center gap-1 shrink-0 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80">
            <Check className="w-2.5 h-2.5 stroke-[3] text-sky-600" /> Accepted
          </span>
        ) : isDeclined ? (
          <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/80">
            Declined
          </span>
        ) : isOngoing ? (
          <span className="text-[10px] font-bold text-cyan-900 flex items-center gap-1 shrink-0 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/80">
            <Clock className="w-2.5 h-2.5 text-cyan-600" /> In Progress
          </span>
        ) : isExpired ? (
          <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1 shrink-0 bg-rose-50/80 px-2 py-0.5 rounded-full border border-rose-200/80">
            <Clock className="w-2.5 h-2.5 text-rose-500" /> Expired
          </span>
        ) : isExpiringSoon ? (
          <span className="text-[10px] font-bold text-sky-800 flex items-center gap-1 shrink-0 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80">
            <Clock className="w-2.5 h-2.5 text-sky-600" /> {daysLeft}d left
          </span>
        ) : (
          <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/70">
            <Clock className="w-2.5 h-2.5 text-text-muted" /> {daysLeft === Infinity ? "No expiry" : daysLeft > 0 ? `${daysLeft}d left` : "Ending soon"}
          </span>
        )}
      </div>

      {/* Trip Info Preview */}
      <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 transition-colors group-hover:bg-background/70">
        <img
          src={
            journey.coverImage ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
          }
          alt={journey.title || "Journey"}
          className="w-14 h-14 rounded-lg object-cover shrink-0 shadow-xs"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-extrabold text-text-primary truncate m-0 group-hover:text-brand transition-colors">
              {journey.title || "Secret Trip"}
            </h4>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-background text-text-primary border border-slate-200/60 uppercase tracking-wider shrink-0">
              {journey.journeyType || "Travel Group"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted truncate">
            <span className="flex items-center gap-1 truncate font-semibold text-text-primary">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />{" "}
              {journey.destination || "Anywhere"}
            </span>
            {journey.startDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 shrink-0 text-text-muted">
                  <Calendar className="w-3 h-3 text-text-muted" />
                  {new Date(journey.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {isAccepted ? (
          <Link
            to={`/social/journeys/${journey._id}`}
            className="flex-1 py-2 px-3 rounded-xl bg-brand hover:bg-brand text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Open Journey</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : isDeclined ? (
          <div className="flex-1 py-2 px-3 rounded-xl bg-slate-50 text-text-muted text-xs font-semibold text-center select-none border border-slate-200/50">
            Invitation Declined
          </div>
        ) : isOngoing ? (
          <div className="flex-1 py-2 px-3 rounded-xl bg-slate-50 text-text-muted text-xs font-semibold text-center select-none border border-slate-200/50">
            Journey in Progress (Roster Locked)
          </div>
        ) : isExpired ? (
          <div className="flex-1 py-2 px-3 rounded-xl bg-slate-50 text-text-muted text-xs font-semibold text-center select-none border border-slate-200/50">
            Invitation Expired
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAccept}
              disabled={loadingAction !== null}
              className="flex-1 py-2 px-3 rounded-xl bg-brand hover:bg-brand text-white text-xs font-semibold shadow-sm shadow-brand/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
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
              className="flex-1 py-2 px-3 rounded-xl bg-background hover text-text-primary border border-slate-200/60 text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center"
            >
              {loadingAction === "decline" ? "..." : "Decline"}
            </button>
          </>
        )}

        {journey._id && !isAccepted && (
          <Link
            to={`/social/journeys/${journey._id}`}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-background transition-colors shrink-0 flex items-center justify-center border border-slate-200/60"
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