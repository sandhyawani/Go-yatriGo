const fs = require('fs');

const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix the top duplicate block
const badBlockStart = content.indexOf('          <button\n            onClick={() => navigate("/social/buddy")}\n            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#111827] font-black text-sm font-medium transition-colors"\n  const tripDuration = Math.ceil');

if (badBlockStart !== -1) {
    const startIdx = content.indexOf('  const tripDuration =', badBlockStart);
    const endIdx = content.indexOf('        <div className="flex justify-between items-center gap-3 mb-4">\n          <button', startIdx);
    
    content = content.substring(0, startIdx) + 
              `          >\n            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline" aria-label="Go back to groups list">Back to groups</span>\n          </button>\n          \n          <div className="flex items-center gap-2">\n` +
              content.substring(endIdx + 89);
}

// 2. Insert the missing block
const insertPointStr = '            <motion.div\n              initial={{ opacity: 0, y: 15 }}\n              animate={{ opacity: 1, y: 0 }}\n              className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"\n            >\n              {/* Hero Cover Image */}\n              <div className="w-full h-[220px] sm:h-64 bg-slate-200 relative">\n                {trip.coverImage ? (\n                  <>\n                    {!imgLoaded && !imgError && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}\n                    <img src={trip.coverImage} alt={`${trip.title} group cover photo`} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={`w-full h-full object-cover transition-opacity ${imgLoaded ? \'opacity-100\' : \'opacity-0\'} ${imgError ? \'hidden\' : \'\'}`} />\n                    {imgError && <div className="absolute inset-0 bg-[#EEEDFE] flex items-center justify-center"><MapPin className="w-12 h-12 text-[#AFA9EC]" /></div>}\n                  </>\n                ) : (\n                  <div className="w-full h-full bg-[#6C4DF6]/20 flex items-center justify-center">\n                    <MapPin className="w-12 h-12 text-[#6C4DF6]/40" />\n                  </div>\n                )}\n                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>\n                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">\n                  <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">{trip.title}</h1>\n                </div>\n          </div>';

const missingBlock = `
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#6C4DF6]/10 border border-[#6C4DF6]/15 text-[#6C4DF6] text-[10px] font-black px-2.5 py-1 rounded-full">
                      {trip.category}
                    </span>
                    {trip.isPrivate ? (
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#FF5A7A]" /> Private
                      </span>
                    ) : (
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#6C4DF6]" /> Public
                      </span>
                    )}
                    {trip.status === 'cancelled' && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-100 text-rose-700" role="status">
                        Cancelled by host
                      </span>
                    )}
                    {trip.lifecycleStatus && trip.status !== 'cancelled' && (
                      <span role="status" className={\`text-xs font-medium capitalize px-2.5 py-1 rounded-full \${
                        trip.lifecycleStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        trip.lifecycleStatus === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        trip.lifecycleStatus === 'completed' ? 'bg-slate-100 text-slate-500' :
                        'bg-rose-100 text-rose-700'
                      }\`}>
                        {trip.lifecycleStatus}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-emerald-600" aria-live="polite">
                    {slotsOpen > 0 ? \`\${slotsOpen} slots open\` : "Group full"}
                  </span>
                </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 mb-4">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF5A7A] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-slate-500 block mb-0.5">Route</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#6C4DF6] truncate">{routeFrom}</span>
                      <span className="text-slate-400 text-[10px]">to</span>
                      <span className="text-[#FF5A7A] truncate">{trip.destination}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#6C4DF6] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-500 block mb-0.5">Dates</span>
                    <span className="text-xs font-bold text-slate-700">{formattedDate}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-500 block mb-0.5">Members</span>
                    <span className="text-xs font-bold text-slate-700">{memberCount} of {maxMembers || "many"} joined</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-500 mb-2">About Trip</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {trip.description}
                </p>
              </div>

              {/* Tags Display */}
              {trip.tags && trip.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {trip.tags?.map(tag => (
                    <span key={tag} className="bg-[#EEEDFE] text-[#534AB7] rounded-full px-3 py-1 text-[13px] lowercase">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              </div>
            </motion.div>

            {/* CHAT / DISCUSSION BOARD */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4"
            >
              <h3 className="text-sm font-medium text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-[#6C4DF6]" /> Group Chat
              </h3>

              {showChat ? (
                <div className="bg-[#FAFAFA] p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-[#111827]">You have access to this group chat.</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Open messages to coordinate plans, meetups, and updates with the group.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {!isHost && (
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl text-[10px] font-black transition-all border border-rose-200"
                      >
                        Leave Group
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/social/chat", { state: { groupId: trip._id } })}
                      className="px-4 py-2 bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white rounded-xl text-[10px] font-black transition-all shadow-sm"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAFAFA] p-6 rounded-xl border border-slate-100 text-center space-y-2">
                  <Lock className="w-7 h-7 text-slate-400 mx-auto" />
                  <h4 className="text-xs font-black text-[#111827]">Chat Access Locked</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Request to join this group and wait for host approval to enter the chat.
                  </p>
                </div>
              )}

              {trip.status === "cancelled" && trip.cancellationReason && (
                <div className="p-4 sm:p-5 bg-rose-50 border-t border-rose-100 text-rose-700 text-xs font-semibold">
                  <span className="font-black text-[10px] block mb-1">Reason for Cancellation</span>
                  "{trip.cancellationReason}"
                </div>
              )}
            </motion.div>
`;

// wait, let's just make sure we find the insertion point robustly
const lines = content.split('\\n');
// let's do a replace
content = content.replace(insertPointStr, insertPointStr + missingBlock);

// ensure the floating bracket `{/* LEFT 8 COLUMNS: Trip Parameters, Chat */}}` is fixed
content = content.replace('{/* LEFT 8 COLUMNS: Trip Parameters, Chat */}}', '{/* LEFT 8 COLUMNS: Trip Parameters, Chat */}');

fs.writeFileSync(file, content);
console.log("Restored missing block and fixed syntax errors!");
