import React from "react";
import { MessageSquare } from "lucide-react";
import ChatBubble from "./ChatBubble";

export const ChatMessages = ({
  messages,
  currentUserId,
  user,
  activeRoom,
  chatContainerRef,
  handleScroll,
  formatDateLabel,
  formatTime,
  getAvatar,
  handleDeleteForMe,
  handleUnsend,
  setReplyToMsg,
  handleReaction,
  handleOpenStory,
  activeMessageOptions,
  setActiveMessageOptions,
  typingUsers,
  messagesEndRef
}) => {
  return (
    <div
      className="flex-1 overflow-y-auto cs px-5 sm:px-8 py-6 space-y-3 bg-gradient-to-b from-white to-purple-50/30 relative"
      aria-live="polite"
      ref={chatContainerRef}
      onScroll={handleScroll}
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4 shadow-sm border border-purple-100/50">
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
          {activeRoom.type === "direct" &&
          activeRoom.requestStatus === "pending" &&
          activeRoom.requestedBy?.toString() !== currentUserId?.toString() ? (
            <>
              <h4 className="text-sm font-bold text-slate-600">
                Message Request
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Accept the request below to reply.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-base font-bold text-slate-700">
                Start your travel conversation ✈️
              </h4>
              <p className="text-[13px] text-slate-400 mt-1.5 max-w-[250px] leading-relaxed">
                Say hello and start planning your next great adventure!
              </p>
            </>
          )}
        </div>
      ) : (
        messages.map((msg, index) => {
          const isSelf =
            (msg.sender?._id || msg.sender)?.toString() === currentUserId?.toString();
          const showDate =
            index === 0 ||
            new Date(msg.createdAt).toDateString() !==
              new Date(messages[index - 1].createdAt).toDateString();
          const showAvatar =
            !isSelf &&
            (index === 0 ||
              (messages[index - 1].sender?._id || messages[index - 1].sender)?.toString() !==
                (msg.sender?._id || msg.sender)?.toString() ||
              showDate);

          // Hide duplicate story preview for consecutive
          // messages referencing the same story (show it only on the first one)
          const currentStoryRef = msg.storyId
            ? typeof msg.storyId === "object"
              ? msg.storyId._id
              : msg.storyId
            : null;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const prevStoryRef = prevMsg?.storyId
            ? typeof prevMsg.storyId === "object"
              ? prevMsg.storyId._id
              : prevMsg.storyId
            : null;
          const hideStoryPreview =
            !!currentStoryRef &&
            !!prevStoryRef &&
            currentStoryRef?.toString() === prevStoryRef?.toString() &&
            !showDate;

          return (
            <div key={msg._id || index}>
              {showDate && (
                <div className="flex items-center justify-center my-3">
                  <span className="bg-[#F1EFE8] text-[#5F5E5A] px-3 py-1 rounded-full text-[12px] font-medium">
                    {formatDateLabel(msg.createdAt)}
                  </span>
                </div>
              )}
              <ChatBubble
                msg={msg}
                isSelf={isSelf}
                showAvatar={showAvatar}
                senderPic={getAvatar(msg.senderPic, msg.senderName)}
                senderName={msg.senderName}
                currentUserName={user?.name}
                activeRoomType={activeRoom.type}
                onDelete={handleDeleteForMe}
                onUnsend={handleUnsend}
                onReply={setReplyToMsg}
                onReaction={handleReaction}
                onStoryClick={handleOpenStory}
                formatTime={formatTime}
                activeMessageOptions={activeMessageOptions}
                setActiveMessageOptions={setActiveMessageOptions}
                hideStoryPreview={hideStoryPreview}
              />
            </div>
          );
        })
      )}

      {typingUsers[activeRoom._id] && (
        <div className="flex items-end gap-2 justify-start">
          {activeRoom.type === "group" && (
            <div className="w-7 shrink-0" />
          )}
          <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
