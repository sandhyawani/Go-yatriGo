import React from "react";
import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

export const EmptyFeed = () => (
  <div className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-3xl p-8 sm:p-16 text-center shadow-soft min-h-[420px] flex flex-col items-center justify-center transition-colors duration-300">
    <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
      <Camera className="w-10 h-10 text-brand animate-float" />
    </div>
    <h3 className="text-xl font-black text-text-primary dark:text-white transition-colors duration-300 font-heading">
      No Travel Memories yet
    </h3>
    <p className="text-sm font-medium text-text-muted mt-2 max-w-[280px] mx-auto transition-colors duration-300">
      Follow travelers or share your first journey to start building your feed.
    </p>
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link
        to="/social/buddy"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-brand-dark shadow-soft transition-all"
      >
        Explore travelers
      </Link>
    </div>
  </div>
);

export default EmptyFeed;
