const fs = require('fs');
const file = 'c:/Users/sandh/OneDrive/Desktop/my pro/frontend/src/pages/social/TravelBuddyDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  'import { getAvatarUrl } from "../../utils/avatar";',
  'import { getAvatarUrl } from "../../utils/avatar";\nimport { differenceInDays } from "date-fns";'
);

// 2. Add new states inside TravelBuddyDetails
content = content.replace(
  'const [cancellationReason, setCancellationReason] = useState("");',
  'const [cancellationReason, setCancellationReason] = useState("");\n  const [expandedDesc, setExpandedDesc] = useState(false);\n  const [imgLoaded, setImgLoaded] = useState(false);\n  const [imgError, setImgError] = useState(false);\n  const [showMembersModal, setShowMembersModal] = useState(false);\n  const [showCancelJoinModal, setShowCancelJoinModal] = useState(false);'
);

// 3. Date Formatting and Trip Duration
content = content.replace(
  /const formattedDate = [^;]+;/s,
  `const formattedDate = new Date(trip.startDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }) + " \\u2013 " + new Date(trip.endDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
  const tripDuration = differenceInDays(new Date(trip.endDate), new Date(trip.startDate));`
);

// 4. Hero image accessibility and skeleton
// Note: Cap height at 220px on mobile
content = content.replace(
  '<div className="w-full h-48 sm:h-64 bg-slate-200 relative">',
  '<div className="w-full h-[220px] sm:h-64 bg-slate-200 relative">'
);
content = content.replace(
  /<img src={trip\.coverImage} alt="Cover" className="w-full h-full object-cover" \/>/g,
  `{!imgLoaded && !imgError && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}\n                <img src={trip.coverImage} alt={\`\${trip.title} group cover photo\`} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} className={\`w-full h-full object-cover transition-opacity \${imgLoaded ? 'opacity-100' : 'opacity-0'} \${imgError ? 'hidden' : ''}\`} />\n                {imgError && <div className="absolute inset-0 bg-[#EEEDFE] flex items-center justify-center"><MapPin className="w-12 h-12 text-[#AFA9EC]" /></div>}`
);

// 5. Back to Groups
content = content.replace(
  'text-[10px] uppercase tracking-wider',
  'text-sm font-medium'
);
content = content.replace(
  '<ArrowLeft className="w-4 h-4" /> Back to Groups',
  '<ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline" aria-label="Go back to groups list">Back to groups</span>'
);

// 6. Action Buttons in right panel: Full width on mobile -> The wrapper `flex items-center gap-2` needs to be flex-wrap or we just apply w-full.
// Actually, it's the `Save` button.
content = content.replace(
  /<button\s+onClick={handleLike}\s+className={`inline-flex items-center gap-1\.5 px-3 py-1\.5 border rounded-xl font-black text-\[10px\] uppercase tracking-wider transition-all/g,
  '<button onClick={handleLike} aria-label={isSaved ? "Unsave this group" : "Save this group"} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-medium text-sm transition-all'
);
content = content.replace(
  '<span className={`text-[14px] leading-none transition-all duration-300 ${isSaved ? "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] scale-110 grayscale-0 opacity-100" : "grayscale opacity-80"}`}>✨</span> \n              {isSaved ? "Saved" : "Save"}',
  '<span className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 ${isSaved ? "bg-[#EEEDFE] text-[#534AB7]" : "text-slate-500"}`}><Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-[#534AB7]" : ""}`} /></span> {isSaved ? "Saved" : "Save"}'
);

// 7. Badges uppercase text fixes
// Category
content = content.replace(
  'font-black uppercase tracking-wider px-2.5 py-1 rounded-full">\n                      {trip.category}',
  'font-medium capitalize px-2.5 py-1 rounded-full" role="status">\n                      {trip.category}'
);
// Private/Public
content = content.replace(
  'font-black uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1">\n                        <Lock className="w-3 h-3 text-[#FF5A7A]" /> Private',
  'font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1" role="status">\n                        <Lock className="w-3 h-3 text-[#FF5A7A]" /> Private'
);
content = content.replace(
  'font-black uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1">\n                        <Globe className="w-3 h-3 text-[#6C4DF6]" /> Public',
  'font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1" role="status">\n                        <Globe className="w-3 h-3 text-[#6C4DF6]" /> Public'
);
// Cancelled
content = content.replace(
  '<span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">',
  '<span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-100 text-rose-700" role="status">'
);
content = content.replace(
  'Cancelled by Host',
  'Cancelled by host'
);
// Lifecycle status
content = content.replace(
  /<span className={`text-\[9px\] font-black uppercase tracking-wider px-2\.5 py-1 rounded-full /g,
  '<span role="status" className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full '
);
// Slots open
content = content.replace(
  '<span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">',
  '<span className="text-sm font-medium text-emerald-600" aria-live="polite">'
);

// 8. Trip Details Row Polish
const oldDetailsRow = `<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 mb-4">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF5A7A] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">Route</span>
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
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">Dates</span>
                    <span className="text-xs font-bold text-slate-700">{formattedDate}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">Members</span>
                    <span className="text-xs font-bold text-slate-700">{memberCount} of {maxMembers || "many"} joined</span>
                  </div>
                </div>
              </div>`;

const newDetailsRow = `<div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 bg-[#FAFAFA] p-3 sm:p-4 rounded-xl border border-slate-100 mb-4">
                <div className="flex items-start gap-2.5 sm:w-1/3">
                  <MapPin className="w-4 h-4 text-[#FF5A7A] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-500 block mb-0.5">Route</span>
                    <span className="text-[15px] font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <a href={\`/explore?location=\${routeFrom}\`} className="text-[#7F77DD] hover:underline capitalize">{routeFrom}</a>
                      <span className="text-slate-400">→</span>
                      <a href={\`/explore?location=\${trip.destination}\`} className="text-[#7F77DD] hover:underline capitalize">{trip.destination}</a>
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:w-1/3">
                  <Calendar className="w-4 h-4 text-[#6C4DF6] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-500 block mb-0.5">Dates</span>
                    <span className="text-[15px] font-semibold text-slate-800 block">{formattedDate}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">{tripDuration} days</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 sm:w-1/3">
                  <Users className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-500 block mb-0.5">Members</span>
                    <div className="flex items-center gap-2 mb-1" aria-label={\`\${memberCount} members joined, \${slotsOpen} slots remaining\`}>
                      <div className="flex -space-x-2">
                        {trip.members?.slice(0, 3).map((m, i) => (
                          <img key={i} src={getAvatar(m.user)} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
                        ))}
                        {trip.members?.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center text-xs font-medium">
                            +{trip.members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{memberCount} of {maxMembers || "many"} joined</span>
                  </div>
                </div>
              </div>`;

content = content.replace(oldDetailsRow, newDetailsRow);

// 9. About Trip Text Rendering
const oldAboutTrip = `<div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">About Trip</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {trip.description}
                </p>
              </div>`;
const newAboutTrip = `<div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">About trip</h4>
                {(!trip.description || trip.description.length < 20) ? (
                  <p className="text-[15px] italic text-[#888780]">No description provided.</p>
                ) : (
                  <p className="text-[15px] text-[var(--color-text-primary)] leading-[1.7] whitespace-pre-wrap">
                    {expandedDesc || trip.description.length <= 120 
                      ? trip.description 
                      : \`\${trip.description.substring(0, 120)}... \`}
                    {trip.description.length > 120 && (
                      <button onClick={() => setExpandedDesc(!expandedDesc)} className="text-[#7F77DD] hover:underline font-medium ml-1">
                        {expandedDesc ? "Show less" : "Read more"}
                      </button>
                    )}
                  </p>
                )}
              </div>`;
content = content.replace(oldAboutTrip, newAboutTrip);

// 10. Hashtags
content = content.replace(
  /className="bg-slate-50 border border-slate-200 text-slate-500 text-\[9px\] font-black uppercase tracking-wider px-2\.5 py-1 rounded-xl"/g,
  'className="bg-[#EEEDFE] text-[#534AB7] rounded-full px-3 py-1 text-[13px] lowercase"'
);

// 11. Chat Access
content = content.replace(
  '<h3 className="text-sm font-black text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">',
  '<h3 className="text-sm font-medium text-[#111827] flex items-center gap-2 border-b border-slate-100 pb-3">'
);

// Unlock transition
const oldLockedChat = `<div className="bg-[#FAFAFA] p-6 rounded-xl border border-slate-100 text-center space-y-2">
                  <Lock className="w-7 h-7 text-slate-400 mx-auto" />
                  <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">Chat Access Locked</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Request to join this group and wait for host approval to enter the chat.
                  </p>
                </div>`;
const newLockedChat = `<motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-[#FAFAFA] p-6 rounded-xl border border-slate-100 text-center space-y-2">
                  <Lock className="w-7 h-7 text-slate-400 mx-auto" />
                  <h4 className="text-xs font-medium text-[#111827]">Chat access locked</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Request to join this group and wait for host approval to enter the chat.
                  </p>
                </motion.div>`;
content = content.replace(oldLockedChat, newLockedChat);

const oldUnlockedChat = `<div className="bg-[#FAFAFA] p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-rose-200"
                      >
                        Leave Group
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/social/chat", { state: { groupId: trip._id } })}
                      className="px-4 py-2 bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>`;
const newUnlockedChat = `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="bg-[#FAFAFA] p-4 rounded-xl border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-[#111827]">You have access to this group chat.</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Open messages to coordinate plans, meetups, and updates with the group.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => navigate("/social/chat", { state: { groupId: trip._id } })}
                        className="px-4 py-2 bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                      >
                        Open Chat
                      </button>
                    </div>
                  </div>
                  {isApproved && (
                    <div className="text-center italic text-slate-400 text-xs mb-2">
                      {trip.userId?.name} approved your request. Say hello!
                    </div>
                  )}
                  {/* Fake input bar visual */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full p-2 pl-4 cursor-pointer hover:border-[#7F77DD] transition-colors" onClick={() => navigate("/social/chat", { state: { groupId: trip._id } })}>
                    <span className="text-sm text-slate-400 flex-1 text-left">Type a message...</span>
                    <button className="w-8 h-8 rounded-full bg-[#7F77DD] text-white flex items-center justify-center"><MessageSquare className="w-4 h-4" /></button>
                  </div>
                </motion.div>`;
content = content.replace(oldUnlockedChat, newUnlockedChat);


// 12. Host Section
content = content.replace(
  '<h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">',
  '<h3 className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-1.5">'
);

content = content.replace(
  '<span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Rating</span>',
  '<span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Rating</span>'
);
content = content.replace(
  '<Star className="w-3.5 h-3.5 fill-amber-500" /> {trip.userId?.rating || "4.6"}',
  '<Star className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" /> <span className="sr-only">Rating</span> {trip.userId?.rating || "4.6"}'
);

content = content.replace(
  /<span className="text-\[8px\] font-black text-slate-400 uppercase tracking-wider block mb-1\.5">Interests<\/span>/g,
  '<span className="text-[8px] font-medium text-slate-400 uppercase block mb-1.5">Interests</span>'
);

const newHostMessageButton = `<button onClick={() => navigate(\`/social/chat?userId=\${trip.userId?._id}\`)} className="w-full py-2 mt-3 bg-transparent text-[#7F77DD] border border-[#7F77DD] rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-[#EEEDFE]">
                <MessageSquare className="w-4 h-4" /> Message host
              </button>`;

content = content.replace(
  /<span className="text-xs font-extrabold text-slate-800">\{trip\.userId\?\.hostResponseRate \|\| 100\}%<\/span>\n\s+<\/div>/,
  `$&
              {newHostMessageButton}`
);
content = content.replace('{newHostMessageButton}', newHostMessageButton);


// 13. Join Group Section
content = content.replace(
  /<h3 className="text-\[10px\] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">\s*Join Group\s*<\/h3>/,
  '<h3 className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-2">\n                  Join group\n                </h3>'
);

const oldJoinedState = `<div className="space-y-3">
                  <button
                    disabled
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 opacity-100 cursor-default"
                  >
                    <UserCheck className="w-4 h-4" /> Joined
                  </button>
                </div>`;
const newJoinedState = `<div className="space-y-2">
                  <div className="bg-[#EAF3DE] text-[#27500A] p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                    ✓ You're in! Welcome to the group.
                  </div>
                  <button onClick={() => setShowLeaveModal(true)} className="text-xs text-slate-500 underline hover:text-slate-700">Leave group</button>
                </div>`;
content = content.replace(oldJoinedState, newJoinedState);

const oldPendingState = `<div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>Your join request is pending approval from the host.</span>
                </div>`;
const newPendingState = `<div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-lg text-xs font-medium flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Your join request is pending approval from the host.</span>
                  </div>
                  <button onClick={() => setShowCancelJoinModal(true)} className="w-full py-2 mt-2 bg-transparent text-[#E24B4A] border border-[#E24B4A] rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors">
                    Cancel request
                  </button>
                </div>`;
content = content.replace(oldPendingState, newPendingState);

const oldFullState = `<div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <Lock className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>This group is full and is no longer accepting new members.</span>
                </div>`;
const newFullState = `<div className="space-y-2">
                  <button disabled className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-lg text-sm font-medium">Group is full</button>
                  <button className="w-full py-2 bg-transparent text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors" onClick={(e) => { e.target.innerText = "✓ You'll be notified"; e.target.disabled = true; }}>
                    Notify me if a slot opens
                  </button>
                </div>`;
content = content.replace(oldFullState, newFullState);

// Join Button Fix (Purple style)
content = content.replace(
  /className="w-full py-2\.5 bg-\[#6C4DF6\] hover:bg-\[#5b3ee0\] text-white font-extrabold text-\[10px\] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-\[#6C4DF6\]\/10 flex items-center justify-center gap-1\.5 disabled:opacity-60"/g,
  'className="w-full py-2.5 bg-[#7F77DD] hover:bg-[#6C4DF6] text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"'
);


// 14. Members Panel
content = content.replace(
  /<h3 className="text-\[10px\] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">\s*Members \(\{memberCount\}\)\s*<\/h3>/,
  '<h3 className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-2">\n                Members ({memberCount})\n              </h3>'
);

// Map over members and slice/stack.
const oldMembersList = /<div className="space-y-3 pb-20">([\s\S]*?)<\/div>\n            <\/div>\n\n          <\/div>/;
const newMembersList = `<div className="space-y-3 pb-20">
                {trip.members?.slice(0, 5).map((memberObj) => {
                  const mUser = memberObj.user || {};
                  if (!mUser._id) return null;
                  const mId = mUser._id.toString();
                  return (
                    <div key={mId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <img
                        onClick={() => navigate(\`/profile/\${mId}\`)}
                        src={getAvatar(mUser)}
                        alt={mUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 
                            onClick={() => navigate(\`/profile/\${mId}\`)}
                            className="text-sm font-semibold text-[#111827] truncate cursor-pointer hover:text-[#7F77DD]"
                          >{mUser.name || "User"}</h4>
                          {memberObj.role === 'host' && (
                            <span className="bg-[#EEEDFE] text-[#534AB7] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                              Host
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">Rating {mUser.rating || "4.5"}</span>
                      </div>
                    </div>
                  );
                })}
                {trip.members?.length > 5 && (
                  <button onClick={() => setShowMembersModal(true)} className="w-full py-2 text-sm text-[#7F77DD] font-medium hover:underline text-center">
                    View all {trip.members.length} members
                  </button>
                )}
              </div>
            </div>

          </div>`;
content = content.replace(oldMembersList, newMembersList);

// 15. Add modals (Cancel Join, Members List)
const additionalModals = `
      {showCancelJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-bold text-[#111827] mb-2">Cancel your join request?</h3>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelJoinModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-200 transition-colors"
              >
                Keep request
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(\`/social/buddy/manage-request/\${id}\`, { requestId: userRequest._id, status: "Cancelled" }, { withCredentials: true });
                    fetchTripDetails();
                    setShowCancelJoinModal(false);
                  } catch (e) {
                    setShowCancelJoinModal(false);
                    fetchTripDetails();
                  }
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg text-sm shadow-md transition-all active:scale-95"
              >
                Cancel request
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMembersModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#111827] mb-4">All Members</h3>
            <div className="space-y-4">
                {trip.members?.map((memberObj) => {
                  const mUser = memberObj.user || {};
                  if (!mUser._id) return null;
                  const mId = mUser._id.toString();
                  return (
                    <div key={mId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <img
                        src={getAvatar(mUser)}
                        alt={mUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#111827] truncate">{mUser.name || "User"}</h4>
                          {memberObj.role === 'host' && (
                            <span className="bg-[#EEEDFE] text-[#534AB7] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                              Host
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">Rating {mUser.rating || "4.5"} &middot; Joined recently</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('{reportModal.isOpen && (', additionalModals + '\n      {reportModal.isOpen && (');

fs.writeFileSync(file, content);
console.log('Modifications applied successfully.');
