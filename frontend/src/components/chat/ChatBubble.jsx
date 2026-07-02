import React, { useState, useRef } from 'react';
import { Check, CheckCheck, SmilePlus, Reply, X, Loader2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const ChatBubble = ({
  msg,
  isSelf,
  showAvatar,
  senderPic,
  senderName,
  currentUserName = "",
  activeRoomType,
  onDelete,
  onUnsend,
  onReply,
  onReaction,
  onStoryClick,
  formatTime,
  activeMessageOptions,
  setActiveMessageOptions,
  hideStoryPreview = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxData, setLightboxData] = useState({ isOpen: false, url: null, type: null });
  
  // Swipe to reply state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef(0);
  
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    const touchCurrent = e.touches[0].clientX;
    const diff = touchCurrent - touchStartRef.current;
    
    // Swipe right to reply
    if (diff > 0 && diff < 100) {
      setSwipeOffset(diff);
    }
  };
  
  const handleTouchEnd = () => {
    if (swipeOffset > 50) {
      onReply(msg);
    }
    setSwipeOffset(0);
  };

  const handleReactionClick = (emojiObject) => {
    onReaction(msg._id, emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div 
      className={`flex items-end gap-2 mb-0.5 ${isSelf ? "justify-end" : "justify-start"} relative`}
    >
      {/* Swipe background icon */}
      {swipeOffset > 0 && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 bg-slate-100 rounded-full w-8 h-8"
          style={{ opacity: Math.min(swipeOffset / 50, 1), transform: `translateX(${swipeOffset - 40}px)` }}
        >
          <Reply className="w-4 h-4" />
        </div>
      )}

      {!isSelf && activeRoomType === "group" && (
        <div className="w-7 shrink-0 z-10">
          {showAvatar && (
            <img
              src={senderPic}
              alt={senderName}
              className="w-7 h-7 rounded-full object-cover"
            />
          )}
        </div>
      )}
      
      <div
        className={`flex flex-col ${isSelf ? "items-end" : "items-start"} max-w-[75%] z-10 transition-transform`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isSelf && activeRoomType === "group" && showAvatar && (
          <span className="text-[10px] font-semibold text-slate-500 mb-1 ml-1">
            {senderName}
          </span>
        )}
        
        <div
          className={`relative px-4 py-2.5 cursor-pointer group transition-all duration-300 hover:-translate-y-[1px] ${
            msg.isUnsent 
              ? "bg-slate-50 border border-slate-200 text-slate-400 italic rounded-[18px]"
              : isSelf
                ? "bg-gradient-to-r from-[#6C4DF6] to-[#8553F4] text-white rounded-[18px] rounded-br-[4px] shadow-[0_4px_20px_-3px_rgba(108,77,246,0.45)] font-medium"
                : "bg-[#F1EFE8] border border-slate-100 text-[#2C2C2A] rounded-[18px] rounded-bl-[4px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md"
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            setActiveMessageOptions(activeMessageOptions === msg._id ? null : msg._id);
          }}
          onClick={() => {
            if (!msg.isUnsent && activeRoomType === "group") {
              setActiveMessageOptions(activeMessageOptions === msg._id ? null : msg._id);
            }
          }}
        >
          {msg.isUnsent ? (
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap italic">
              This message was removed
            </p>
          ) : (
            <>
              {/* Reply Snippet */}
              {msg.replyTo && (
                <div className={`mb-2 pl-2 border-l-2 text-[12px] opacity-80 ${isSelf ? "border-white/50 text-white" : "border-slate-400 text-slate-600"}`}>
                  <div className="font-semibold">
                    {msg.replyTo.senderName === currentUserName || msg.replyTo.senderName === "You" ? "You" : msg.replyTo.senderName}
                  </div>
                  <div className="truncate max-w-[180px]">{msg.replyTo.text || "Media"}</div>
                </div>
              )}

              {/* Story Reply / Reaction Snippet Popup */}
              {!hideStoryPreview && msg.storyId && (
                <div 
                  className={`mb-2.5 p-2 rounded-xl text-[12px] flex gap-2.5 items-center cursor-pointer border backdrop-blur-sm shadow-sm ${
                    isSelf 
                      ? "bg-white/15 border-white/25 text-white hover:bg-white/25" 
                      : "bg-[#6C4DF6]/10 border-[#6C4DF6]/20 text-slate-800 hover:bg-[#6C4DF6]/15"
                  } transition-all`} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const storyId = typeof msg.storyId === 'object' ? msg.storyId._id : msg.storyId;
                    if (onStoryClick) onStoryClick(storyId); 
                  }}
                >
                  {/* Story thumbnail */}
                  <div className="relative shrink-0 w-11 h-16 rounded-lg overflow-hidden bg-black/40 shadow-sm border border-white/10">
                    {typeof msg.storyId === 'object' && msg.storyId.media ? (
                      msg.storyId.mediaType === 'video' ? (
                        <video src={`${msg.storyId.media}#t=0.1`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                      ) : (
                        <img src={msg.storyId.media} className="w-full h-full object-cover" alt="Story" />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-lg">
                        📷
                      </div>
                    )}
                  </div>
                  {/* Story caption/info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className={`font-bold mb-0.5 text-[11px] uppercase tracking-wider ${isSelf ? "text-purple-100" : "text-[#6C4DF6]"}`}>
                      {(msg.text || msg.content || "").startsWith("Reacted") ? "✨ Story Reaction" : "💬 Replied to story"}
                    </div>
                    <div className={`truncate text-[12.5px] font-medium ${isSelf ? "text-white/95" : "text-slate-700"}`}>
                      {typeof msg.storyId === 'object' ? (msg.storyId.caption || "View story attachment") : "View story"}
                    </div>
                  </div>
                </div>
              )}

              {/* Media */}
              {msg.media && (
                <div className="mb-1 rounded-xl overflow-hidden">
                  <img 
                    src={msg.media} 
                    alt="Media" 
                    className="max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxData({ isOpen: true, url: msg.media, type: 'image' });
                    }}
                  />
                </div>
              )}
              
              {/* Text */}
              {msg.text && (
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              )}
            </>
          )}

          {/* Options Dropdown */}
          {activeMessageOptions === msg._id && (
            <div className={`absolute top-full mt-1 z-50 bg-white shadow-lg rounded-xl border border-slate-100 w-36 overflow-hidden ${isSelf ? "right-0" : "left-0"}`}>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(msg._id); setActiveMessageOptions(null); }}
                className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Delete for me
              </button>
              {isSelf && !msg.isUnsent && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUnsend(msg._id); setActiveMessageOptions(null); }}
                  className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-100"
                >
                  Unsend
                </button>
              )}
            </div>
          )}

          {/* Time & Read Receipts */}
          <div
            className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${
              msg.isUnsent ? "text-slate-300" : isSelf ? "text-white/80" : "text-slate-500"
            }`}
          >
            <span>{formatTime(msg.createdAt)}</span>
            {isSelf && !msg.isUnsent && (
              msg.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin text-white/50" />
              ) : !msg.unreadBy || msg.unreadBy.length === 0 ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#38bdf8] drop-shadow-sm" /> /* blue double tick = seen */
              ) : msg.deliveredTo && msg.deliveredTo.filter(id => {
                const uid = typeof id === "object" ? id._id : id;
                const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
                return uid?.toString() !== senderId?.toString();
              }).length > 0 ? (
                <CheckCheck className="w-3.5 h-3.5 text-white/60 drop-shadow-sm" /> /* grey/white double tick = delivered */
              ) : (
                <Check className="w-3.5 h-3.5 text-white/40" /> /* single tick = sent */
              )
            )}
          </div>
          
          {/* Hover Actions (Reactions/Reply) - visible on hover desktop, always visible on mobile */}
          {!msg.isUnsent && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${isSelf ? "-left-[72px]" : "-right-[72px]"}`}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-full text-slate-400 hover:text-[#6C4DF6] transition-colors"
              >
                <SmilePlus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onReply(msg); }}
                className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-full text-slate-400 hover:text-[#6C4DF6] transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className={`absolute bottom-full mb-2 z-50 ${isSelf ? "right-0" : "left-0"}`}>
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }} 
              />
              <div className="relative z-50 shadow-xl rounded-2xl overflow-hidden border border-slate-100 bg-white" onClick={(e) => e.stopPropagation()}>
                <EmojiPicker onEmojiClick={handleReactionClick} reactionsDefaultOpen={true} />
              </div>
            </div>
          )}
        </div>

        {/* Reaction Bubbles */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
            {msg.reactions.map((r, idx) => (
              <span key={idx} className="bg-white border border-slate-100 rounded-full px-1.5 py-0.5 text-xs shadow-sm">
                {r.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxData.isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxData({ isOpen: false, url: null, type: null })}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-black/50 transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxData({ isOpen: false, url: null, type: null }); }}
          >
            <X className="w-6 h-6" />
          </button>
          {lightboxData.type === 'video' ? (
            <video 
              src={lightboxData.url} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              src={lightboxData.url} 
              alt="Full size media" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;