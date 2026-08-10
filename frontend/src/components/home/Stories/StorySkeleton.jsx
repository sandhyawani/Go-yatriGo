import React from "react";

export const StorySkeleton = () => (
  <div className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden shrink-0 animate-pulse border border-slate-100 dark:border-slate-600/50">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
  </div>
);

export default StorySkeleton;
