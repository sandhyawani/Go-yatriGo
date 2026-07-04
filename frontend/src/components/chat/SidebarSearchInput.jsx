import React from "react";
import { Search, X } from "lucide-react";

export const SidebarSearchInput = ({ searchQuery, setSearchQuery, handleClearSearch }) => {
  return (
    <div className="relative">
      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-slate-50 text-[13px] pl-8 pr-8 py-2 rounded-lg outline-none border border-slate-200 focus:border-brand-500/40 focus:ring-2 focus:ring-brand-500/10 transition-all"
      />
      {searchQuery && (
        <button
          onClick={handleClearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
export default SidebarSearchInput;
