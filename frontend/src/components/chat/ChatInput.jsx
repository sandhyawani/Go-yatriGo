import React, { Suspense } from "react";
import { Smile, Paperclip, Mic, Send, Square, X } from "lucide-react";
import ScrollToBottomButton from "./ScrollToBottomButton";
import ReplyPreview from "./ReplyPreview";
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
  return (
    <div className="p-3 bg-white border-t border-slate-100 shrink-0 relative flex flex-col">
      <ScrollToBottomButton
        showScrollBottom={showScrollBottom}
        scrollToBottom={scrollToBottom}
        unreadNewMessagesCount={unreadNewMessagesCount}
      />

      <ReplyPreview
        replyToMsg={replyToMsg}
        setReplyToMsg={setReplyToMsg}
        user={user}
      />

      {/* File Preview Chip */}
      {selectedFile && (
        <div className="mb-2 self-start flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full mx-2 text-[12px] font-medium text-slate-700">
          <Paperclip className="w-3.5 h-3.5 text-[#7F77DD]" />
          <span className="max-w-[150px] truncate">{selectedFile.name}</span>
          <span className="text-slate-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
          <button onClick={() => setSelectedFile(null)} className="ml-1 text-slate-400 hover:text-rose-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Audio Recording UI */}
      {isRecording && (
        <div className="mb-2 self-start flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-full mx-2 border border-rose-100 shadow-sm animate-pulse w-full max-w-sm justify-between">
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
        </div>
      )}

      {/* Audio Preview Chip */}
      {audioBlob && !isRecording && (
        <div className="mb-2 self-start flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full mx-2 text-[12px] font-medium text-emerald-700 border border-emerald-100">
          <Mic className="w-3.5 h-3.5 text-emerald-500" />
          <span>Voice Message</span>
          <button onClick={() => setAudioBlob(null)} className="ml-1 text-emerald-400 hover:text-rose-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden border border-slate-100 bg-white min-h-[350px] w-[320px] flex items-center justify-center">
          <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs font-semibold animate-pulse">Loading Emojis...</div>}>
            <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
          </Suspense>
        </div>
      )}

      <div className="flex items-end gap-2 bg-white rounded-2xl px-2 py-1.5 shadow-sm border border-slate-200 focus-within:border-[#7F77DD] focus-within:ring-2 focus-within:ring-[#7F77DD]/20 transition-all mx-2 mb-1">
        <button
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          aria-label="Open emoji picker"
          className="p-2 text-slate-400 hover:text-[#7F77DD] rounded-lg transition-colors shrink-0"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input type="file" ref={fileInputRef} hidden accept="image/*,video/*,.heic,.heif" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          aria-label="Attach file"
          className={`p-2 rounded-lg transition-colors shrink-0 hidden sm:block ${isSending ? "text-slate-300" : "text-slate-400 hover:text-[#7F77DD]"}`}
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 max-h-[120px] bg-transparent text-[14px] text-slate-800 px-1 py-2 resize-none outline-none placeholder-slate-400 cs min-h-[36px]"
        />
        {!isRecording && !inputText.trim() && !audioBlob && !selectedFile && (
          <button
            onClick={startVoiceRecording}
            disabled={isSending}
            aria-label="Record voice message"
            className={`p-2 rounded-lg transition-colors shrink-0 hidden sm:block ${isSending ? "text-slate-300" : "text-slate-400 hover:text-[#7F77DD]"}`}
          >
            <Mic className="w-4.5 h-4.5" />
          </button>
        )}
        <div className="flex flex-col justify-end h-full mb-0.5">
          <div className="text-center text-[9px] text-slate-300 -mt-3 mb-1 w-full hidden sm:block pointer-events-none opacity-60">
            Enter to send · Shift+Enter for new line
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isSending || (!inputText.trim() && !selectedFile && !audioBlob)}
            aria-label="Send message"
            className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              inputText.trim() || selectedFile || audioBlob
                ? "bg-[#7F77DD] text-white hover:bg-[#6b62d6] shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                : "bg-slate-100 text-[#7F77DD] opacity-35 pointer-events-none"
            }`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatInput;
