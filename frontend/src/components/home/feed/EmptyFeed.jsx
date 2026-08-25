import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export const EmptyFeed = () => (
  <div className="bg-white dark:bg-slate-800 border border-[#8b5cf614] dark:border-slate-700 rounded-3xl p-8 sm:p-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:shadow-none min-h-[420px] flex flex-col items-center justify-center transition-colors duration-300">
    <div className="w-20 h-20 bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Compass className="w-10 h-10 text-[#7C3AED] animate-float" />
    </div>
    <h3 className="text-xl font-black text-[#111827] dark:text-white transition-colors duration-300">
      No Travel Memories yet
    </h3>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto transition-colors duration-300">
      Follow travelers or share your first journey to start building your feed.
    </p>
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link
        to="/social/buddy"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 text-[#7C3AED] font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-[#7C3AED]/20 dark:hover:bg-[#7C3AED]/30 hover:shadow-purple-200 dark:hover:shadow-purple-900/50 hover:shadow-[0_0_15px] transition-all"
      >
        Explore travelers
      </Link>
    </div>
  </div>
);

export default EmptyFeed;
