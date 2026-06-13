import { showToast } from "../../utils/showToast";
// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
// import { X, Music, VolumeX, Volume2, Edit2, Trash2, Loader2, Send } from 'lucide-react';
// import moment from 'moment';
// import axios from '../../api/axios';
// import { showToast } from "../../utils/showToast";
// import { getAvatarUrl } from '../../utils/avatar';
import ReportModal from '../modals/ReportModal';

// const StoryViewer = ({
//   activeStoryGroup,
//   activeStoryIndex,
//   myUserId,
//   storyReplyText,
//   setStoryReplyText,
//   replyingToStory,
//   isStoryMuted,
//   setIsStoryMuted,
//   handleStoryReaction,
//   handleStoryReply,
//   handleDeleteStory,
//   setShowViewersList,
//   isStoryPaused,
//   setIsStoryPaused,
//   closeStoryViewer,
//   nextStory,
//   prevStory,
//   stories,
//   fetchFeedData
// }) => {
//   const [storyMediaLoaded, setStoryMediaLoaded] = useState(false);
//   const [storyProgress, setStoryProgress] = useState(0);
//   const [isTabActive, setIsTabActive] = useState(true);
//   const [reportModal, setReportModal] = useState({ isOpen: false });
  
//   const videoRef = useRef(null);
//   const pointerDownTime = useRef(0);
//   const pointerStartPos = useRef({ x: 0, y: 0 });
//   const storyProgressRef = useRef(0);
  
//   const prefersReducedMotion = useReducedMotion();

//   // Mark story as viewed
//   useEffect(() => {
//     if (!activeStoryGroup || !myUserId) return;
//     const currentStory = activeStoryGroup.stories[activeStoryIndex];
//     if (currentStory && String(activeStoryGroup.userId) !== String(myUserId)) {
//       if (!currentStory.viewedBy?.includes(myUserId)) {
//         if (!currentStory.viewedBy) currentStory.viewedBy = [];
//         currentStory.viewedBy.push(myUserId);
        
//         axios.post(`/social/story/${currentStory._id}/view`, {}, { withCredentials: true })
//           .then(() => {
//             if (fetchFeedData) fetchFeedData();
//           })
//           .catch(err => console.log("Failed to mark story as viewed", err));
//       }
//     }
//   }, [activeStoryGroup, activeStoryIndex, myUserId, fetchFeedData]);

//   // Page Visibility API to pause animations/progress when tab is inactive
//   useEffect(() => {
//     const handleVisibilityChange = () => setIsTabActive(!document.hidden);
//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
//   }, []);

//   // Keyboard shortcuts
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       // Ignore if typing in input
//       if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      
//       switch(e.key) {
//         case 'ArrowRight':
//           nextStory();
//           break;
//         case 'ArrowLeft':
//           prevStory();
//           break;
//         case 'Escape':
//           closeStoryViewer();
//           break;
//         case ' ':
//           e.preventDefault();
//           setIsStoryPaused(prev => !prev);
//           break;
//         default:
//           break;
//       }
//     };
    
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [nextStory, prevStory, closeStoryViewer, setIsStoryPaused]);

//   useEffect(() => {
//     setStoryProgress(0);
//     storyProgressRef.current = 0;
//     setStoryMediaLoaded(false);
//   }, [activeStoryGroup, activeStoryIndex]);

//   useEffect(() => {
//     if (!activeStoryGroup || isStoryPaused || !storyMediaLoaded || !isTabActive) return;
    
//     let animationFrame;
//     let lastTime = Date.now();
//     const duration = activeStoryGroup.stories[activeStoryIndex]?.mediaType === "video" ? 15000 : 5000;

//     const tick = () => {
//       const currentTime = Date.now();
//       const delta = currentTime - lastTime;
//       lastTime = currentTime;
      
//       storyProgressRef.current += (delta / duration) * 100;
      
//       if (storyProgressRef.current >= 100) {
//         storyProgressRef.current = 100;
//         setStoryProgress(100);
//         nextStory();
//       } else {
//         setStoryProgress(storyProgressRef.current);
//         animationFrame = requestAnimationFrame(tick);
//       }
//     };
    
//     animationFrame = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(animationFrame);
//   }, [activeStoryGroup, activeStoryIndex, isStoryPaused, storyMediaLoaded, isTabActive, nextStory]);

//   const handleStoryPointerDown = (e) => {
//     pointerDownTime.current = Date.now();
//     pointerStartPos.current = { x: e.clientX, y: e.clientY };
//     setIsStoryPaused(true);
//     if (videoRef.current) videoRef.current.pause();
//   };

//   const handleStoryPointerUp = (e, direction) => {
//     setIsStoryPaused(false);
//     if (videoRef.current && isTabActive) videoRef.current.play().catch(err => console.log(err));
    
//     const dx = Math.abs(e.clientX - pointerStartPos.current.x);
//     const dy = Math.abs(e.clientY - pointerStartPos.current.y);
//     if (dx > 20 || dy > 20) return; // drag, not tap

//     const duration = Date.now() - pointerDownTime.current;
//     if (duration < 250) {
//       if (direction === 'prev') prevStory();
//       else if (direction === 'next') nextStory();
//     }
//   };

//   const handleStoryDragEnd = (event, info) => {
//     const { offset, velocity } = info;
//     const swipeThreshold = 50;
    
//     if (offset.y > swipeThreshold || velocity.y > 500) {
//       closeStoryViewer();
//     } else if (offset.x > swipeThreshold || velocity.x > 500) {
//       prevStory();
//     } else if (offset.x < -swipeThreshold || velocity.x < -500) {
//       nextStory();
//     }
//   };

//   if (!activeStoryGroup) return null;

//   const currentStory = activeStoryGroup.stories[activeStoryIndex];
//   const isVideo = currentStory?.mediaType === "video";
//   const mediaUrl = currentStory?.media;
//   const isOwnStory = String(activeStoryGroup.userId) === String(myUserId);

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }} 
//       animate={{ opacity: 1 }} 
//       exit={{ opacity: 0 }} 
//       className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center overflow-hidden"
//     >
//       <motion.div 
//         drag
//         dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
//         dragElastic={0.4}
//         onDragEnd={handleStoryDragEnd}
//         className="relative w-full max-w-[430px] h-[100dvh] sm:h-[92vh] sm:aspect-[9/16] sm:rounded-[32px] overflow-hidden bg-black flex flex-col shadow-2xl ring-1 ring-white/10"
//       >
//         {/* Progress Bars */}
//         <div className="absolute top-3 inset-x-4 z-40 flex gap-1">
//           {activeStoryGroup.stories?.map((st, idx) => (
//             <div key={st._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-md shadow-sm">
//               <motion.div 
//                 className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
//                 style={{ width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? `${storyProgress}%` : '0%' }}
//                 transition={{ duration: 0.1, ease: 'linear' }}
//               />
//             </div>
//           ))}
//         </div>

//         {/* Header */}
//         <div className="absolute top-6 inset-x-4 z-40 flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500">
//               <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-800">
//                 <img src={getAvatarUrl(activeStoryGroup.userPic, null, activeStoryGroup.userName)} alt={activeStoryGroup.userName} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeStoryGroup.userName || "Explorer")}&background=6C4DF6&color=fff&bold=true`; }} />
//               </div>
//             </div>
//             <div style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
//               <h4 className="text-[13px] font-bold text-white leading-none flex items-center gap-1 drop-shadow-md">
//                 {activeStoryGroup.userName}
//                 {activeStoryGroup.isVerified && <span className="bg-blue-500 rounded-full w-3 h-3 flex items-center justify-center text-[7px] font-black text-white shadow-sm">✓</span>}
//               </h4>
//               <span className="text-[11px] text-white/80 font-medium mt-0.5 block drop-shadow-md">{moment(currentStory?.createdAt).fromNow()}</span>
//             </div>
//           </div>
//           <motion.button 
//             whileHover={prefersReducedMotion ? {} : { scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }} 
//             whileTap={{ scale: 0.9 }} 
//             onClick={closeStoryViewer} 
//             className="w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
//             aria-label="Close story viewer"
//           >
//             <X className="w-5 h-5" />
//           </motion.button>
//         </div>

//         {/* Interaction Zones */}
//         <div className="absolute inset-y-0 left-0 w-1/3 z-20 touch-none" onPointerDown={handleStoryPointerDown} onPointerUp={(e) => handleStoryPointerUp(e, 'prev')} onPointerCancel={() => setIsStoryPaused(false)} aria-label="Previous story layer" />
//         <div className="absolute inset-y-0 right-0 w-1/3 z-20 touch-none" onPointerDown={handleStoryPointerDown} onPointerUp={(e) => handleStoryPointerUp(e, 'next')} onPointerCancel={() => setIsStoryPaused(false)} aria-label="Next story layer" />
//         <div className="absolute inset-y-0 left-1/3 right-1/3 z-20 touch-none" onPointerDown={handleStoryPointerDown} onPointerUp={(e) => handleStoryPointerUp(e, 'none')} onPointerCancel={() => setIsStoryPaused(false)} aria-label="Pause story layer" />

//         <div className="w-full h-full flex items-center justify-center relative bg-black">
//           {!storyMediaLoaded && (
//             <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
//               <Loader2 className="w-8 h-8 text-white animate-spin" />
//             </div>
//           )}
          
//           {/* Ambient Blurred Background (Edge-to-Edge) */}
//           {mediaUrl && (
//             <motion.div 
//               initial={{ opacity: 0 }}
//               animate={{ 
//                 opacity: 0.3, 
//                 scale: (prefersReducedMotion || !isTabActive) ? 1.05 : [1.05, 1.1, 1.05] 
//               }}
//               transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
//               className="absolute inset-0 z-0 overflow-hidden"
//               aria-hidden="true"
//             >
//                {isVideo ? (
//                  <video src={mediaUrl} muted loop className="w-full h-full object-cover blur-[50px] scale-110 brightness-50" />
//                ) : (
//                  <img src={mediaUrl} alt="" className="w-full h-full object-cover blur-[50px] scale-110 brightness-50" />
//                )}
//             </motion.div>
//           )}

//           {/* Main Media with Cinematic Zoom for Images Only */}
//           <div className="relative z-10 w-full h-full overflow-hidden flex items-center justify-center">
//             {isVideo ? (
//               <video 
//                 ref={videoRef}
//                 src={mediaUrl} 
//                 autoPlay 
//                 loop={false}
//                 muted={isStoryMuted} 
//                 playsInline
//                 className="w-full h-full object-contain sm:object-cover drop-shadow-2xl"
//                 onLoadedMetadata={() => setStoryMediaLoaded(true)}
//               />
//             ) : (
//               <motion.img 
//                 src={mediaUrl} 
//                 alt="Story" 
//                 initial={{ scale: 1 }}
//                 animate={{ scale: (prefersReducedMotion || !isTabActive || isStoryPaused) ? 1 : 1.06 }}
//                 transition={{ duration: 7, ease: "linear" }}
//                 className="w-full h-full object-contain sm:object-cover drop-shadow-2xl" 
//                 onLoad={() => setStoryMediaLoaded(true)}
//               />
//             )}
//           </div>
          
//           {/* Audio Player for Image Stories */}
//           {!isVideo && currentStory?.song && (
//             <audio 
//               src={currentStory.song.audioUrl} 
//               autoPlay 
//               loop 
//               muted={isStoryMuted || isStoryPaused || !isTabActive} 
//             />
//           )}

//           {/* Music Tag Overlay */}
//           <AnimatePresence>
//             {storyMediaLoaded && currentStory?.song && (
//               <motion.div 
//                 drag={isOwnStory}
//                 dragConstraints={{ top: 0, left: 0, right: 200, bottom: 600 }}
//                 dragElastic={0.2}
//                 onDragStart={(e) => e.stopPropagation()}
//                 initial={{ scale: 0.8, opacity: 0, y: 10 }}
//                 animate={{ scale: 1, opacity: 1, y: 0 }}
//                 exit={{ scale: 0.8, opacity: 0 }}
//                 className={`absolute top-20 left-4 bg-black/40 backdrop-blur-xl border border-white/20 shadow-lg text-white px-3 py-1.5 rounded-2xl flex items-center gap-2 max-w-[200px] z-[60] ${isOwnStory ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
//               >
//                 <motion.div animate={(isStoryPaused || prefersReducedMotion || !isTabActive) ? { scale: 1 } : { scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
//                   <Music className="w-3.5 h-3.5 text-rose-400" />
//                 </motion.div>
//                 <div className="overflow-hidden min-w-0">
//                   <p className="text-[11px] font-bold truncate tracking-tight">{currentStory.song.songTitle}</p>
//                   <p className="text-[9px] text-white/70 truncate">{currentStory.song.artistName}</p>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Mute/Unmute Button */}
//           {(isVideo || currentStory?.song) && (
//             <motion.button 
//               whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               onClick={() => setIsStoryMuted(!isStoryMuted)} 
//               className="absolute top-20 right-4 z-40 w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-white/20 shadow-lg text-white rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
//               aria-label={isStoryMuted ? "Unmute story" : "Mute story"}
//             >
//               {isStoryMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
//             </motion.button>
//           )}
          
//           {/* Caption Overlay */}
//           <AnimatePresence mode="wait">
//             {storyMediaLoaded && currentStory?.caption && (
//               <motion.div 
//                 key={activeStoryIndex}
//                 initial={{ opacity: 0, y: 20 }} 
//                 animate={{ opacity: 1, y: 0 }} 
//                 transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
//                 className={`absolute w-full px-6 text-center font-black text-2xl z-30 tracking-tight pointer-events-none ${currentStory.captionPosition === "top" ? "top-32" : currentStory.captionPosition === "bottom" ? "bottom-32" : "top-1/2 -translate-y-1/2"} ${currentStory.captionColor === "black" ? "text-black" : currentStory.captionColor === "purple" ? "text-purple-400" : "text-white"}`} 
//                 style={{ textShadow: "0 2px 15px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)" }}
//               >
//                 {currentStory.caption}
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* Bottom Interaction Bar */}
//         <div className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-4 pointer-events-none">
//           {(() => {
//             return !isOwnStory ? (
//               <div className="pointer-events-auto flex flex-col gap-4 w-full">
//                 {/* Emoji Reactions */}
//                 <div className="flex justify-center gap-4">
//                   {["❤️", "🔥", "😍", "😂", "🌍"].map((emoji, i) => (
//                     <motion.button
//                       key={emoji}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: i * 0.05, type: 'spring' }}
//                       whileHover={prefersReducedMotion ? {} : { scale: 1.25, y: -5 }}
//                       whileTap={{ scale: 0.85 }}
//                       onClick={(e) => { e.stopPropagation(); handleStoryReaction(emoji); }}
//                       className="text-3xl drop-shadow-xl min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full"
//                       aria-label={`React with ${emoji}`}
//                     >
//                       {emoji}
//                     </motion.button>
//                   ))}
//                 </div>
//                 {/* Reply Input */}
//                 <div className="flex gap-2 items-center">
//                   <div className="relative flex-1">
//                     <input 
//                       type="text" 
//                       value={storyReplyText} 
//                       onChange={(e) => setStoryReplyText(e.target.value)} 
//                       placeholder={`Reply to ${activeStoryGroup.userName.split(" ")[0]}...`} 
//                       className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full pl-5 pr-12 py-3 min-h-[44px] text-[13px] text-white placeholder:text-white/60 outline-none focus-visible:bg-white/20 focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/50 transition-all shadow-lg" 
//                       onClick={(e) => e.stopPropagation()} 
//                       onKeyDown={(e) => { if (e.key === "Enter" && storyReplyText.trim()) { handleStoryReply(); } }} 
//                       aria-label="Reply to story"
//                     />
//                   </div>
//                   <motion.button 
//                     whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={handleStoryReply} 
//                     disabled={replyingToStory || !storyReplyText.trim()} 
//                     className="w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-rose-500 to-indigo-500 text-white rounded-full shadow-lg disabled:opacity-50 disabled:grayscale transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
//                     aria-label="Send reply"
//                   >
//                     {replyingToStory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />}
//                   </motion.button>
//                 </div>
//               </div>
//             ) : (
//               <div className="pointer-events-auto flex items-center justify-between w-full">
//                 <motion.button 
//                   whileHover={prefersReducedMotion ? {} : { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={(e) => { e.stopPropagation(); setShowViewersList(true); setIsStoryPaused(true); }} 
//                   className="flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg rounded-full text-white text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
//                   aria-label="View story viewers"
//                 >
//                   👁️ {currentStory?.viewers?.length || 0} Views
//                 </motion.button>
//                 <div className="flex gap-2">
//                   <motion.button 
//                     whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
//                     whileTap={{ scale: 0.9 }}
//                     onClick={(e) => { e.stopPropagation(); const newCaption = window.prompt("Edit Caption:", currentStory?.caption || ""); if (newCaption !== null) { axios.put(`/social/story/${currentStory._id}`, { caption: newCaption }, { withCredentials: true }).then(() => { showToast.success("Caption updated!"); if(fetchFeedData) fetchFeedData(); }); } }} 
//                     className="w-11 h-11 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg rounded-full text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
//                     aria-label="Edit story caption"
//                   >
//                     <Edit2 className="w-4 h-4" />
//                   </motion.button>
//                   <motion.button 
//                     whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
//                     whileTap={{ scale: 0.9 }}
//                     onClick={(e) => { e.stopPropagation(); handleDeleteStory(currentStory._id); }} 
//                     className="w-11 h-11 flex items-center justify-center bg-rose-500/80 backdrop-blur-xl border border-rose-400/50 shadow-lg rounded-full text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
//                     aria-label="Delete story"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </motion.button>
//                 </div>
//               </div>
//             );
//           })()}
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default StoryViewer;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Music, VolumeX, Volume2, Edit2, Trash2, Loader2, Send, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import moment from 'moment';
import axios from '../../api/axios';
import { getAvatarUrl } from '../../utils/avatar';
import AudioManager from "../../utils/AudioManager";
import Swal from 'sweetalert2';
import StorySticker from "./StorySticker";

const StoryViewer = ({
  activeStoryGroup,
  activeStoryIndex,
  myUserId,
  storyReplyText,
  setStoryReplyText,
  replyingToStory,
  isStoryMuted,
  setIsStoryMuted,
  handleStoryReaction,
  handleStoryReply,
  handleDeleteStory,
  setShowViewersList,
  isStoryPaused,
  setIsStoryPaused,
  closeStoryViewer,
  nextStory,
  prevStory,
  stories,
  fetchFeedData,
}) => {
  const [storyMediaLoaded, setStoryMediaLoaded] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const [reportModal, setReportModal] = useState({ isOpen: false });

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const pointerDownTime = useRef(0);
  const pointerStartPos = useRef({ x: 0, y: 0 });
  const storyProgressRef = useRef(0);
  const animFrameRef = useRef(null);

  const prefersReducedMotion = useReducedMotion();

  // Mark story viewed
  useEffect(() => {
    if (!activeStoryGroup || !myUserId) return;
    const currentStory = activeStoryGroup.stories[activeStoryIndex];
    if (currentStory && String(activeStoryGroup.userId) !== String(myUserId)) {
      if (!currentStory.viewedBy?.includes(myUserId)) {
        if (!currentStory.viewedBy) currentStory.viewedBy = [];
        currentStory.viewedBy.push(myUserId);
        axios
          .post(`/social/story/${currentStory._id}/view`, {}, { withCredentials: true })
          .then(() => fetchFeedData?.())
          .catch(() => {});
      }
    }
  }, [activeStoryGroup, activeStoryIndex, myUserId, fetchFeedData]);

  // Tab visibility
  useEffect(() => {
    const handle = () => setIsTabActive(!document.hidden);
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, []);

  // Stop background audio on mount and unmount
  useEffect(() => {
    AudioManager.stopAll();
    AudioManager.lock();
    return () => {
      AudioManager.stopAll();
      AudioManager.unlock();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e) => {
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') nextStory();
      else if (e.key === 'ArrowLeft') prevStory();
      else if (e.key === 'Escape') closeStoryViewer();
      else if (e.key === ' ') { e.preventDefault(); setIsStoryPaused((p) => !p); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [nextStory, prevStory, closeStoryViewer, setIsStoryPaused]);

  // Reset on story change
  useEffect(() => {
    setStoryProgress(0);
    storyProgressRef.current = 0;
    setStoryMediaLoaded(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const currentStory = activeStoryGroup?.stories?.[activeStoryIndex];
    const isVideo = currentStory?.mediaType === 'video';

    if (!isVideo && currentStory?.song?.audioUrl) {
      AudioManager.stopAll();
      const audio = new Audio(currentStory.song.audioUrl);
      audio.loop = true;
      audio.currentTime = 0;
      // Initialize with current mute state, updated by another effect
      audio.muted = isStoryMuted; 
      AudioManager.play('story-preview', audio, { source: 'story' });
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [activeStoryGroup, activeStoryIndex]);

  // Handle mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isStoryMuted;
      // If unmuted and it was previously blocked from playing (paused), try playing again
      if (!isStoryMuted && !isStoryPaused && isTabActive && audioRef.current.paused) {
        AudioManager.play('story-preview', audioRef.current, { source: 'story' });
      }
    }
  }, [isStoryMuted, isStoryPaused, isTabActive]);

  // Handle pause/resume for programmatic audio when state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isStoryPaused || !isTabActive) {
        audioRef.current.pause();
      } else {
        AudioManager.play('story-preview', audioRef.current, { source: 'story' });
      }
    }
  }, [isStoryPaused, isTabActive]);

  // Progress ticker
  useEffect(() => {
    if (!activeStoryGroup || isStoryPaused || !storyMediaLoaded || !isTabActive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const IMAGE_STORY_DURATION = 30000;
    const isVideo = activeStoryGroup.stories[activeStoryIndex]?.mediaType === 'video';
    const duration = isVideo
      ? (videoRef.current?.duration ? videoRef.current.duration * 1000 : 15000)
      : IMAGE_STORY_DURATION;
    let lastTime = Date.now();

    const tick = () => {
      const now = Date.now();
      storyProgressRef.current += ((now - lastTime) / duration) * 100;
      lastTime = now;
      if (storyProgressRef.current >= 100) {
        storyProgressRef.current = 100;
        setStoryProgress(100);
        nextStory();
      } else {
        setStoryProgress(storyProgressRef.current);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [activeStoryGroup, activeStoryIndex, isStoryPaused, storyMediaLoaded, isTabActive, nextStory]);

  const handlePointerDown = useCallback((e) => {
    pointerDownTime.current = Date.now();
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    setIsStoryPaused(true);
    videoRef.current?.pause();
    audioRef.current?.pause();
  }, [setIsStoryPaused]);

  const handlePointerUp = useCallback((e, direction) => {
    setIsStoryPaused(false);
    if (videoRef.current && isTabActive) videoRef.current.play().catch(() => {});
    if (audioRef.current && isTabActive) AudioManager.play('story-preview', audioRef.current, { source: 'story' });
    const dx = Math.abs(e.clientX - pointerStartPos.current.x);
    const dy = Math.abs(e.clientY - pointerStartPos.current.y);
    if (dx > 20 || dy > 20) return;
    if (Date.now() - pointerDownTime.current < 250) {
      if (direction === 'prev') prevStory();
      else if (direction === 'next') nextStory();
    }
  }, [setIsStoryPaused, isTabActive, prevStory, nextStory]);

  const handleDragEnd = useCallback((_, info) => {
    const { offset, velocity } = info;
    if (offset.y > 50 || velocity.y > 500) closeStoryViewer();
    else if (offset.x > 50 || velocity.x > 500) prevStory();
    else if (offset.x < -50 || velocity.x < -500) nextStory();
  }, [closeStoryViewer, prevStory, nextStory]);

  if (!activeStoryGroup) return null;

  const currentStory = activeStoryGroup.stories[activeStoryIndex];
  const isVideo = currentStory?.mediaType === 'video';
  const mediaUrl = currentStory?.media;
  const isOwnStory = String(activeStoryGroup.userId) === String(myUserId);
  const totalStories = activeStoryGroup.stories?.length ?? 1;

  useEffect(() => {
    if (currentStory) {
      console.log("FETCHED STORY STICKERS:", currentStory.stickers);
    }
  }, [currentStory]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Prev / Next ghost buttons for desktop */}
      <button
        onClick={prevStory}
        className="hidden sm:flex absolute left-4 z-50 w-10 h-10 items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all backdrop-blur-sm"
        aria-label="Previous story"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextStory}
        className="hidden sm:flex absolute right-4 z-50 w-10 h-10 items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all backdrop-blur-sm"
        aria-label="Next story"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <motion.div
        drag
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        dragElastic={0.35}
        onDragEnd={handleDragEnd}
        className="relative w-full h-full max-w-[430px] mx-auto sm:h-[95vh] sm:rounded-[36px] overflow-hidden bg-black flex flex-col shadow-2xl ring-1 ring-white/10"
      >
        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 z-40 flex gap-1">
          {activeStoryGroup.stories?.map((st, idx) => (
            <div
              key={st._id}
              className="h-[3px] flex-1 bg-white/25 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    idx < activeStoryIndex
                      ? '100%'
                      : idx === activeStoryIndex
                      ? `${storyProgress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 inset-x-3 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500 shrink-0">
              <div className="w-full h-full rounded-full border-[1.5px] border-black overflow-hidden bg-zinc-800">
                <img
                  src={getAvatarUrl(activeStoryGroup.userPic, null, activeStoryGroup.userName)}
                  alt={activeStoryGroup.userName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeStoryGroup.userName || 'Explorer')}&background=6C4DF6&color=fff&bold=true`;
                  }}
                />
              </div>
            </div>
            <div style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
              <h4 className="text-[13px] font-bold text-white leading-none flex items-center gap-1">
                {activeStoryGroup.userName}

              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/70 font-medium flex items-center gap-1.5">
                  <span>{moment(currentStory?.createdAt).fromNow()}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span className="text-white/90">
                    {(() => {
                      const expiresAt = moment(currentStory?.createdAt).add(24, 'hours');
                      const now = moment();
                      const diffHours = expiresAt.diff(now, 'hours');
                      if (diffHours > 0) return `${diffHours}h remaining`;
                      const diffMinutes = expiresAt.diff(now, 'minutes');
                      if (diffMinutes > 0) return `${diffMinutes}m remaining`;
                      return "Expiring soon";
                    })()}
                  </span>
                </span>
                {currentStory?.visibility && (
                  <span className="text-[9px] font-bold text-white/90 flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm border border-white/20">
                    {currentStory.visibility === 'public' ? '🌍 Public' : currentStory.visibility === 'friends' ? '👥 Friends' : '🔒 Private'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={closeStoryViewer}
            className="w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 border border-white/10 rounded-full text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-20 touch-none select-none" onPointerDown={handlePointerDown} onPointerUp={(e) => handlePointerUp(e, 'prev')} onPointerCancel={() => setIsStoryPaused(false)} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-20 touch-none select-none" onPointerDown={handlePointerDown} onPointerUp={(e) => handlePointerUp(e, 'next')} onPointerCancel={() => setIsStoryPaused(false)} />
        <div className="absolute inset-y-0 left-1/3 right-1/3 z-20 touch-none select-none" onPointerDown={handlePointerDown} onPointerUp={(e) => handlePointerUp(e, 'none')} onPointerCancel={() => setIsStoryPaused(false)} />

        {/* Media */}
        <div className="w-full h-full flex items-center justify-center relative bg-black">
          {!storyMediaLoaded && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
          )}

          {/* Ambient bg */}
          {mediaUrl && (
            <div className="absolute inset-0 z-0 overflow-hidden opacity-25" aria-hidden>
              {isVideo ? (
                <video src={mediaUrl} muted loop className="w-full h-full object-cover blur-[40px] scale-110 brightness-50" />
              ) : (
                <img src={mediaUrl} alt="" className="w-full h-full object-cover blur-[40px] scale-110 brightness-50" />
              )}
            </div>
          )}

          {/* Main media */}
          <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
            {isVideo ? (
              <video
                ref={videoRef}
                src={mediaUrl}
                autoPlay
                loop={false}
                muted={isStoryMuted}
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => setStoryMediaLoaded(true)}
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
                onLoad={() => setStoryMediaLoaded(true)}
              />
            )}
          </div>

          {/* Music tag */}
          <AnimatePresence>
            {storyMediaLoaded && currentStory?.song && !currentStory?.stickers?.some(s => s.type === 'music') && (
              <motion.div
                drag={isOwnStory}
                dragConstraints={{ top: 0, left: 0, right: 200, bottom: 600 }}
                dragElastic={0.2}
                onDragStart={(e) => e.stopPropagation()}
                initial={{ scale: 0.85, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className={`absolute top-20 left-4 bg-black/50 backdrop-blur-xl border border-white/20 text-white px-3 py-1.5 rounded-2xl flex items-center gap-2 max-w-[180px] z-[60] shadow-lg ${isOwnStory ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
              >
                <Music className="w-3 h-3 text-rose-400 shrink-0" />
                <div className="overflow-hidden min-w-0">
                  <p className="text-[11px] font-bold truncate">{currentStory.song.songTitle}</p>
                  <p className="text-[9px] text-white/60 truncate">{currentStory.song.artistName}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mute button */}
          {(isVideo || currentStory?.song) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsStoryMuted((m) => !m);
                // Synchronously call play() in the event handler to satisfy iOS Safari autoplay policies
                if (isStoryMuted && audioRef.current && audioRef.current.paused) {
                  audioRef.current.play().catch(() => {});
                }
              }}
              className="absolute top-20 right-4 z-40 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-white transition-colors"
              aria-label={isStoryMuted ? 'Unmute' : 'Mute'}
            >
              {isStoryMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Stickers & Legacy Caption */}
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            <AnimatePresence mode="wait">
              {storyMediaLoaded && currentStory?.stickers?.length > 0 ? (
                currentStory.stickers.map((sticker, idx) => (
                  <StorySticker key={sticker.id || sticker._id || idx} sticker={sticker} mode="viewer" />
                ))
              ) : (
                /* Legacy Caption Fallback */
                storyMediaLoaded && currentStory?.caption && (
                  <motion.div
                    key={activeStoryIndex + "-legacy"}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
                    className={`absolute w-full px-5 text-center font-black text-xl z-30 tracking-tight pointer-events-none leading-snug
                      ${currentStory.captionPosition === 'top' ? 'top-32' : currentStory.captionPosition === 'bottom' ? 'bottom-32' : 'top-1/2 -translate-y-1/2'}
                      ${currentStory.captionColor === 'black' ? 'text-black' : currentStory.captionColor === 'purple' ? 'text-purple-400' : 'text-white'}`}
                    style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
                  >
                    {currentStory.caption}
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pt-10 pb-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none">
          {!isOwnStory ? (
            <div className="pointer-events-auto flex flex-col gap-3 w-full">
              {/* Reactions */}
              <div className="flex justify-center gap-3">
                {['❤️', '🔥', '😍', '😂', '🌍'].map((emoji, i) => (
                  <motion.button
                    key={emoji}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, type: 'spring' }}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.2, y: -4 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleStoryReaction(emoji); }}
                    className="text-2xl min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full"
                    aria-label={`React ${emoji}`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
              {/* Reply */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsStoryPaused(true); setReportModal({ isOpen: true }); }}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-rose-500/80 text-white border border-white/20 rounded-full transition-all shrink-0"
                  aria-label="Report Story"
                  title="Report Story"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={storyReplyText}
                  onChange={(e) => setStoryReplyText(e.target.value)}
                  placeholder={`Reply to ${activeStoryGroup.userName.split(' ')[0]}...`}
                  className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full pl-4 pr-4 py-2.5 text-[13px] text-white placeholder:text-white/50 outline-none focus:bg-white/15 focus:border-white/35 transition-all min-h-[40px]"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => { if (e.key === 'Enter' && storyReplyText.trim()) handleStoryReply(); }}
                  aria-label="Reply to story"
                />
                <button
                  onClick={handleStoryReply}
                  disabled={replyingToStory || !storyReplyText.trim()}
                  className="w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-rose-500 to-indigo-500 text-white rounded-full disabled:opacity-40 transition-all shrink-0"
                  aria-label="Send"
                >
                  {replyingToStory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="pointer-events-auto flex items-center justify-between w-full">
              <button
                onClick={(e) => { e.stopPropagation(); setShowViewersList(true); setIsStoryPaused(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-[12px] font-semibold transition-all backdrop-blur-sm"
                aria-label="View viewers"
              >
                👁️ <span>{currentStory?.viewers?.length > 0 ? `${currentStory.viewers.length} Views` : "No views"}</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsStoryPaused(true);
                    const { value: newCaption } = await Swal.fire({
                      title: 'Edit Caption',
                      input: 'text',
                      inputValue: currentStory?.caption || '',
                      inputPlaceholder: 'Enter your caption...',
                      showCancelButton: true,
                      confirmButtonColor: '#6C4DF6',
                      cancelButtonColor: '#ef4444',
                      confirmButtonText: 'Save',
                      background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
                      color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a',
                      customClass: {
                        popup: 'rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700',
                        title: 'text-xl font-black text-slate-800 dark:text-white',
                        input: 'rounded-xl border-slate-200 dark:border-slate-600 focus:border-[#6C4DF6] focus:ring-[#6C4DF6]',
                        confirmButton: 'rounded-xl font-bold px-6 py-2.5',
                        cancelButton: 'rounded-xl font-bold px-6 py-2.5'
                      }
                    });
                    setIsStoryPaused(false);
                    if (newCaption !== undefined && newCaption !== null && newCaption !== currentStory?.caption) {
                      axios
                        .put(`/social/story/${currentStory._id}`, { caption: newCaption }, { withCredentials: true })
                        .then(() => { showToast.success('Caption updated!'); fetchFeedData?.(); })
                        .catch(() => showToast.error('Failed to update caption'));
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all"
                  aria-label="Edit caption"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteStory(currentStory._id); }}
                  className="w-9 h-9 flex items-center justify-center bg-rose-500/70 hover:bg-rose-500/90 border border-rose-400/40 rounded-full text-white transition-all"
                  aria-label="Delete story"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {reportModal.isOpen && (
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => { setReportModal({ isOpen: false }); setIsStoryPaused(false); }}
          targetId={currentStory?._id}
          targetType="story"
          reportedUserId={activeStoryGroup?.userId}
        />
      )}
    </motion.div>
  );
};

export default StoryViewer;