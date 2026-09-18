import React from "react";
import { Bookmark, Loader2 } from "lucide-react";

const SaveButton = ({ post, isSaved, saveLoadingMap, handleSaveToggle }) => {
  return (
    <button
      type="button"
      onClick={() => handleSaveToggle(post._id)}
      disabled={saveLoadingMap[post._id?.toString()]}
      aria-label={isSaved ? "Remove from collection" : "Collect this travel memory"}
      className="ml-1 sm:ml-2 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-white hover:text-amber-700 active:scale-95 disabled:opacity-50"
    >
      {saveLoadingMap[post._id?.toString()] ? (
        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-amber-600" />
      ) : (
        <Bookmark
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${
            isSaved ? "fill-amber-600 text-amber-600" : "text-slate-400"
          }`}
        />
      )}
    </button>
  );
};

export default React.memo(SaveButton);
