import React, { Suspense } from "react";
import { Smile, Plus, Mic, Send, Square, X, ChevronDown } from "lucide-react";
const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

export const ChatInput = ({
  activeRoom,
  user,
  showScrollBottom,
  scrollToBottom,
  unreadNewMessagesCount,
  replyToMsg,
  setReplyToMsg,
  selectedFile,
  setSelectedFile,
  isRecording,
  recordingTime,
  stopVoiceRecording,
  cancelVoiceRecording,
  audioBlob,
  setAudioBlob,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiClick,
  fileInputRef,
  handleFileChange,
  isSending,
  inputText,
  handleInputChange,
  handleKeyDown,
  startVoiceRecording,
  handleSendMessage,
  textareaRef
}) => {
  const isJourneyCancelled =
    activeRoom?.isClosed ||
    activeRoom?.status === "closed" ||
    activeRoom?.journeyId?.status === "Cancelled" ||
    activeRoom?.journeyId?.isCancelled ||
    activeRoom?.journeyStatus === "Cancelled";

  if (isJourneyCancelled) {
    return (
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold text-center flex items-center justify-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Journey cancelled — chat is now read-only.</span>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 bg-white border-t border-slate-100 shrink-0 relative flex flex-col">
      {}
      {showScrollBottom &&
      <button
      onClick={scrollToBottom}
      className="absolute -top-12 right-6 bg-[#7C3AED] text-white shadow-soft hover:bg-[#6D28D9] transition-all z-20 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full hover:scale-105 active:scale-95 duration-200 animate-in fade-in">

          <ChevronDown className="w-4 h-4" />
          {unreadNewMessagesCount > 0 &&
        <span>New Messages ({unreadNewMessagesCount})</span>}

        </button>}


      {}
      {replyToMsg &&
      <div className="mb-2 p-2.5 bg-slate-50 border-l-4 border-[#7C3AED] rounded-r-xl flex items-center justify-between shadow-soft mx-1 sm:mx-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex-1 overflow-hidden">
            <div className="text-[11px] font-semibold text-[#7C3AED]">
              Replying to{" "}
              {replyToMsg.sender?.name === user?.name ||
            replyToMsg.senderName === user?.name ||
            replyToMsg.sender?.username === user?.username ||
            replyToMsg.senderName === "You" ?
            "You" :
            replyToMsg.sender?.name ||
            replyToMsg.senderName ||
            "User"}
            </div>
            <div className="text-[12px] text-slate-500 truncate mt-0.5">
              {replyToMsg.text || "Media"}
            </div>
          </div>
          <button
        onClick={() => setReplyToMsg(null)}
        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">

            <X className="w-4 h-4" />
          </button>
        </div>}


      {}
      {selectedFile &&
      <div className="mb-2 self-start flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full mx-1 sm:mx-2 text-[12px] font-medium text-slate-700">
          <Plus className="w-3.5 h-3.5 text-brand-500" />
          <span className="max-w-[150px] truncate">{selectedFile.name}</span>
          <span className="text-slate-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
          <button onClick={() => setSelectedFile(null)} className="ml-1 text-slate-400 hover:text-rose-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>}


      {}
      {isRecording &&
      <div className="mb-2 self-start flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-full mx-1 sm:mx-2 border border-rose-100 shadow-sm animate-pulse w-full max-w-sm justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-600 font-bold text-sm">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={stopVoiceRecording} className="p-1.5 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200">
              <Square className="w-4 h-4" />
            </button>
            <button onClick={cancelVoiceRecording} className="p-1.5 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>}


      {}
      {audioBlob && !isRecording &&
      <div className="mb-2 self-start flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full mx-1 sm:mx-2 text-[12px] font-medium text-emerald-700 border border-emerald-100">
          <Mic className="w-3.5 h-3.5 text-emerald-500" />
          <span>Voice Message</span>
          <button onClick={() => setAudioBlob(null)} className="ml-1 text-emerald-400 hover:text-rose-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>}


      {showEmojiPicker &&
      <div className="absolute bottom-full left-2 right-2 sm:left-4 sm:right-auto mb-2 z-50 shadow-soft rounded-xl overflow-hidden border border-[#E5E7EB]/60 bg-white min-h-[350px] max-w-[calc(100vw-1rem)] sm:w-[320px] flex items-center justify-center">
          <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs font-semibold animate-pulse">Loading Emojis...</div>}>
            <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" width="100%" />
          </Suspense>
        </div>}


      <div className="flex items-center gap-1 sm:gap-1.5 bg-white rounded-xl h-[48px] px-1.5 sm:px-2.5 shadow-soft border border-[#E5E7EB] focus-within:border-[#7C3AED] focus-within:ring-4 focus-within:ring-[#7C3AED]/10 transition-all duration-200 mx-1 sm:mx-2 mb-1">
        <button
        onClick={() => setShowEmojiPicker((prev) => !prev)}
        type="button"
        aria-label="Open emoji picker"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 bg-transparent hover:bg-[#F3E8FF] text-[#64748B] hover:text-[#7C3AED] transition-colors duration-200">

          <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
        
        <input type="file" ref={fileInputRef} hidden accept="image/*,video/*,.heic,.heif" onChange={handleFileChange} />
        
        <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isSending}
        type="button"
        aria-label="Attach file"
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 bg-transparent ${isSending ? "text-slate-300 pointer-events-none" : "hover:bg-[#F3E8FF] text-[#64748B] hover:text-[#7C3AED]"}`}>

          <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        <textarea
        ref={textareaRef}
        value={inputText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Share your travel experience..."
        rows={1}
        className="flex-1 max-h-[80px] bg-transparent text-xs sm:text-sm text-slate-800 px-1.5 sm:px-2 py-1.5 resize-none outline-none focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none focus-visible:ring-0 border-none shadow-none placeholder-slate-400 overflow-y-auto scrollbar-none min-h-[32px]" />


        {!isRecording && !inputText.trim() && !audioBlob && !selectedFile &&
        <button
        onClick={startVoiceRecording}
        disabled={isSending}
        type="button"
        aria-label="Record voice message"
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 bg-transparent ${isSending ? "text-slate-300 pointer-events-none" : "hover:bg-[#F3E8FF] text-[#64748B] hover:text-[#7C3AED]"}`}>

            <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>}


        <button
        onClick={handleSendMessage}
        disabled={isSending || !inputText.trim() && !selectedFile && !audioBlob}
        aria-label="Send message"
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
        inputText.trim() || selectedFile || audioBlob ?
        "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-soft hover:scale-105 active:scale-95" :
        "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
        }`}>

          <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 ml-0.5" />
        </button>
      </div>
    </div>);

};

export default ChatInput;