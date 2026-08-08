import React, { useState, useRef } from 'react';
import { SmilePlus, Reply, X, Play, Image, Loader2, Check, CheckCheck, Eye } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const renderReadReceipt = (msg, isSelf) => {
  const statusClass = isSelf ?
  "text-white/60 whitespace-nowrap flex items-center gap-1 text-[10px] font-medium" :
  "text-slate-400 whitespace-nowrap flex items-center gap-1 text-[10px] font-medium";
  const iconClass = isSelf ? "w-3 h-3 text-white/60" : "w-3 h-3 text-slate-400";

  if (msg.isPending) {
    return (
      <span className={statusClass}>
        <Loader2 className={`${iconClass} animate-spin`} /> Sending
      </span>);

  }

  if (!msg.unreadBy || msg.unreadBy.length === 0) {
    return (
      <span className={statusClass}>
        <Eye className={iconClass} strokeWidth={2.5} /> Viewed
      </span>);

  }

  const isDelivered =
  msg.deliveredTo &&
  msg.deliveredTo.filter((id) => {
    const uid = typeof id === "object" ? id._id : id;
    const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
    return uid?.toString() !== senderId?.toString();
  }).length > 0;

  if (isDelivered) {
    return (
      <span className={statusClass}>
        <CheckCheck className={iconClass} strokeWidth={2.5} /> Reached
      </span>);

  }

  return (
    <span className={statusClass}>
      <Check className={iconClass} strokeWidth={2.5} /> Sent
    </span>);

};



const renderClickableText = (text, isSelf = false) => {
  if (!text) return "";

  const safeText = typeof text === 'string' ? text : String(text);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = safeText.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {

      const safeUrl = part.match(/^https?:\/\//i) ? part : '#';
      return (
        <a
        key={i}
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:opacity-80 font-medium ${isSelf ? "text-white" : "text-brand-600"}`}
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-all' }}
        onClick={(e) => e.stopPropagation()}>

          {part}
        </a>);

    }
    return part;
  });
};

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
  hideStoryPreview = false
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxData, setLightboxData] = useState({ isOpen: false, url: '', type: 'image' });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStart = useRef({ x: 0, y: 0 });
  const messageRef = useRef(null);

  const handleEmojiClick = (emojiObj) => {
    onReaction(msg._id, emojiObj.emoji);
    setShowEmojiPicker(false);
  };

  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - touchStart.current.x;
    const deltaY = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (deltaX > 0) {
      setSwipeOffset(Math.min(deltaX, 80));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 50) {
      onReply(msg);
    }
    setSwipeOffset(0);
  };

  return (
    <div
    ref={messageRef}
    className={`flex w-full mb-3 items-end gap-2.5 ${isSelf ? "justify-end" : "justify-start"}`}>

      {}
      {!isSelf && showAvatar &&
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 shadow-xs border border-slate-100">
          <img
        src={senderPic}
        alt={senderName}
        className="w-full h-full object-cover" />

        </div>}

      
      {}
      <div
      className="flex flex-col max-w-[80%] sm:max-w-[65%] lg:max-w-[60%] transition-transform duration-150 ease-out"
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>

        {!isSelf && activeRoomType === "group" && showAvatar &&
        <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">
            {senderName}
          </span>}

        
        <div
        className={`relative px-4 py-2.5 cursor-pointer group transition-all duration-200 hover:-translate-y-[1px] min-w-[80px] ${
        msg.isUnsent ?
        "bg-slate-50 border border-slate-200 text-slate-400 italic rounded-2xl" :
        isSelf ?
        "bg-brand-600 hover:bg-brand-700 text-white rounded-2xl rounded-br-sm shadow-md shadow-brand-600/15 font-medium" :
        "bg-white border border-slate-200/80 text-slate-800 rounded-2xl rounded-bl-sm shadow-sm hover:shadow-md"
        }`}
        style={{ overflowWrap: 'anywhere' }}
        onContextMenu={(e) => {
          e.preventDefault();
          setActiveMessageOptions(activeMessageOptions === msg._id ? null : msg._id);
        }}
        onClick={() => {
          if (!msg.isUnsent && activeRoomType === "group") {
            setActiveMessageOptions(activeMessageOptions === msg._id ? null : msg._id);
          }
        }}>

          {msg.isUnsent ?
          <p className="text-sm leading-relaxed whitespace-pre-wrap italic">
              This message was removed
            </p> :

          <>
              {}
              {msg.storyId ?
            <div className="flex flex-col gap-2 min-w-[200px]">
                  {}
                  <div
              className={`p-2 rounded-xl text-xs flex gap-2.5 items-center cursor-pointer border backdrop-blur-sm shadow-sm ${
              isSelf ?
              "bg-white/10 border-white/20 text-white hover:bg-white/20" :
              "bg-brand-50 border-brand-100 text-brand-900 hover:bg-brand-100/50"
              } transition-all`}
              onClick={(e) => {
                e.stopPropagation();
                const dispatchId = typeof msg.storyId === 'object' ? msg.storyId._id : msg.storyId;
                if (onStoryClick) onStoryClick(dispatchId);
              }}>

                    {}
                    <div className="relative shrink-0 w-11 h-16 rounded-lg overflow-hidden bg-black/40 shadow-sm border border-white/10">
                      {typeof msg.storyId === 'object' && msg.storyId.media ?
                  msg.storyId.mediaType === 'video' ?
                  <>
                            <video src={`${msg.storyId.media}#t=0.1`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="w-4 h-4 text-white drop-shadow" fill="white" />
                            </div>
                          </> :

                  <>
                            <img src={msg.storyId.media} className="w-full h-full object-cover" alt="Dispatch" />
                            <div className="absolute top-1 right-1 bg-black/30 p-0.5 rounded">
                              <Image className="w-2.5 h-2.5 text-white" />
                            </div>
                          </> :


                  <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-600 text-lg">
                          📷
                        </div>}

                    </div>
                    {}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className={`font-bold mb-0.5 text-xs uppercase tracking-wider ${isSelf ? "text-brand-200" : "text-brand-600"}`}>
                        {(msg.text || msg.content || "").startsWith("Reacted") ? "✨ Dispatch Reaction" : "💬 Dispatch Reply"}
                      </div>
                      <div className={`truncate text-xs font-medium opacity-80 ${isSelf ? "text-white" : "text-slate-600"}`}>
                        {typeof msg.storyId === 'object' ? msg.storyId.caption || "View Dispatch attachment" : "View Dispatch"}
                      </div>
                    </div>
                  </div>

                  {}
                  {msg.text &&
              <div className="px-1 py-0.5 text-sm leading-relaxed whitespace-pre-wrap">
                      {renderClickableText(msg.text, isSelf)}
                    </div>}

                </div> :

            <>
                  {}
                  {msg.replyTo && msg.replyTo._id && (msg.replyTo.text || msg.replyTo.media || msg.replyTo.senderName) &&
              <div className={`mb-2 pl-2 border-l-2 text-xs opacity-80 ${isSelf ? "border-white/50 text-white" : "border-slate-400 text-slate-600"}`}>
                      <div className="font-semibold">
                        {msg.replyTo.senderName === currentUserName || msg.replyTo.senderName === "You" ? "You" : msg.replyTo.senderName}
                      </div>
                      <div className="truncate max-w-[180px]">{msg.replyTo.text || "Media"}</div>
                    </div>}


                  {}
                  {msg.media &&
              <div className="mb-1 rounded-xl overflow-hidden">
                      <img
                src={msg.media}
                alt="Media"
                className="max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxData({ isOpen: true, url: msg.media, type: 'image' });
                }} />

                    </div>}


                  {}
                  {msg.text &&
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ overflowWrap: 'anywhere' }}>
                      {renderClickableText(msg.text, isSelf)}
                    </p>}

                </>}

            </>}


          {}
          {activeMessageOptions === msg._id &&
          <div className={`absolute top-full mt-1 z-50 bg-white shadow-lg rounded-xl border border-slate-100 w-36 overflow-hidden ${isSelf ? "right-0" : "left-0"}`}>
              <button
            onClick={(e) => {e.stopPropagation();onDelete(msg._id);setActiveMessageOptions(null);}}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors">

                Delete for me
              </button>
              {isSelf && !msg.isUnsent &&
            <button
            onClick={(e) => {e.stopPropagation();onUnsend(msg._id);setActiveMessageOptions(null);}}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors border-t border-slate-100">

                  Unsend
                </button>}

            </div>}


          {}
          <div
          className={`flex items-center justify-end gap-1 mt-1.5 ${
          isSelf ? "text-white/50" : "text-slate-400"
          }`}>

            <span className="text-[10px] font-medium">{formatTime(msg.createdAt)}</span>
            {isSelf && !msg.isUnsent &&
            <>
                <span className={`text-[10px] ${isSelf ? 'text-white/40' : 'text-slate-300'}`}>·</span>
                {renderReadReceipt(msg, isSelf)}
              </>}

          </div>
          
          {}
          {!msg.isUnsent &&
          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${isSelf ? "-left-[72px]" : "-right-[72px]"}`}>
              <button
            onClick={(e) => {e.stopPropagation();setShowEmojiPicker(!showEmojiPicker);}}
            className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-full text-slate-400 hover:text-brand-600 transition-colors">

                <SmilePlus className="w-3.5 h-3.5" />
              </button>
              <button
            onClick={(e) => {e.stopPropagation();onReply(msg);}}
            className="p-1.5 bg-white border border-slate-100 shadow-sm rounded-full text-slate-400 hover:text-brand-600 transition-colors">

                <Reply className="w-3.5 h-3.5" />
              </button>
            </div>}


          {}
          {showEmojiPicker &&
          <div className={`absolute bottom-full mb-2 z-50 ${isSelf ? "right-0" : "left-0"}`}>
              <div
            className="fixed inset-0 z-40"
            onClick={(e) => {e.stopPropagation();setShowEmojiPicker(false);}} />

              <div className="relative z-50 shadow-xl rounded-2xl overflow-hidden border border-slate-100 bg-white" onClick={(e) => e.stopPropagation()}>
                <EmojiPicker onEmojiClick={handleEmojiClick} reactionsDefaultOpen={true} />
              </div>
            </div>}

        </div>

        {}
        {msg.reactions && msg.reactions.length > 0 &&
        <div className={`flex flex-wrap gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
            {msg.reactions.map((r, idx) =>
          <span key={idx} className="bg-white border border-slate-100 rounded-full px-1.5 py-0.5 text-xs shadow-sm">
                {r.emoji}
              </span>
          )}
          </div>}

      </div>

      {}
      {lightboxData.isOpen &&
      <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={() => setLightboxData({ isOpen: false, url: null, type: null })}>

          <button
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-black/50 transition-colors"
        onClick={(e) => {e.stopPropagation();setLightboxData({ isOpen: false, url: null, type: null });}}>

            <X className="w-6 h-6" />
          </button>
          {lightboxData.type === 'video' ?
        <video
        src={lightboxData.url}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        controls
        autoPlay
        playsInline
        onClick={(e) => e.stopPropagation()} /> :


        <img
        src={lightboxData.url}
        alt="Full size media"
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()} />}


        </div>}

    </div>);

};

export default ChatBubble;