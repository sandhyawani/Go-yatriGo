import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Compass, MoreVertical, Trash2, EyeOff, Flag, Ban, Eraser } from "lucide-react";

const GroupHeaderAvatar = ({ room }) => {
  const [imgError, setImgError] = React.useState(false);

  if (room.pic && !imgError) {
    return (
      <img
      src={room.pic}
      alt=""
      onError={() => setImgError(true)}
      className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-100" />);


  }

  return (
    <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shadow-sm border border-brand/10">
      <Users className="w-4.5 h-4.5 text-brand" />
    </div>);

};

export const ChatHeader = ({
  activeRoom,
  setActiveRoom,
  currentUserId,
  onlineUsers,
  user,
  getAvatar,
  showHeaderOptions,
  setShowHeaderOptions,
  headerOptionsRef,
  handleReportUser,
  handleBlockUser,
  handleClearChat,
  handleDeleteChat
}) => {
  const navigate = useNavigate();

  const handleProfileNavigation = () => {
    if (activeRoom.type !== "direct") return;
    const otherUser = activeRoom.members?.find(
    (member) => (member._id || member)?.toString() !== currentUserId?.toString()
    );
    const targetId = otherUser?._id || otherUser || currentUserId;
    if (targetId) {
      navigate(targetId.toString() === currentUserId?.toString() ? `/profile` : `/profile/${targetId}`);
    }
  };

  const journeyIdStr = activeRoom.journeyId ? (activeRoom.journeyId._id || activeRoom.journeyId).toString() : null;
  const travelGroupIdStr = activeRoom.travelGroupId ? (activeRoom.travelGroupId._id || activeRoom.travelGroupId).toString() : null;
  const journeyLink = journeyIdStr ?
  `/social/journeys/${journeyIdStr}` :
  travelGroupIdStr ?
  `/social/buddy/${travelGroupIdStr}` :
  `/social/journeys`;

  return (
    <div className="h-14 sm:h-16 px-3 sm:px-5 bg-white/90 backdrop-blur-md border-b border-slate-100 flex justify-between items-center shrink-0 z-50 sticky top-0 shadow-[0_2px_10px_-5px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
        onClick={() => {
          setActiveRoom(null);
          navigate("/social/chat");
        }}
        className="p-1 sm:p-1.5 -ml-1 text-text-muted hover:text-text-primary rounded-lg transition-colors lg:hidden shrink-0">

          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative shrink-0">
          {activeRoom.type === "group" ?
          <GroupHeaderAvatar room={activeRoom} /> :

          <img
          src={getAvatar(activeRoom, activeRoom.name)}
          alt=""
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ${
          activeRoom.type === "direct" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
          }`}
          onClick={handleProfileNavigation} />}


          {activeRoom.type === "direct" &&
          (() => {
            const other = activeRoom.members?.find(
            (member) => (member._id || member)?.toString() !== currentUserId?.toString()
            );
            const otherId = other?._id || other;
            return otherId && onlineUsers.has(otherId);
          })() &&
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />}

        </div>
        <div className="min-w-0">
          <h3
          className={`text-[13px] sm:text-[14px] font-bold text-text-primary flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[200px] ${
          activeRoom.type === "direct" ? "cursor-pointer hover:text-brand transition-colors" : ""
          }`}
          onClick={handleProfileNavigation}>

            <span className="truncate">{activeRoom.name}</span>
            {activeRoom.type === "group" &&
            <span className="bg-background text-text-muted px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0">
                Group
              </span>}

          </h3>
          <div
          className={`text-[11px] font-medium mt-0.5 truncate ${
          activeRoom.type === "group" ?
          "text-text-muted" :
          (() => {
            const other = activeRoom.members?.find(
            (member) => (member._id || member)?.toString() !== currentUserId?.toString()
            );
            const otherId = other?._id || other;
            return otherId && onlineUsers.has(otherId);
          })() ?
          "text-emerald-500" :
          "text-text-muted"
          }`}>

            {activeRoom.type === "direct" &&
            (() => {
              const other = activeRoom.members?.find(
              (member) => (member._id || member)?.toString() !== currentUserId?.toString()
              );
              const otherId = (other?._id || other)?.toString();
              const isBlocked = otherId && user?.blockedUsers?.some((id) => (id._id || id)?.toString() === otherId);
              return isBlocked ? (
                <span className="bg-background text-text-muted px-2 py-0.5 rounded-full text-[11px] inline-block">
                  🔒 Blocked
                </span>
              ) : activeRoom.type === "group" ? (
                `${activeRoom.memberCount || activeRoom.members?.length || 0} travelers · Journey Group`
              ) : otherId && onlineUsers.has(otherId) ? (
                "Online"
              ) : (
                "Offline"
              );
            })()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {activeRoom.type === "group" &&
        <Link
        to={journeyLink}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand rounded-xl text-[12px] font-semibold transition-all duration-200">

            <Compass className="w-3.5 h-3.5" /> View Journey
          </Link>}


        <div ref={headerOptionsRef} className="relative">
          <button
          onClick={() => setShowHeaderOptions(!showHeaderOptions)}
          aria-label="More options"
          className="p-1.5 sm:p-2 text-text-muted hover:text-text-primary hover rounded-lg transition-all">

            <MoreVertical className="w-4 h-4" />
          </button>
          {showHeaderOptions &&
          <div className="absolute right-0 top-10 z-[9999] w-56 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-soft border border-border-default/60 overflow-hidden py-1 flex flex-col">
              {activeRoom.type === "direct" &&
            (() => {
              const otherUser = activeRoom.members?.find(
              (member) => (member._id || member)?.toString() !== currentUserId?.toString()
              );
              const otherId = (otherUser?._id || otherUser)?.toString();
              const isBlocked =
                otherId &&
                user?.blockedUsers?.some((id) => (id._id || id)?.toString() === otherId);
              return (
                <>
                      <button
                  onClick={(e) => { e.stopPropagation(); handleReportUser(); }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-text-primary hover:bg-brand-50/30 transition-colors flex items-center gap-2">

                        <Flag className="w-4 h-4 text-text-muted" /> Report User
                      </button>
                      <button
                  onClick={(e) => { e.stopPropagation(); handleBlockUser(); }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-text-primary hover:bg-brand-50/30 transition-colors flex items-center gap-2">

                        <Ban className="w-4 h-4 text-text-muted" /> {isBlocked ? "Unblock User" : "Block User"}
                      </button>
                      <div className="border-t border-border-default"></div>
                    </>);

            })()}
              <button
            onClick={(e) => { e.stopPropagation(); handleClearChat(); }}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-text-primary hover:bg-brand-50/30 transition-colors flex items-center gap-2">

                <Eraser className="w-4 h-4 text-text-muted" /> Clear Chat
              </button>
              <button
            onClick={(e) => { e.stopPropagation(); handleDeleteChat(activeRoom); }}
            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            activeRoom.journeyId ? "text-text-primary hover" : "text-red-500 hover:bg-red-50"
            }`}>

                {activeRoom.journeyId ?
              <>
                    <EyeOff className="w-4 h-4" /> Hide Group
                  </> :

              <>
                    <Trash2 className="w-4 h-4" /> Delete Chat
                  </>}

              </button>
            </div>}

        </div>
      </div>
    </div>);

};

export default ChatHeader;