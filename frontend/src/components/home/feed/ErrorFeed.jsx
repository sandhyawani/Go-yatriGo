import React from "react";
import { ShieldAlert } from "lucide-react";

export const ErrorFeed = ({ onRetry }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-8 sm:p-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:shadow-none min-h-[300px] flex flex-col items-center justify-center transition-colors duration-300">
    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <ShieldAlert className="w-8 h-8 text-rose-500" />
    </div>
    <h3 className="text-xl font-black text-slate-800 dark:text-white">
      Oops, something went wrong!
    </h3>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-[280px] mx-auto">
      We couldn't load the feed right now. Please check your connection and try again.
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-[#5b3ee0] shadow-[0_4px_12px_rgba(108,77,246,0.3)] transition-all"
    >
      Try again
    </button>
  </div>
);

export default ErrorFeed;
