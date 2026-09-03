import React from "react";

const RouteLoadingFallback = () => {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 py-16">
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-brand-100 border-t-brand animate-spin" />
      </div>
      <span className="text-xs font-medium text-text-muted animate-pulse">Loading...</span>
    </div>
  );
};

export default RouteLoadingFallback;
