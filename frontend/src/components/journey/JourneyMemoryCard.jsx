import React, { useState } from "react";
import {
  Sparkles,
  Heart,
  MessageCircle,
  Send,
  Users,
  Calendar,
  MapPin,
  Share2,
  Award,
  Clock,
} from "lucide-react";
import axiosInstance from "../../api/axios";

const JourneyMemoryCard = ({ journey, memory, currentUserId, onUpdated }) => {
  const [commentText, setCommentText] = useState("");
  const [reacting, setReacting] = useState(false);

  if (!journey || journey.status !== "Completed") {
    return (
      <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-amber-500 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Archived Memory Page Inactive
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
          The permanent Journey Memory archive and AI Trip Summary unlock
          automatically once the journey window completes.
        </p>
      </div>
    );
  }

  const handleReact = async (emoji) => {
    setReacting(true);
    try {
      const res = await axiosInstance.post(
        `/journeys/${journey._id}/memories/react`,
        { emoji },
      );
      if (res.data?.success && onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setReacting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/journeys/${journey._id}/memories/comment`,
        {
          text: commentText.trim(),
        },
      );
      if (res.data?.success) {
        setCommentText("");
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const emojis = ["✨", "🔥", "😍", "👏", "✈️", "🌟"];
  const memData = memory || {};
  const commentsList = memData.comments || [];
  const reactionsList = memData.reactions || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* AI Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-1 shadow-2xl">
        <div className="bg-[#7c3aed]/95 rounded-[22px] p-6 sm:p-8 text-white relative z-10 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4 animate-spin-slow" /> AI Journey
            Retrospective
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-200">
            Reliving {journey.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-light italic border-l-4 border-amber-500 pl-4 py-1">
            "
            {journey.aiSummary ||
              memData.aiSummary ||
              `Your collaborative journey to ${journey.destination} brought together incredible travelers sharing unforgettable moments.`}
            "
          </p>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/10 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />{" "}
              {journey.destination}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10">
              <Calendar className="w-3.5 h-3.5 text-[#a893ff]" />{" "}
              {journey.durationDays || 3} Days
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10">
              <Users className="w-3.5 h-3.5 text-emerald-400" />{" "}
              {journey.members?.length || 1} Travelers
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Completed Journey
              Milestone
            </span>
          </div>
        </div>
      </div>

      {/* Highlights & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Highlights Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8B5CF6]" /> Journey Milestones
              Archive
            </h3>

            <div className="space-y-4">
              {(
                memData.highlights || [
                  { title: "Journey Created", createdAt: journey.createdAt },
                  { title: "Journey Started", createdAt: journey.startDate },
                  {
                    title: "Journey Completed Successfully",
                    createdAt: journey.completedAt || new Date(),
                  },
                ]
              ).map((hl, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/60 text-[#8B5CF6] dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {hl.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {hl.createdAt
                      ? new Date(hl.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Reactions & Comments Wall */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <span className="text-base leading-none">✨</span> Relive &
                React ({reactionsList.length})
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {emojis.map((em) => {
                  const count = reactionsList.filter(
                    (r) => r.emoji === em,
                  ).length;
                  return (
                    <button
                      key={em}
                      disabled={reacting}
                      onClick={() => handleReact(em)}
                      className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:scale-110 active:scale-95 transition-all text-sm font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{em}</span>
                      {count > 0 && (
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Guestbook Comments (
                {commentsList.length})
              </h4>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {commentsList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Be the first to drop a congratulatory note!
                  </p>
                ) : (
                  commentsList.map((comm, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{comm.userName || "Traveler"}</span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {comm.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave a memory note..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyMemoryCard;

