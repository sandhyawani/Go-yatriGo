import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export const PostSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-border dark:border-slate-700 shadow-soft animate-pulse transition-colors duration-300">
    <div className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-slate-200 rounded w-32" />
        <div className="h-2 bg-slate-100 rounded w-20" />
      </div>
    </div>
    <div className="w-full h-[420px] max-h-[450px] object-cover object-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800" />
    <div className="p-4 space-y-3">
      <div className="flex gap-4">
        <div className="w-6 h-6 rounded bg-slate-200" />
        <div className="w-6 h-6 rounded bg-slate-200" />
        <div className="w-6 h-6 rounded bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  </div>
);

export const FeedSkeleton = () => (
  <AnimatePresence>
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PostSkeleton />
        </motion.div>
      ))}
    </div>
  </AnimatePresence>
);

export default FeedSkeleton;
