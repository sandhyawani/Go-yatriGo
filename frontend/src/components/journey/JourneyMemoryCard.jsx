import React, { useState, useEffect, useCallback } from "react";
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
Lock,
Loader2,
Trophy,
Compass,
Flag,
CheckCircle2,
MessageSquare } from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../api/axios";

const JourneyMemoryCard = ({ journey, currentUserId, onUpdated }) => {
  const [commentText, setCommentText] = useState("");
  const [reacting, setReacting] = useState(false);
  const [memData, setMemData] = useState(null);
  const [unlocked, setUnlocked] = useState(null);
  const [lockedMessage, setLockedMessage] = useState("");
  const [lockedEndDate, setLockedEndDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMemory = useCallback(async () => {
    if (!journey?._id) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/journeys/${journey._id}/memories`);
      if (res.data?.success) {
        setUnlocked(res.data.unlocked);
        if (res.data.unlocked) {
          setMemData(res.data.memory || {});
        } else {
          setLockedMessage(res.data.message || "Your Scrapbook will unlock after the journey");
          setLockedEndDate(res.data.endDate || null);
        }
      }
    } catch (err) {
      console.error("Error fetching memories:", err);
      setUnlocked(false);
      setLockedMessage("Could not load scrapbook data.");
    } finally {
      setLoading(false);
    }
  }, [journey?._id]);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  const refreshAll = async () => {
    await fetchMemory();
    if (onUpdated) onUpdated(true);
  };


  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pb-12 max-w-5xl mx-auto">
        {}
        <div className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800/80 relative overflow-hidden">
          <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"
          style={{ animationDuration: '1.5s' }} />

          <div className="p-8 space-y-4">
            <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="h-8 w-64 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="h-16 w-full bg-slate-300 dark:bg-slate-700 rounded-lg" />
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 space-y-6 shadow-soft">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="space-y-4">
                {[1, 2, 3].map((n) =>
                <div key={n} className="h-16 w-full bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 space-y-6 shadow-soft">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="space-y-3">
                {[1, 2].map((n) =>
                <div key={n} className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>);

  }


  if (!unlocked) {
    const isCancelled = journey?.status === "Cancelled";
    const endDateFormatted = lockedEndDate ?
    new Date(lockedEndDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) :
    null;

    return (
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-2xl mx-auto my-8 px-4">

        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center shadow-card hover:shadow-hover transition-all duration-300 group">
          {}
          <div className="absolute -right-24 -top-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary-500/20 transition-all duration-500" />
          <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
          
          <div className="relative z-10 space-y-6">
            {}
            <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto border shadow-soft ${
            isCancelled ?
            "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400" :
            "bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/20 dark:to-primary-900/30 border-primary-200/60 dark:border-primary-800/60 text-primary-500"
            }`}>

              {isCancelled ?
              <Lock className="w-10 h-10" /> :

              <div className="relative">
                  <Lock className="w-9 h-9" />
                  <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full" />

                </div>}

            </motion.div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-heading">
                {isCancelled ?
                "Scrapbook Archived" :
                "Your Journey Scrapbook"}
              </h3>
              
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-body">
                {lockedMessage || (
                isCancelled ?
                "This journey was cancelled, so the scrapbook archive is not active." :
                "Once this trip is completed, your photos, memories, and journey highlights will come together in a beautiful retrospective page.")}
              </p>
            </div>

            {!isCancelled && endDateFormatted ?
            <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50/80 dark:bg-primary-950/40 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/60 shadow-xs">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Unlocks on {endDateFormatted}</span>
                </div>
              </div> :
            !isCancelled ?
            <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Unlocking soon after completion</span>
                </div>
              </div> :
            null}
          </div>
        </div>
      </motion.div>);

  }


  const handleReact = async (emoji) => {
    setReacting(true);
    try {
      const res = await axiosInstance.post(
      `/journeys/${journey._id}/memories/react`,
      { emoji }
      );
      if (res.data?.success) await refreshAll();
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
        text: commentText.trim()
      }
      );
      if (res.data?.success) {
        setCommentText("");
        await refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const emojis = ["✨", "🔥", "😍", "👏", "✈️", "🌟"];
  const commentsList = memData?.comments || [];
  const reactionsList = memData?.reactions || [];

  const milestonesList = memData?.highlights || [
  { title: "Journey Created", createdAt: journey.createdAt },
  { title: "Journey Started", createdAt: journey.startDate },
  {
    title: "Journey Completed Successfully",
    createdAt: journey.completedAt || new Date()
  }];



  const getMilestoneConfig = (title, idx, total) => {
    const lowerTitle = title.toLowerCase();
    if (idx === 0 || lowerTitle.includes("created")) {
      return {
        icon: Flag,
        bgColor: "bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400",
        borderColor: "border-violet-200 dark:border-violet-800"
      };
    }
    if (idx === total - 1 || lowerTitle.includes("completed") || lowerTitle.includes("success")) {
      return {
        icon: Trophy,
        bgColor: "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-800"
      };
    }
    if (lowerTitle.includes("started") || lowerTitle.includes("active")) {
      return {
        icon: Compass,
        bgColor: "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400",
        borderColor: "border-sky-200 dark:border-sky-800"
      };
    }
    return {
      icon: CheckCircle2,
      bgColor: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    };
  };


  const getAvatarGradient = (name) => {
    const len = name ? name.length : 0;
    const gradients = [
    "from-violet-500 to-fuchsia-500",
    "from-sky-500 to-indigo-500",
    "from-rose-500 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-yellow-500"];

    return gradients[len % gradients.length];
  };

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
    className="space-y-6 pb-12 max-w-5xl mx-auto px-1">

      {}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-5 sm:p-6 shadow-soft hover:shadow-hover transition-all duration-300 relative overflow-hidden">
        {}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-[10px] font-extrabold uppercase text-primary-600 dark:text-primary-400 border border-primary-100/50 dark:border-primary-800/40 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary-500 dark:text-primary-400 shrink-0" /> 
            <span>AI Journey Retrospective</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-heading mb-3">
            Reliving {journey.title}
          </h2>
          
          <div className="relative border-l-4 border-primary-500/70 pl-4 py-1.5 my-3 bg-slate-50/60 dark:bg-slate-800/30 rounded-r-xl">
            <span className="absolute -top-2 left-1 text-2xl text-primary-500/20 font-serif leading-none">“</span>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed font-body italic">
              {memData?.aiSummary ||
              journey.aiSummary ||
              `Your collaborative journey to ${journey.destination} brought together incredible travelers sharing unforgettable moments.`}
            </p>
            <span className="absolute -bottom-6 right-2 text-2xl text-primary-500/20 font-serif leading-none">”</span>
          </div>

          {}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{journey.destination}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40">
              <Calendar className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>{journey.durationDays || memData?.durationDays || 3} Days</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40">
              <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{memData?.participantsCount || journey.members?.length || 1} Travelers</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40">
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Completed Milestone</span>
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/70 dark:border-slate-800 shadow-soft space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 font-heading">
                <Clock className="w-5.5 h-5.5 text-primary-500" />
                <span>Journey Milestones Timeline</span>
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-[10px] font-extrabold uppercase text-primary-600 dark:text-primary-400 border border-primary-100/60 dark:border-primary-900/60">
                Log Archive
              </span>
            </div>

            {}
            <div className="relative pl-6 sm:pl-8 space-y-6">
              {}
              <div className="absolute left-[29px] sm:left-[37px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-slate-200 dark:border-slate-800" />

              {milestonesList.map((hl, idx) => {
                const config = getMilestoneConfig(hl.title, idx, milestonesList.length);
                const IconComponent = config.icon;

                return (
                  <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex gap-4 items-start">

                    {}
                    <div className={`absolute -left-6 sm:-left-8 w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-soft z-10 shrink-0 ${config.bgColor} ${config.borderColor}`}>
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 shadow-[0_2px_12px_rgba(30,41,59,0.01)] hover:shadow-soft transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ml-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-body">
                          {hl.title}
                        </span>
                        {idx === milestonesList.length - 1 &&
                        <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Verified Milestone
                          </span>}

                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-center">
                        {hl.createdAt ? new Date(hl.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        }) : ""}
                      </span>
                    </div>
                  </motion.div>);

              })}
            </div>
          </div>
        </div>

        {}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-soft flex flex-col justify-between space-y-6">
            
            {}
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 font-heading">
                <span className="text-base leading-none">✨</span>
                <span>Relive & React ({reactionsList.length})</span>
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {emojis.map((em) => {
                  const count = reactionsList.filter((r) => r.emoji === em).length;
                  return (
                    <motion.button
                    key={em}
                    disabled={reacting}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleReact(em)}
                    className={`px-3 py-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold flex items-center gap-2 shadow-xs transition-all border ${
                    count > 0 ?
                    "bg-primary-50/50 dark:bg-primary-950/20 border-primary-200/50 dark:border-primary-800 text-primary-600 dark:text-primary-400" :
                    "bg-slate-100/60 dark:bg-slate-800/60 border-slate-200/40 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                    }`}>

                      <span>{em}</span>
                      {count > 0 &&
                      <span className="text-xs font-extrabold px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900 border border-primary-100 dark:border-primary-800">
                          {count}
                        </span>}

                    </motion.button>);

                })}
              </div>
            </div>

            {}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary-500" /> 
                <span>Guestbook Comments ({commentsList.length})</span>
              </h4>

              {}
              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1 scrollbar-none">
                <AnimatePresence initial={false}>
                  {commentsList.length === 0 ?
                  <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                      <p className="text-xs text-slate-400 font-medium">
                        Be the first to drop a congratulatory note!
                      </p>
                    </div> :

                  commentsList.map((comm, cIdx) =>
                  <motion.div
                  key={cIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 text-xs space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {}
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarGradient(comm.userName)} text-white flex items-center justify-center font-black text-[10px] uppercase shadow-xs`}>
                              {comm.userName ? comm.userName.substring(0, 2) : "TR"}
                            </div>
                            <span className="font-extrabold text-slate-700 dark:text-slate-300">
                              {comm.userName || "Traveler"}
                            </span>
                          </div>
                          
                          <span className="text-[9px] text-slate-400 font-bold bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-body pl-1">
                          {comm.text}
                        </p>
                      </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-3">
                <input
                type="text"
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave a memory note..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-body text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />

                <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-soft hover:shadow-md transition-all flex items-center justify-center shrink-0 border border-primary-500/10">

                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>);

};

export default JourneyMemoryCard;