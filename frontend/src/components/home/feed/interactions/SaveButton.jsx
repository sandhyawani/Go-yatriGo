import React from "react";
import { Bookmark, Loader2 } from "lucide-react";

const SaveButton = ({ post, isSaved, saveLoadingMap, handleSaveToggle }) => {
  return (
    <button
      type="button"
      onClick={() => handleSaveToggle(post._id)}
      disabled={saveLoadingMap[post._id?.toString()]}
      aria-label={isSaved ? "Remove from collection" : "Collect this travel memory"}
      className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-white hover:text-brand-600 active:scale-95 disabled:opacity-50"
    >
      {saveLoadingMap[post._id?.toString()] ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark
          className={`h-[18px] w-[18px] transition-colors ${
            isSaved ? "fill-brand-600 text-brand-600" : ""
          }`}
        />
      )}
    </button>
  );
};

export default React.memo(SaveButton);
