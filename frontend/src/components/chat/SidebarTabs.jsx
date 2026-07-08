import React from "react";

export const SidebarTabs = ({ activeTab, setActiveTab, requestChats, followRequests }) => {
  return (
    <div className="flex bg-slate-100 p-0.5 rounded-lg border-b border-transparent">
      {["chats", "requests", "groups"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-md transition-all ${
            activeTab === tab
              ? "bg-white shadow-sm text-brand-600 border-b-2 border-brand-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab}
          {tab === "requests" && requestChats.length + followRequests.length > 0 && (
            <span className="ml-1 bg-accent-500 text-white px-1 py-0.5 rounded-full text-xs">
              {requestChats.length + followRequests.length}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
export default SidebarTabs;
