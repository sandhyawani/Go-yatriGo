import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import StoryViewer from "../../components/story/StoryViewer";
import { ChatContext } from "../../context/chat/ChatContext";
import { useChatRooms } from "../../hooks/chat/useChatRooms";
import { useChatMessages } from "../../hooks/chat/useChatMessages";
import { useChatSocket } from "../../hooks/chat/useChatSocket";
import { useTyping } from "../../hooks/chat/useTyping";
import { useScrollManager } from "../../hooks/chat/useScrollManager";
import { useMessageStatus } from "../../hooks/chat/useMessageStatus";
import { useChatActions } from "../../hooks/chat/useChatActions";
import { storyService } from "../../services/storyService";
import { showToast } from "../../utils/showToast";

import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import ChatInput from "../../components/chat/ChatInput";
import BlockUserModal from "../../components/chat/BlockUserModal";

const ChatRoom = () => {
  const { user } = useContext(AuthContext);
  const currentUserId = user?._id || user?.id;
  const location = useLocation();
  const { roomId } = useParams();

  const { state, dispatch } = useContext(ChatContext);
  const { onlineUsers, typingUsers } = state;

  // Refs
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const headerOptionsRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Presentational States
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showHeaderOptions, setShowHeaderOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMessageOptions, setActiveMessageOptions] = useState(null);

  // Hooks Integration
  const {
    rooms,
    activeRoom,
    loading,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    globalUsers,
    isSearchingGlobal,
    isDeleteSelectionMode,
    setIsDeleteSelectionMode,
    selectedRoomIds,
    showListMoreOptions,
    setShowListMoreOptions,
    fetchRooms,
    selectRoom,
    handleSelectGlobalUser,
    handleDeleteChat,
    handleToggleRoomSelection,
    handleDeleteSelectedChats,
    handleAcceptFollow,
    handleRejectFollow,
    filteredRooms,
    requestChats,
    followRequests
  } = useChatRooms(currentUserId, location.state, roomId);

  const {
    messages,
    loadingMessages,
    inputText,
    setInputText,
    isSending,
    replyToMsg,
    setReplyToMsg,
    selectedFile,
    setSelectedFile,
    isRecording,
    recordingTime,
    audioBlob,
    setAudioBlob,
    syncRoomMessages,
    fetchRoomMessages,
    loadMoreMessages,
    handleSendMessage,
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording,
    handleDeleteForMe,
    handleUnsend,
    handleReaction
  } = useChatMessages(user);

  const {
    showBlockModal,
    setShowBlockModal,
    handleBlockUser,
    confirmBlockUser,
    handleReportUser,
    handleClearChat
  } = useChatActions(currentUserId, activeRoom);

  const socketConnected = useChatSocket(user, syncRoomMessages);
  const { sendTypingIndicator } = useTyping(socketConnected);

  const {
    showScrollBottom,
    unreadNewMessagesCount,
    setUnreadNewMessagesCount,
    handleScroll,
    scrollToBottom
  } = useScrollManager({
    chatContainerRef,
    messagesEndRef,
    messages,
    activeRoom,
    currentUserId,
    hasMoreMessages: state.hasMoreMessages,
    loadingMessages,
    loadMoreMessages
  });

  useMessageStatus(user, socketConnected, setUnreadNewMessagesCount);

  // Initial rooms loading
  useEffect(() => {
    fetchRooms(location.state?.targetUserId, location.state?.groupId || roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, location.state]);

  // Sync active room messages when room is selected
  useEffect(() => {
    if (activeRoom) {
      fetchRoomMessages(activeRoom);
      setInputText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?._id]);

  // Custom event listeners mapping
  useEffect(() => {
    const handleRefresh = () => fetchRooms(null, roomId);
    const handleCustomMessageSent = (e) => {
      const detailRoomId = e.detail?.roomId;
      const activeId = activeRoom?._id;
      if (detailRoomId && activeId && detailRoomId.toString() === activeId.toString()) {
        dispatch({
          type: "RECEIVE_MESSAGE",
          payload: { message: e.detail, currentUserId }
        });
      }
    };
    window.addEventListener("refresh_chats", handleRefresh);
    window.addEventListener("message_sent", handleCustomMessageSent);
    return () => {
      window.removeEventListener("refresh_chats", handleRefresh);
      window.removeEventListener("message_sent", handleCustomMessageSent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, activeRoom?._id]);

  // UI Event Handlers
  const handleEmojiClick = (emojiObject) => {
    setInputText((prev) => prev + emojiObject.emoji);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    sendTypingIndicator(activeRoom?._id, user?.name);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File exceeds 10MB limit.");
      return;
    }
    setSelectedFile(file);
    e.target.value = "";
  };

  const handleOpenStory = async (storyId) => {
    try {
      const res = await storyService.getStoryDetails(storyId);
      if (res.success && res.story) {
        const s = res.story;
        const group = {
          userId: s.userId._id,
          userName: s.userId.name || s.userName,
          userPic: s.userId.avatar || s.userId.pic || s.userId.img || s.userPic,
          stories: [s],
        };
        setActiveStoryGroup(group);
        setActiveStoryIndex(0);
      }
    } catch (err) {
      showToast.error("Story is no longer available.");
    }
  };

  return (
    <div className="h-[100dvh] w-full flex bg-white overflow-hidden">
      <style>{`.cs::-webkit-scrollbar{width:4px}.cs::-webkit-scrollbar-track{background:transparent}.cs::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:8px}`}</style>

      <ChatSidebar
        user={user}
        currentUserId={currentUserId}
        rooms={rooms}
        activeRoom={activeRoom}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        globalUsers={globalUsers}
        isSearchingGlobal={isSearchingGlobal}
        isDeleteSelectionMode={isDeleteSelectionMode}
        setIsDeleteSelectionMode={setIsDeleteSelectionMode}
        selectedRoomIds={selectedRoomIds}
        showListMoreOptions={showListMoreOptions}
        setShowListMoreOptions={setShowListMoreOptions}
        selectRoom={selectRoom}
        handleSelectGlobalUser={handleSelectGlobalUser}
        handleToggleRoomSelection={handleToggleRoomSelection}
        handleDeleteSelectedChats={handleDeleteSelectedChats}
        handleAcceptFollow={handleAcceptFollow}
        handleRejectFollow={handleRejectFollow}
        filteredRooms={filteredRooms}
        requestChats={requestChats}
        followRequests={followRequests}
        socketConnected={socketConnected}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
      />

      <main
        className={`flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden ${
          activeRoom ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeRoom ? (
          <>
            <ChatHeader
              activeRoom={activeRoom}
              selectRoom={selectRoom}
              currentUserId={currentUserId}
              onlineUsers={onlineUsers}
              user={user}
              showHeaderOptions={showHeaderOptions}
              setShowHeaderOptions={setShowHeaderOptions}
              headerOptionsRef={headerOptionsRef}
              handleReportUser={handleReportUser}
              handleBlockUser={handleBlockUser}
              handleClearChat={handleClearChat}
              handleDeleteChat={handleDeleteChat}
            />

            <MessageList
              chatContainerRef={chatContainerRef}
              handleScroll={handleScroll}
              messages={messages}
              activeRoom={activeRoom}
              currentUserId={currentUserId}
              user={user}
              handleDeleteForMe={handleDeleteForMe}
              handleUnsend={handleUnsend}
              setReplyToMsg={setReplyToMsg}
              handleReaction={handleReaction}
              handleOpenStory={handleOpenStory}
              activeMessageOptions={activeMessageOptions}
              setActiveMessageOptions={setActiveMessageOptions}
              typingUsers={typingUsers}
              messagesEndRef={messagesEndRef}
            />

            <ChatInput
              activeRoom={activeRoom}
              user={user}
              showScrollBottom={showScrollBottom}
              scrollToBottom={scrollToBottom}
              unreadNewMessagesCount={unreadNewMessagesCount}
              replyToMsg={replyToMsg}
              setReplyToMsg={setReplyToMsg}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              isRecording={isRecording}
              recordingTime={recordingTime}
              stopVoiceRecording={stopVoiceRecording}
              cancelVoiceRecording={cancelVoiceRecording}
              audioBlob={audioBlob}
              setAudioBlob={setAudioBlob}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              handleEmojiClick={handleEmojiClick}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              isSending={isSending}
              inputText={inputText}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              startVoiceRecording={startVoiceRecording}
              handleSendMessage={handleSendMessage}
              textareaRef={textareaRef}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none" />
        )}
      </main>

      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        activeRoom={activeRoom}
        currentUserId={currentUserId}
        confirmBlockUser={confirmBlockUser}
      />

      <StoryViewer
        activeStoryGroup={activeStoryGroup}
        activeStoryIndex={activeStoryIndex}
        setActiveStoryGroup={setActiveStoryGroup}
        setActiveStoryIndex={setActiveStoryIndex}
        myUserId={currentUserId}
        user={user}
        closeStoryViewer={() => setActiveStoryGroup(null)}
        nextStory={() => setActiveStoryGroup(null)}
        prevStory={() => setActiveStoryGroup(null)}
        isStoryPaused={false}
        setIsStoryPaused={() => {}}
        isStoryMuted={true}
        setIsStoryMuted={() => {}}
      />
    </div>
  );
};

export default ChatRoom;