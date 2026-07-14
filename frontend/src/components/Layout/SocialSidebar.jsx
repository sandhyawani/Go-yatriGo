

//   X,
//   ChevronDown,
//   User,
//   LogOut,
//   Home as HomeIcon,
//   Search,
//   MessageSquare,
//   ChevronRight,
//   PlusSquare,
//   Compass,
//   Bell,
//   Settings,
//   CheckCheck,
//   Heart,
//   UserPlus,
//   Sparkles,
//   MessageSquare as MessageSquareIcon,
//   Navigation,
//   Map,
//   ArrowLeft,
// } from "lucide-react";

// };

//   useEffect(() => {

//             withCredentials: true,
//           });

//             setNotifications(res.data.notifications || []);
//             setUnreadCount(
//               (res.data.notifications || []).filter((n) => !n.isRead).length,
//             );
//           }

//             "/journeys/invitations/my?status=pending",
//             { withCredentials: true },
//           );

//             setJourneyInvitations(invRes.data.invitations || []);
//             setUnreadCount(
//               (prev) => prev + (invRes.data.invitations?.length || 0),
//             );
//           }
//         } catch (e) {}
//       };
//       fetchNotifs();
//     }
//   }, [user]);

//   useEffect(() => {

//         setNotifications((prev) => [newNotif, ...prev]);
//         setUnreadCount((prev) => prev + 1);
//         // Toast logic could go here if global toast isn't already handling it
//       };
//       socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);

//     }
//   }, [socket]);

//   useEffect(() => {

//         setShowNotifPanel(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);

//   }, []);

//   // Helper to group notifications by date

//       (groups, notif) => {

//           groups.today.push(notif);
//         } else if (notifDate.isSameOrAfter(yesterday)) {
//           groups.yesterday.push(notif);
//         } else {
//           groups.earlier.push(notif);
//         }

//       },
//       { today: [], yesterday: [], earlier: [] },
//     );
//   };

//     // Prevent duplicate notification clutter: formal invites are rendered as actionable cards at the top

//         n.type?.includes("journey") ||
//         n.type?.includes("trip") ||
//         n.type?.includes("join")
//       );

//   });

//       setNotifications((prev) => prev?.map((n) => ({ ...n, isRead: true })));
//       setUnreadCount(0);
//     } catch {}
//   };

//   useEffect(() => {

//       setSearchResults(null);

//     }

//       setSearchLoading(true);

//           `/social/search?q=${encodeURIComponent(searchQuery)}`,
//           { withCredentials: true },
//         );

//       } catch (err) {

//       } finally {
//         setSearchLoading(false);
//       }
//     }, 350);

//   }, [searchQuery]);

//     navigate("/login");
//   };

//     `relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group w-full select-none text-[14px] ${
//       isActive
//         ? "bg-primary-600/10 text-primary-600 font-semibold shadow-sm"
//         : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium hover:-translate-y-0.5"
//     }`;

//     `w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-primary-600" : "text-slate-400 group-hover:text-primary-600"}`;

//     e.stopPropagation();

//         `/users/${requesterId}/follow-request/accept`,
//         {},
//         { withCredentials: true },
//       );
//       setNotifications((prev) =>
//         prev.filter(
//           (n) => !(n.type === "follow_request" && n.sender._id === requesterId),
//         ),
//       );
//       showToast.success("Follow request accepted");
//     } catch (err) {
//       showToast.error("Failed to accept request");
//     }
//   };

//     e.stopPropagation();

//         `/users/${requesterId}/follow-request/reject`,
//         {},
//         { withCredentials: true },
//       );
//       setNotifications((prev) =>
//         prev.filter(
//           (n) => !(n.type === "follow_request" && n.sender._id === requesterId),
//         ),
//       );
//     } catch (err) {

//     }
//   };

//     e.stopPropagation();

//         `/chat/direct/${roomId}/accept`,
//         {},
//         { withCredentials: true },
//       );
//       setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
//     } catch (err) {

//     }
//   };

//     e.stopPropagation();

//         `/chat/direct/${roomId}/decline`,
//         {},
//         { withCredentials: true },
//       );
//       setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
//     } catch (err) {

//     }
//   };

//     e.stopPropagation();

//         `/social/buddy/manage-request/${groupId}`,
//         { requestId, status: "Approved" },
//         { withCredentials: true },
//       );
//       setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
//     } catch (err) {

//     }
//   };

//     e.stopPropagation();

//         `/social/buddy/manage-request/${groupId}`,
//         { requestId, status: "Rejected" },
//         { withCredentials: true },
//       );
//       setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
//     } catch (err) {

//     }
//   };

//       n.type === "follow" ||
//       n.type === "new_follower" ||
//       n.type === "follow_accept" ||
//       n.type === "follow_request"
//     ) {

//     } else if (
//       n.type === "group_joined" ||
//       n.type === "trip_cancelled" ||
//       n.type === "group" ||
//       n.type === "join_request"
//     ) {

//     } else if (
//       n.type === "new_message" ||
//       n.type === "message_request" ||
//       n.type === "direct"
//     ) {
//       navigate(`/social/chat`);
//     } else {
//       navigate("/");
//     }

//           `/notifications/${n._id}/read`,
//           {},
//           { withCredentials: true },
//         );
//         setNotifications((prev) =>
//           prev.map((notif) =>
//             notif._id === n._id ? { ...notif, isRead: true } : notif,
//           ),
//         );
//         setUnreadCount((prev) => Math.max(0, prev - 1));
//       } catch (err) {

//       }
//     }
//     setShowNotifPanel(false);
//   };

//     <>
//       {/* ðŸ’» DESKTOP SIDEBAR ðŸ’» */}
//       <nav className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-white/80 backdrop-blur-xl border-r border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)] z-40 py-4 px-3 justify-between transition-colors duration-300">
//         {/* Top section */}
//         <div className="flex flex-col gap-0.5">
//           {/* Logo */}
//           <Link
//             to="/"
//             className="flex items-center gap-2.5 px-3 py-2 mb-2 group"
//           >
//             <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-primary-700 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-600/30 shrink-0 group-hover:-rotate-[8deg] group-hover:scale-105 transition-all duration-300 overflow-hidden">
//               <div className="absolute top-[-2px] right-[-2px] w-5 h-5 bg-white/30 rounded-full blur-[3px]"></div>
//               <div className="absolute bottom-[-4px] left-[-4px] w-4 h-4 bg-black/10 rounded-full blur-[2px]"></div>
//               <span className="relative z-10 text-white font-extrabold text-[15px] tracking-tighter flex items-center drop-shadow-sm">
//                 G<span className="text-[#FFD166] -ml-[1.5px] mt-[2px]">Y</span>
//               </span>
//             </div>
//             <span className="text-[17px] font-semibold tracking-tight text-slate-900 truncate">
//               Go YatriGo<span className="text-primary-600">.</span>
//             </span>
//           </Link>

//           {/* Nav Links */}
//           <Link to="/" className={navItemClass(location.pathname === "/")}>
//             <HomeIcon className={iconClass(location.pathname === "/")} />
//             Home
//           </Link>

//           <button
//             onClick={() => setIsSearchOpen(true)}
//             className={navItemClass(false)}
//           >
//             <Search className={iconClass(false)} />
//             Search
//           </button>

//           <Link
//             to="/social/buddy"
//             className={navItemClass(
//               location.pathname.startsWith("/social/buddy"),
//             )}
//           >
//             <Compass
//               className={iconClass(
//                 location.pathname.startsWith("/social/buddy"),
//               )}
//             />
//             Explore
//           </Link>

//           <Link
//             to="/social/journeys"
//             className={navItemClass(
//               location.pathname.startsWith("/social/journeys"),
//             )}
//           >
//             <Navigation
//               className={iconClass(
//                 location.pathname.startsWith("/social/journeys"),
//               )}
//             />
//             Journeys
//           </Link>

//           <Link
//             to="/social/chat"
//             className={navItemClass(
//               location.pathname.startsWith("/social/chat"),
//             )}
//           >
//             <MessageSquare
//               className={iconClass(
//                 location.pathname.startsWith("/social/chat"),
//               )}
//             />
//             Messages
//           </Link>

//           {/* Notifications */}
//           <div ref={notifRef} className="relative w-full">
//             <button
//               onClick={() => {
//                 setShowNotifPanel((prev) => !prev);

//               }}
//               className={navItemClass(showNotifPanel)}
//             >
//               <Bell className={iconClass(showNotifPanel)} />
//               <span className="flex-1 text-left">Notifications</span>
//               {unreadCount > 0 && (
//                 <span className="w-4.5 h-4.5 min-w-[18px] bg-[#FF5A7A] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
//                   {unreadCount > 9 ? "9+" : unreadCount}
//                 </span>
//               )}
//             </button>

//             <AnimatePresence>
//               {showNotifPanel && (
//                 <motion.div
//                   initial={{ opacity: 0, x: -8, scale: 0.97 }}
//                   animate={{ opacity: 1, x: 0, scale: 1 }}
//                   exit={{ opacity: 0, x: -8, scale: 0.97 }}
//                   transition={{ type: "spring", stiffness: 420, damping: 28 }}
//                   className="fixed top-4 left-[252px] w-[460px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-100 z-50 overflow-hidden"
//                 >
//                   <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
//                     <h3 className="text-base font-bold text-slate-900">
//                       Notifications
//                     </h3>
//                     {unreadCount > 0 && (
//                       <button
//                         onClick={handleMarkAllRead}
//                         className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-600/10 hover:bg-primary-600/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
//                       >
//                         <CheckCheck className="w-3.5 h-3.5" /> Mark all read
//                       </button>
//                     )}
//                   </div>

//                   <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100 overflow-x-auto shrink-0 select-none">
//                     {["All", "Journey", "Social", "Messages", "Safety"].map(
//                       (cat) => (
//                         <button
//                           key={cat}
//                           onClick={() => setNotifCategory(cat)}
//                           className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
//                             notifCategory === cat
//                               ? "bg-primary-600 text-white shadow-xs"
//                               : "bg-white text-slate-600 hover:bg-brand-100/60 border border-slate-200/80"
//                           }`}
//                         >
//                           {cat}{" "}
//                           {cat === "Journey" && journeyInvitations.length > 0
//                             ? `(${journeyInvitations.length})`
//                             : ""}
//                         </button>
//                       ),
//                     )}
//                   </div>

//                   <div className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-brand-200 hover:scrollbar-thumb-brand-300 scrollbar-track-transparent flex-1">
//                     {(notifCategory === "All" || notifCategory === "Journey") &&
//                       journeyInvitations.length > 0 && (
//                         <div className="p-4 bg-brand-50/60 border-b border-brand-100 space-y-3">
//                           <span className="text-[10px] font-black uppercase text-primary-600 tracking-wider block px-1">
//                             Official Journey Invitations
//                           </span>
//                           {journeyInvitations.map((inv) => (
//                             <JourneyInvitationCard
//                               key={inv._id}
//                               invitation={inv}
//                               onAction={(id) =>
//                                 setJourneyInvitations((prev) =>
//                                   prev.filter((i) => i._id !== id),
//                                 )
//                               }
//                             />
//                           ))}
//                         </div>
//                       )}

//                     {filteredNotifications.length === 0 &&
//                     ((notifCategory !== "Journey" && notifCategory !== "All") ||
//                       journeyInvitations.length === 0) ? (
//                       <div className="py-16 text-center flex flex-col items-center gap-3">
//                         <div className="w-16 h-16 bg-primary-600/5 rounded-full flex items-center justify-center">
//                           <Bell className="w-8 h-8 text-primary-600/40" />
//                         </div>
//                         <p className="text-sm text-slate-500 font-bold">
//                           No new travel updates in {notifCategory} âœˆï¸
//                         </p>
//                       </div>
//                     ) : (
//                       <div className="flex flex-col">
//                         {/* Group Rendering Helper */}
//                         {[
//                           { title: "Today", items: groupedNotifs.today },
//                           {
//                             title: "Yesterday",
//                             items: groupedNotifs.yesterday,
//                           },
//                           { title: "Earlier", items: groupedNotifs.earlier },
//                         ].map(
//                           (group) =>
//                             group.items.length > 0 && (
//                               <div key={group.title}>
//                                 <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-5 py-2 border-y border-slate-50 mt-1 first:mt-0">
//                                   <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
//                                     {group.title}
//                                   </span>
//                                 </div>
//                                 <div className="flex flex-col">
//                                   <AnimatePresence initial={false}>
//                                     {group.items.map((n) => (
//                                       <motion.div
//                                         key={n._id}
//                                         layout
//                                         initial={{
//                                           opacity: 0,
//                                           y: -20,
//                                           scale: 0.95,
//                                         }}
//                                         animate={{ opacity: 1, y: 0, scale: 1 }}
//                                         transition={{
//                                           duration: 0.3,
//                                           type: "spring",
//                                           bounce: 0.4,
//                                         }}
//                                         onClick={() =>
//                                           handleNotificationClick(n)
//                                         }
//                                         className={`relative flex items-start gap-4 px-5 py-4 transition-all duration-200 cursor-pointer group hover:bg-brand-50 border-b border-slate-50 last:border-b-0 ${
//                                           n.isRead
//                                             ? "bg-white"
//                                             : "bg-brand-50/40"
//                                         }`}
//                                       >
//                                         <div className="relative shrink-0">
//                                           <img
//                                             src={getAvatarUrl(
//                                               n.sender?.pic,
//                                               n.sender?.img,
//                                               n.sender?.name,
//                                             )}
//                                             alt={n.sender?.name}
//                                             className="w-11 h-11 rounded-full object-cover border-[3px] border-white shadow-sm"
//                                             onError={(e) => {
//                                               e.target.onerror = null;
//                                               e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(n.sender?.name || "User")}&background=8b5cf6&color=fff&bold=true`;
//                                             }}
//                                           />
//                                           <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-50">
//                                             {notifIcon(n.type)}
//                                           </div>
//                                         </div>
//                                         <div className="flex-1 min-w-0 pt-0.5">
//                                           <p
//                                             className={`text-[13px] leading-relaxed text-slate-700 ${n.isRead ? "font-normal" : "font-semibold text-slate-900"}`}
//                                           >
//                                             <span className="font-extrabold text-slate-900 mr-1">
//                                               {n.sender?.name}
//                                             </span>
//                                             {n.message
//                                               ?.replace(n.sender?.name, "")
//                                               .trim()}
//                                           </p>
//                                           <p className="text-[11px] text-slate-400 font-medium mt-1 group-hover:text-primary-600 transition-colors">
//                                             {moment(n.createdAt).fromNow()}
//                                           </p>

//                                           {/* Action Buttons for Requests */}
//                                           {n.type === "follow_request" && (
//                                             <div className="flex gap-2 mt-3">
//                                               <button
//                                                 onClick={(e) =>
//                                                   handleAcceptRequest(
//                                                     e,
//                                                     n.sender?._id,
//                                                   )
//                                                 }
//                                                 className="px-4 py-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-lg hover:bg-primary-700 hover:shadow-md transition-all active:scale-95"
//                                               >
//                                                 Accept
//                                               </button>
//                                               <button
//                                                 onClick={(e) =>
//                                                   handleRejectRequest(
//                                                     e,
//                                                     n.sender?._id,
//                                                   )
//                                                 }
//                                                 className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-colors active:scale-95"
//                                               >
//                                                 Reject
//                                               </button>
//                                             </div>
//                                           )}
//                                           {n.type === "message_request" &&
//                                             n.room && (
//                                               <div className="flex gap-2 mt-3">
//                                                 <button
//                                                   onClick={(e) =>
//                                                     handleAcceptMessage(
//                                                       e,
//                                                       n.room,
//                                                       n._id,
//                                                     )
//                                                   }
//                                                   className="px-4 py-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-lg hover:bg-primary-700 hover:shadow-md transition-all active:scale-95"
//                                                 >
//                                                   Accept
//                                                 </button>
//                                                 <button
//                                                   onClick={(e) =>
//                                                     handleRejectMessage(
//                                                       e,
//                                                       n.room,
//                                                       n._id,
//                                                     )
//                                                   }
//                                                   className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-colors active:scale-95"
//                                                 >
//                                                   Reject
//                                                 </button>
//                                               </div>
//                                             )}
//                                           {n.type === "join_request" &&
//                                             n.joinRequest && (
//                                               <div className="flex gap-2 mt-3">
//                                                 <button
//                                                   onClick={(e) =>
//                                                     handleAcceptJoin(
//                                                       e,
//                                                       typeof n.group ===
//                                                         "object"
//                                                         ? n.group._id
//                                                         : n.group,
//                                                       n.joinRequest,
//                                                       n._id,
//                                                     )
//                                                   }
//                                                   className="px-4 py-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-lg hover:bg-primary-700 hover:shadow-md transition-all active:scale-95"
//                                                 >
//                                                   Approve
//                                                 </button>
//                                                 <button
//                                                   onClick={(e) =>
//                                                     handleRejectJoin(
//                                                       e,
//                                                       typeof n.group ===
//                                                         "object"
//                                                         ? n.group._id
//                                                         : n.group,
//                                                       n.joinRequest,
//                                                       n._id,
//                                                     )
//                                                   }
//                                                   className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-colors active:scale-95"
//                                                 >
//                                                   Decline
//                                                 </button>
//                                               </div>
//                                             )}
//                                         </div>
//                                         {!n.isRead && (
//                                           <div className="shrink-0 pt-2">
//                                             <div className="w-2.5 h-2.5 bg-primary-600 rounded-full shadow-[0_0_8px_rgba(108,77,246,0.5)]" />
//                                           </div>
//                                         )}
//                                       </motion.div>
//                                     ))}
//                                   </AnimatePresence>
//                                 </div>
//                               </div>
//                             ),
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>

//           {/* Create Dropdown */}
//           <Menu as="div" className="relative w-full">
//             <Menu.Button className="w-full flex items-center justify-center gap-2 px-3 py-3 my-4 rounded-xl bg-gradient-to-r from-brand-500 to-primary-600 text-white font-bold text-[13.5px] shadow-[0_10px_30px_rgba(124,58,237,0.25)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.35)] hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all duration-300">
//               <PlusSquare className="w-4 h-4" />
//               Create
//             </Menu.Button>
//             <Transition
//               as={Fragment}
//               enter="transition ease-out duration-200"
//               enterFrom="opacity-0 scale-95 translate-y-4"
//               enterTo="opacity-100 scale-100 translate-y-0"
//               leave="transition ease-in duration-150"
//               leaveFrom="opacity-100 scale-100 translate-y-0"
//               leaveTo="opacity-0 scale-95 translate-y-4"
//             >
//               <Menu.Items className="absolute left-[calc(100%+16px)] bottom-0 w-[240px] bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] z-50 focus:outline-none p-2 origin-bottom-left">
//                 {/* Arrow indicator */}
//                 <div className="absolute -left-2 bottom-[14px] w-4 h-4 bg-white border-l border-b border-slate-100 transform rotate-45 rounded-sm" />
//                 <div className="space-y-1 relative z-10">
//                   <Menu.Item>
//                     {({ active }) => (
//                       <button
//                         onClick={() => setIsCreateStoryOpen(true)}
//                         className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active ? "bg-brand-50 scale-[1.01]" : "bg-transparent"}`}
//                       >
//                         <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
//                           <PlusSquare className="w-4.5 h-4.5" />
//                         </div>
//                         <div>
//                           <p className="text-[13px] font-extrabold text-slate-800">
//                             Create Story
//                           </p>
//                           <p className="text-[10px] text-slate-500 font-medium">
//                             Share moments for 24h
//                           </p>
//                         </div>
//                       </button>
//                     )}
//                   </Menu.Item>
//                   <Menu.Item>
//                     {({ active }) => (
//                       <button
//                         onClick={() => setIsCreatePostOpen(true)}
//                         className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active ? "bg-brand-50 scale-[1.01]" : "bg-transparent"}`}
//                       >
//                         <div className="w-9 h-9 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-600 shrink-0">
//                           <PlusSquare className="w-4.5 h-4.5" />
//                         </div>
//                         <div>
//                           <p className="text-[13px] font-extrabold text-slate-800">
//                             Post a Memory
//                           </p>
//                           <p className="text-[10px] text-slate-500 font-medium">
//                             Share travel photos
//                           </p>
//                         </div>
//                       </button>
//                     )}
//                   </Menu.Item>
//                   <Menu.Item>
//                     {({ active }) => (
//                       <Link
//                         to="/social/buddy/new"
//                         className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active ? "bg-brand-50 scale-[1.01]" : "bg-transparent"}`}
//                       >
//                         <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
//                           <Compass className="w-4.5 h-4.5" />
//                         </div>
//                         <div>
//                           <p className="text-[13px] font-extrabold text-slate-800">
//                             Create Trip Group
//                           </p>
//                           <p className="text-[10px] text-slate-500 font-medium">
//                             Host a travel squad
//                           </p>
//                         </div>
//                       </Link>
//                     )}
//                   </Menu.Item>
//                   <Menu.Item disabled>
//                     {() => (
//                       <div className="flex items-center gap-3 px-3 py-3 rounded-xl opacity-60 cursor-not-allowed">
//                         <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 shrink-0">
//                           <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
//                         </div>
//                         <div className="flex-1">
//                           <p className="text-[13px] font-extrabold text-slate-800 flex items-center justify-between">
//                             Go Live
//                             <span className="px-2 py-0.5 bg-brand-100 text-brand-600 text-[9px] font-bold uppercase rounded-full tracking-wider">
//                               Soon
//                             </span>
//                           </p>
//                           <p className="text-[10px] text-slate-500 font-medium">
//                             Broadcast to followers
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </Menu.Item>
//                 </div>
//               </Menu.Items>
//             </Transition>
//           </Menu>

//           <Link
//             to="/profile"
//             className={navItemClass(location.pathname === "/profile")}
//           >
//             <User className={iconClass(location.pathname === "/profile")} />
//             Profile
//           </Link>
//         </div>

//         {/* Bottom User Area */}
//         <div className="border-t border-slate-100 mt-2 pt-2">
//           {user ? (
//             <ProfileMenu />
//           ) : (
//             <div className="flex flex-col gap-2">
//               <Link
//                 to="/login"
//                 className="btn-secondary py-2 px-4 text-center text-sm font-semibold"
//               >
//                 Sign In
//               </Link>
//               <Link
//                 to="/register"
//                 className="btn-primary py-2 px-4 text-center text-sm font-semibold"
//               >
//                 Sign Up
//               </Link>
//             </div>
//           )}
//         </div>
//       </nav>

//       {/* mobile top header â€” hidden on full-screen focused routes */}
//       {(() => {

//           /^\/social\/chat\/.+/.test(path) ||
//           path.startsWith("/social/buddy/new") ||
//           path.startsWith("/social/buddy/edit") ||
//           path.startsWith("/social/journey/") ||
//           path.startsWith("/updateProfile");

//           <div className="lg:hidden sticky top-0 bg-white/95 backdrop-blur-md z-[990] px-4 h-12 border-b border-slate-100 flex justify-between items-center">
//             {location.pathname.startsWith("/settings/") ? (
//               <Link
//                 to="/settings"
//                 className="flex items-center gap-2 text-slate-800 font-extrabold text-[15px] hover:text-brand-600 transition-colors"
//               >
//                 <ArrowLeft className="w-5 h-5 text-brand-600" />
//                 <span>Settings</span>
//               </Link>
//             ) : (
//               <Link to="/" className="flex items-center gap-2">
//                 <div className="relative w-7 h-7 rounded-[10px] bg-gradient-to-br from-primary-700 to-primary-400 flex items-center justify-center shadow-md shadow-primary-600/30 overflow-hidden">
//                   <div className="absolute top-[-2px] right-[-2px] w-4 h-4 bg-white/30 rounded-full blur-[2px]"></div>
//                   <span className="relative z-10 text-white font-extrabold text-[13px] tracking-tighter flex items-center drop-shadow-sm">
//                     G<span className="text-[#FFD166] -ml-[1px] mt-[1px]">Y</span>
//                   </span>
//                 </div>
//                 <span className="text-[17px] font-black tracking-tight text-slate-900">
//                   Go YatriGo.
//                 </span>
//               </Link>
//             )}
//             <div className="flex items-center gap-1">
//               <button
//                 onClick={() => setIsSearchOpen(true)}
//                 className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
//               >
//                 <Search className="w-4.5 h-4.5" />
//               </button>
//               {user && (
//                 <>
//                   <Link
//                     to="/social/journeys"
//                     aria-label="Journeys"
//                     className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${
//                       location.pathname.startsWith("/social/journeys")
//                         ? "text-primary-600"
//                         : "text-slate-500"
//                     }`}
//                   >
//                     <Map className="w-4.5 h-4.5" />
//                   </Link>
//                   <button
//                     onClick={() => {
//                       setShowNotifPanel((prev) => !prev);

//                     }}
//                     className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
//                   >
//                     <Bell className="w-4.5 h-4.5" />
//                     {unreadCount > 0 && (
//                       <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-[#FF5A7A] text-white text-[7px] font-black rounded-full flex items-center justify-center">
//                         {unreadCount > 9 ? "9+" : unreadCount}
//                       </span>
//                     )}
//                   </button>
//                   <Link
//                     to="/settings"
//                     aria-label="Settings"
//                     className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
//                   >
//                     <Settings className="w-4.5 h-4.5" />
//                   </Link>
//                 </>
//               )}
//             </div>
//           </div>
//         );
//       })()}

//       {/* mobile bottom nav â€” hidden on full-screen focused routes like individual chat, settings pages, trip creation, etc. */}
//       {user && (() => {

//         // Hide on any route where the user is doing a focused task

//           // Inside a specific chat room (e.g. /social/chat/roomId)
//           /^\/social\/chat\/.+/.test(path) ||
//           // Settings sub-pages
//           path.startsWith("/settings/") ||
//           // Trip creation / edit
//           path.startsWith("/social/buddy/new") ||
//           path.startsWith("/social/buddy/edit") ||
//           // Journey workspace
//           path.startsWith("/social/journey/") ||
//           // Update profile
//           path.startsWith("/updateProfile");

//           <nav id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] z-[990] h-16 flex justify-around items-center px-1 pb-safe">
//             <Link
//               to="/"
//               className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
//                 location.pathname === "/"
//                   ? "text-primary-600"
//                   : "text-slate-400 hover:text-slate-600"
//               }`}
//             >
//               <HomeIcon className="w-5 h-5" />
//               <span className="text-[9px] font-bold leading-none">Home</span>
//             </Link>

//             <Link
//               to="/social/buddy"
//               className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
//                 location.pathname.startsWith("/social/buddy")
//                   ? "text-primary-600"
//                   : "text-slate-400 hover:text-slate-600"
//               }`}
//             >
//               <Compass className="w-5 h-5" />
//               <span className="text-[9px] font-bold leading-none">Explore</span>
//             </Link>

//             {/* FAB Create */}
//             <button
//               onClick={() => setIsOpen(true)}
//               className="flex flex-col items-center justify-center gap-0.5 px-2 py-1"
//             >
//               <div className="p-1.5 bg-gradient-to-r from-brand-500 to-primary-600 text-white rounded-xl shadow-md shadow-primary-600/25 active:scale-95 transition-transform">
//                 <PlusSquare className="w-5 h-5" />
//               </div>
//               <span className="text-[9px] font-bold leading-none text-slate-400">Create</span>
//             </button>

//             <Link
//               to="/social/chat"
//               className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
//                 location.pathname.startsWith("/social/chat")
//                   ? "text-primary-600"
//                   : "text-slate-400 hover:text-slate-600"
//               }`}
//             >
//               <MessageSquare className="w-5 h-5" />
//               <span className="text-[9px] font-bold leading-none">Messages</span>
//             </Link>

//             <Link
//               to="/profile"
//               className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
//                 location.pathname === "/profile"
//                   ? "text-primary-600"
//                   : "text-slate-400 hover:text-slate-600"
//               }`}
//             >
//               <User className="w-5 h-5" />
//               <span className="text-[9px] font-bold leading-none">Profile</span>
//             </Link>
//           </nav>
//         );
//       })()}

//       {/* Mobile Create Sheet */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             key="mobile-create-backdrop"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setIsOpen(false)}
//             className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm lg:hidden"
//           />
//         )}
//         {isOpen && (
//           <motion.div
//             key="mobile-create-sheet"
//             initial={{ y: "100%" }}
//             animate={{ y: 0 }}
//             exit={{ y: "100%" }}
//             transition={{ type: "spring", stiffness: 320, damping: 30 }}
//             className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-2xl shadow-2xl lg:hidden pb-safe"
//           >
//             <div className="p-5">
//               <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
//               <h3 className="text-base font-bold text-slate-800 mb-3">
//                 Create New
//               </h3>
//               <div className="space-y-2">
//                 <button
//                   onClick={() => {
//                     setIsOpen(false);
//                     setIsCreateStoryOpen(true);
//                   }}
//                   className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
//                 >
//                   <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-500">
//                     <PlusSquare className="w-4.5 h-4.5" />
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-slate-800">
//                       Create Story
//                     </p>
//                     <p className="text-[11px] text-slate-500">
//                       Share moments for 24h
//                     </p>
//                   </div>
//                 </button>
//                 <button
//                   onClick={() => {
//                     setIsOpen(false);
//                     setIsCreatePostOpen(true);
//                   }}
//                   className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
//                 >
//                   <div className="p-2.5 bg-primary-600/10 rounded-lg text-primary-600">
//                     <PlusSquare className="w-4.5 h-4.5" />
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-slate-800">
//                       Post a Memory
//                     </p>
//                     <p className="text-[11px] text-slate-500">
//                       Share your travel photos
//                     </p>
//                   </div>
//                 </button>
//                 <Link
//                   to="/social/buddy/new"
//                   onClick={() => setIsOpen(false)}
//                   className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
//                 >
//                   <div className="p-2.5 bg-amber-50 rounded-lg text-amber-500">
//                     <Compass className="w-4.5 h-4.5" />
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-slate-800">
//                       Create a Trip
//                     </p>
//                     <p className="text-[11px] text-slate-500">
//                       Host a travel squad
//                     </p>
//                   </div>
//                 </Link>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Search Drawer */}
//       <AnimatePresence>
//         {isSearchOpen && (
//           <motion.div
//             key="search-drawer-backdrop"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setIsSearchOpen(false)}
//             className="fixed inset-0 z-[1000] bg-slate-900/20 backdrop-blur-[2px]"
//           />
//         )}
//         {isSearchOpen && (
//           <motion.div
//             key="search-drawer-content"
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", stiffness: 320, damping: 30 }}
//             className="fixed right-0 top-0 bottom-0 z-[1001] w-full lg:w-[380px] lg:max-w-sm bg-white lg:border-l lg:border-slate-100 shadow-2xl flex flex-col"
//           >
//             {/* Header */}
//             <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
//               <div>
//                 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
//                   <Search className="w-4 h-4 text-primary-600" /> Search
//                 </h3>
//                 <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
//                   Travelers Â· Trips Â· Memories
//                 </p>
//               </div>
//               <button
//                 onClick={() => setIsSearchOpen(false)}
//                 className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             {/* Input */}
//             <div className="px-5 py-3 border-b border-slate-50 shrink-0">
//               <div className="relative">
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}

//                   className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-primary-600/50 focus:bg-white focus:shadow-[0_2px_8px_rgba(108,77,246,0.08)] transition-all"
//                   autoFocus
//                 />
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
//                 {searchQuery && (
//                   <button
//                     onClick={() => setSearchQuery("")}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
//                   >
//                     Clear
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Tabs */}
//             <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-50 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden">
//               {["all", "travelers", "groups", "posts"].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setSearchTab(tab)}
//                   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${searchTab === tab ? "bg-primary-600 text-white shadow-sm shadow-primary-600/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
//                 >
//                   {tab}
//                 </button>
//               ))}
//             </div>

//             {/* Results */}
//             <div className="flex-1 overflow-y-auto p-5 space-y-5">
//               {searchLoading ? (
//                 <div className="space-y-4">
//                   {[1, 2, 3, 4].map((i) => (
//                     <div
//                       key={i}
//                       className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse border border-slate-100/50"
//                     >
//                       <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
//                       <div className="flex-1 space-y-2">
//                         <div className="h-3 bg-slate-200 rounded w-1/2" />
//                         <div className="h-2 bg-slate-100 rounded w-1/3" />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : !searchQuery ? (
//                 <div className="text-center py-14 flex flex-col items-center gap-2">
//                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
//                     <Search className="w-5 h-5 text-slate-300" />
//                   </div>
//                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
//                     Start exploring
//                   </p>
//                   <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto leading-relaxed text-center">
//                     Search destinations, travelers, groups, or tags
//                   </p>
//                 </div>
//               ) : searchResults ? (
//                 <div className="space-y-5">
//                   {(searchTab === "all" || searchTab === "travelers") && (
//                     <div className="space-y-2">
//                       {searchTab === "all" &&
//                         searchResults.travelers?.length > 0 && (
//                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
//                             Travelers
//                           </span>
//                         )}
//                       {searchResults.travelers?.length > 0 ? (
//                         searchResults.travelers.map((traveler) => (
//                           <div
//                             key={traveler._id}
//                             onClick={() => {
//                               setIsSearchOpen(false);
//                               navigate(`/profile/${traveler._id}`);
//                             }}
//                             className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-primary-600/15 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group"
//                           >
//                             <Avatar
//                               user={traveler}
//                               className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
//                             />
//                             <div className="min-w-0 flex-1">
//                               <h4 className="text-[13px] font-bold text-slate-800 truncate flex items-center gap-1">
//                                 {traveler.name}
//                               </h4>
//                               <span className="text-[10px] text-slate-400 capitalize">
//                                 {traveler.type || "Traveler"}
//                               </span>
//                             </div>
//                             <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 transition-colors" />
//                           </div>
//                         ))
//                       ) : searchTab === "travelers" ? (
//                         <p className="text-xs text-slate-400 text-center py-4">
//                           No travelers found
//                         </p>
//                       ) : null}
//                     </div>
//                   )}

//                   {(searchTab === "all" || searchTab === "groups") && (
//                     <div className="space-y-2">
//                       {searchTab === "all" &&
//                         searchResults.trips?.length > 0 && (
//                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
//                             Active Trips
//                           </span>
//                         )}
//                       {searchResults.trips?.length > 0 ? (
//                         searchResults.trips.map((trip) => (
//                           <div
//                             key={trip._id}
//                             onClick={() => {
//                               setIsSearchOpen(false);
//                               navigate(`/social/buddy/${trip._id}`);
//                             }}
//                             className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-primary-600/15 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group"
//                           >
//                             <div className="w-9 h-9 rounded-lg bg-primary-600/10 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
//                               {trip.destination
//                                 ? trip.destination.substring(0, 2).toUpperCase()
//                                 : "TR"}
//                             </div>
//                             <div className="min-w-0 flex-1">
//                               <h4 className="text-[13px] font-bold text-slate-800 truncate">
//                                 {trip.title}
//                               </h4>
//                               <div className="flex items-center gap-1.5 mt-0.5">
//                                 <span className="text-[8px] bg-primary-600/10 text-primary-600 font-bold px-1.5 py-0.5 rounded">
//                                   {trip.category}
//                                 </span>
//                                 <span className="text-[10px] text-slate-400 truncate">
//                                   â†’ {trip.destination}
//                                 </span>
//                               </div>
//                             </div>
//                             <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 transition-colors" />
//                           </div>
//                         ))
//                       ) : searchTab === "groups" ? (
//                         <p className="text-xs text-slate-400 text-center py-4">
//                           No groups found
//                         </p>
//                       ) : null}
//                     </div>
//                   )}

//                   {(searchTab === "all" || searchTab === "posts") && (
//                     <div className="space-y-2">
//                       {searchTab === "all" &&
//                         searchResults.memories?.length > 0 && (
//                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
//                             Memories
//                           </span>
//                         )}
//                       {searchResults.memories?.length > 0 ? (
//                         searchResults.memories.map((memory) => (
//                           <div
//                             key={memory._id}
//                             onClick={() => {
//                               setIsSearchOpen(false);
//                               navigate(`/`);
//                             }}
//                             className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-primary-600/15 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group"
//                           >
//                             <img
//                               src={memory.image}
//                               alt={memory.title}
//                               className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
//                             />
//                             <div className="min-w-0 flex-1">
//                               <h4 className="text-[13px] font-bold text-slate-800 truncate">
//                                 {memory.title}
//                               </h4>
//                               <p className="text-[10px] text-slate-400 truncate">
//                                 by {memory.userId?.name || "Traveler"}
//                               </p>
//                             </div>
//                             <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 transition-colors" />
//                           </div>
//                         ))
//                       ) : searchTab === "posts" ? (
//                         <p className="text-xs text-slate-400 text-center py-4">
//                           No posts found
//                         </p>
//                       ) : null}
//                     </div>
//                   )}

//                   {searchTab === "all" &&
//                     !searchResults.travelers?.length &&
//                     !searchResults.trips?.length &&
//                     !searchResults.memories?.length && (
//                       <div className="text-center py-14 flex flex-col items-center gap-2">
//                         <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
//                           <Search className="w-5 h-5 text-rose-300" />
//                         </div>
//                         <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">
//                           No results
//                         </p>
//                         <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto text-center">
//                           Nothing matched "{searchQuery}"
//                         </p>
//                       </div>
//                     )}
//                 </div>
//               ) : null}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <CreatePostModal
//         isOpen={isCreatePostOpen}
//         onClose={() => setIsCreatePostOpen(false)}
//         onSuccess={() => window.location.reload()}
//       />

//       <CreateStoryModal
//         isOpen={isCreateStoryOpen}
//         onClose={() => setIsCreateStoryOpen(false)}
//         onSuccess={() => window.location.reload()}
//       />
//     </>
//   );
// };

import React, { Fragment, useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  User,
  LogOut,
  Home as HomeIcon,
  Search,
  MessageSquare,
  ChevronRight,
  PlusSquare,
  Compass,
  Bell,
  Settings,
  CheckCheck,
  Heart,
  UserPlus,
  Sparkles,
  MessageSquare as MessageSquareIcon,
  Navigation,
  Map,
  ArrowLeft,
} from "lucide-react";
import axios from "../../api/axios";
import moment from "moment";
import { getAvatarUrl } from "../../utils/avatar";
import Avatar from "../common/Avatar";
import { AuthContext } from "../../context/authContext";
import CreatePostModal from "../modals/CreatePostModal";
import CreateStoryModal from "../modals/CreateStoryModal";
import ProfileMenu from "../settings/ProfileMenu";
import JourneyInvitationCard from "../journey/JourneyInvitationCard";

import { SocketContext } from "../../context/SocketContext";
import { showToast } from "../../utils/showToast";
import { SOCKET_EVENTS } from "../../constants/socketEvents";

const notifIcon = (type) => {
  if (type === "post_like")
    return <span className="text-sm leading-none">âœ¨</span>;
  if (type === "post_comment")
    return <MessageSquareIcon className="w-3.5 h-3.5 text-brand-600" />;
  if (type === "follow" || type === "new_follower" || type === "follow_request")
    return <UserPlus className="w-3.5 h-3.5 text-success" />;
  if (type === "story_reply")
    return <Sparkles className="w-3.5 h-3.5 text-warning" />;
  if (type === "message_request")
    return <MessageSquare className="w-3.5 h-3.5 text-brand-600" />;
  if (type === "join_request")
    return <Compass className="w-3.5 h-3.5 text-brand-600" />;
  return <Bell className="w-3.5 h-3.5 text-slate-400" />;
};

const SocialSidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  const socket = useContext(SocketContext);
  const [notifications, setNotifications] = useState([]);
  const [journeyInvitations, setJourneyInvitations] = useState([]);
  const [notifCategory, setNotifCategory] = useState("All");
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = React.useRef(null);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await axios.get("/notifications", {
            withCredentials: true,
          });
          if (res.data.success) {
            setNotifications(res.data.notifications || []);
            setUnreadCount(
              (res.data.notifications || []).filter((n) => !n.isRead).length,
            );
          }
          const invRes = await axios.get(
            "/journeys/invitations/my?status=pending",
            { withCredentials: true },
          );
          if (invRes.data?.success) {
            setJourneyInvitations(invRes.data.invitations || []);
            setUnreadCount(
              (prev) => prev + (invRes.data.invitations?.length || 0),
            );
          }
        } catch (e) {}
      };
      fetchNotifs();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };
      socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
      return () => socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    }
  }, [socket]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const groupNotifications = (notifs) => {
    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "days").startOf("day");

    return notifs.reduce(
      (groups, notif) => {
        const notifDate = moment(notif.createdAt);
        if (notifDate.isSameOrAfter(today)) {
          groups.today.push(notif);
        } else if (notifDate.isSameOrAfter(yesterday)) {
          groups.yesterday.push(notif);
        } else {
          groups.earlier.push(notif);
        }
        return groups;
      },
      { today: [], yesterday: [], earlier: [] },
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (n.type === "journey_invitation" || n.type === "trip_invitation")
      return false;

    if (notifCategory === "All") return true;
    if (notifCategory === "Journey")
      return (
        n.type?.includes("journey") ||
        n.type?.includes("trip") ||
        n.type?.includes("join")
      );
    if (notifCategory === "Social")
      return n.type?.includes("post") || n.type?.includes("follow");
    if (notifCategory === "Messages")
      return n.type?.includes("message") || n.type?.includes("chat");
    if (notifCategory === "Safety")
      return n.type?.includes("sos") || n.type?.includes("emergency");
    return true;
  });

  const groupedNotifs = groupNotifications(filteredNotifications);

  const handleMarkAllRead = async () => {
    try {
      await axios.put("/notifications/read-all", {}, { withCredentials: true });
      setNotifications((prev) => prev?.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchTab, setSearchTab] = useState("all");

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get(
          `/social/search?q=${encodeURIComponent(searchQuery)}`,
          { withCredentials: true },
        );
        if (res.data.success) setSearchResults(res.data);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItemClass = (isActive) =>
    `relative flex items-center gap-3 py-3 transition-all duration-200 group w-full select-none text-sm font-semibold ${
      isActive
        ? "bg-brand-50 text-brand-700 border-l-4 border-brand-600 rounded-r-2xl rounded-l-none pl-3 pr-4 shadow-sm"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium hover:-translate-y-0.5 px-4 rounded-2xl"
    }`;

  const iconClass = (isActive) =>
    `w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-brand-700" : "text-slate-400 group-hover:text-brand-600"}`;

  const handleAcceptRequest = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await axios.post(
        `/users/${requesterId}/follow-request/accept`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) =>
        prev.filter(
          (n) => !(n.type === "follow_request" && n.sender._id === requesterId),
        ),
      );
      showToast.success("Follow request accepted");
    } catch (err) {
      showToast.error("Failed to accept request");
    }
  };

  const handleRejectRequest = async (e, requesterId) => {
    e.stopPropagation();
    try {
      await axios.post(
        `/users/${requesterId}/follow-request/reject`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) =>
        prev.filter(
          (n) => !(n.type === "follow_request" && n.sender._id === requesterId),
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptMessage = async (e, roomId, notificationId) => {
    e.stopPropagation();
    try {
      await axios.put(
        `/chat/direct/${roomId}/accept`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectMessage = async (e, roomId, notificationId) => {
    e.stopPropagation();
    try {
      await axios.put(
        `/chat/direct/${roomId}/decline`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptJoin = async (e, groupId, requestId, notificationId) => {
    e.stopPropagation();
    try {
      await axios.post(
        `/social/buddy/manage-request/${groupId}`,
        { requestId, status: "Approved" },
        { withCredentials: true },
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectJoin = async (e, groupId, requestId, notificationId) => {
    e.stopPropagation();
    try {
      await axios.post(
        `/social/buddy/manage-request/${groupId}`,
        { requestId, status: "Rejected" },
        { withCredentials: true },
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (
      n.type === "follow" ||
      n.type === "new_follower" ||
      n.type === "follow_accept" ||
      n.type === "follow_request"
    ) {
      if (n.sender?._id) navigate(`/profile/${n.sender._id}`);
    } else if (
      n.type === "group_joined" ||
      n.type === "trip_cancelled" ||
      n.type === "group" ||
      n.type === "join_request"
    ) {
      const groupId = typeof n.group === "object" ? n.group?._id : n.group;
      if (groupId) navigate(`/social/buddy/${groupId}`);
    } else if (
      n.type === "new_message" ||
      n.type === "message_request" ||
      n.type === "direct"
    ) {
      navigate(`/social/chat`);
    } else {
      navigate("/");
    }

    if (!n.isRead) {
      try {
        await axios.put(
          `/notifications/${n._id}/read`,
          {},
          { withCredentials: true },
        );
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === n._id ? { ...notif, isRead: true } : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotifPanel(false);
  };

  return (
    <>
      {/* ðŸ’» DESKTOP SIDEBAR ðŸ’» */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-50">
        <nav className="flex flex-col h-full bg-white border-r border-slate-100 shadow-sm py-6 px-4 justify-between transition-colors duration-300">
          {/* Top section */}
          <div className="flex flex-col gap-1">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3.5 px-3 py-2 mb-4 group"
            >
              <div className="relative w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20 shrink-0 group-hover:-rotate-6 transition-all duration-300">
                <span className="relative z-10 text-white font-bold text-base tracking-tighter">
                  GY
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 truncate">
                Go YatriGo<span className="text-brand-600">.</span>
              </span>
            </Link>

          {/* Nav Links */}
          <Link to="/" className={navItemClass(location.pathname === "/")}>
            <HomeIcon className={iconClass(location.pathname === "/")} />
            Home
          </Link>

          <button
            onClick={() => setIsSearchOpen(true)}
            className={navItemClass(false)}
          >
            <Search className={iconClass(false)} />
            Search
          </button>

          <Link
            to="/social/buddy"
            className={navItemClass(
              location.pathname.startsWith("/social/buddy"),
            )}
          >
            <Compass
              className={iconClass(
                location.pathname.startsWith("/social/buddy"),
              )}
            />
            Explore
          </Link>

          <Link
            to="/social/journeys"
            className={navItemClass(
              location.pathname.startsWith("/social/journeys"),
            )}
          >
            <Navigation
              className={iconClass(
                location.pathname.startsWith("/social/journeys"),
              )}
            />
            Journeys
          </Link>

          <Link
            to="/social/chat"
            className={navItemClass(
              location.pathname.startsWith("/social/chat"),
            )}
          >
            <MessageSquare
              className={iconClass(
                location.pathname.startsWith("/social/chat"),
              )}
            />
            Messages
          </Link>

          {/* Notifications */}
          <div ref={notifRef} className="relative w-full">
            <button
              onClick={() => {
                setShowNotifPanel((prev) => !prev);
                if (!showNotifPanel && unreadCount > 0) handleMarkAllRead();
              }}
              className={navItemClass(showNotifPanel)}
            >
              <Bell className={iconClass(showNotifPanel)} />
              <span className="flex-1 text-left">Notifications</span>
              {unreadCount > 0 && (
                <span className="w-5 h-5 min-w-[20px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifPanel && (
                <motion.div
                  initial={{ opacity: 0, x: -8, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className="fixed top-4 left-64 w-[460px] max-h-[80vh] flex flex-col bg-white rounded-3xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <h3 className="text-base font-bold text-slate-900">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto shrink-0 select-none">
                    {["All", "Journey", "Social", "Messages", "Safety"].map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => setNotifCategory(cat)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            notifCategory === cat
                              ? "bg-brand-600 text-white shadow-xs"
                              : "bg-white text-slate-600 hover:bg-brand-50 border border-slate-200"
                          }`}
                        >
                          {cat}{" "}
                          {cat === "Journey" && journeyInvitations.length > 0
                            ? `(${journeyInvitations.length})`
                            : ""}
                        </button>
                      ),
                    )}
                  </div>

                  <div className="overflow-y-auto overflow-x-hidden flex-1">
                    {(notifCategory === "All" || notifCategory === "Journey") &&
                      journeyInvitations.length > 0 && (
                        <div className="p-4 bg-brand-50/40 border-b border-brand-100 space-y-3">
                          <span className="text-[10px] font-black uppercase text-brand-600 tracking-wider block px-1">
                            Official Journey Invitations
                          </span>
                          {journeyInvitations.map((inv) => (
                            <JourneyInvitationCard
                              key={inv._id}
                              invitation={inv}
                              onAction={(id) =>
                                setJourneyInvitations((prev) =>
                                  prev.filter((i) => i._id !== id),
                                )
                              }
                            />
                          ))}
                        </div>
                      )}

                    {filteredNotifications.length === 0 &&
                    ((notifCategory !== "Journey" && notifCategory !== "All") ||
                      journeyInvitations.length === 0) ? (
                      <div className="py-16 text-center flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-bold">
                          No new travel updates in {notifCategory} âœˆï¸
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {[
                          { title: "Today", items: groupedNotifs.today },
                          {
                            title: "Yesterday",
                            items: groupedNotifs.yesterday,
                          },
                          { title: "Earlier", items: groupedNotifs.earlier },
                        ].map(
                          (group) =>
                            group.items.length > 0 && (
                              <div key={group.title}>
                                <div className="sticky top-0 bg-white z-10 px-5 py-2 border-y border-slate-50 mt-1 first:mt-0">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {group.title}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <AnimatePresence initial={false}>
                                    {group.items.map((n) => (
                                      <motion.div
                                        key={n._id}
                                        layout
                                        initial={{
                                          opacity: 0,
                                          y: -20,
                                          scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                          duration: 0.3,
                                          type: "spring",
                                          bounce: 0.4,
                                        }}
                                        onClick={() =>
                                          handleNotificationClick(n)
                                        }
                                        className={`relative flex items-start gap-4 px-5 py-4 transition-all duration-200 cursor-pointer group hover:bg-brand-50/50 border-b border-slate-50 last:border-b-0 ${
                                          n.isRead
                                            ? "bg-white"
                                            : "bg-brand-50/20"
                                        }`}
                                      >
                                        <div className="relative shrink-0">
                                          <img
                                            src={getAvatarUrl(
                                              n.sender?.pic,
                                              n.sender?.img,
                                              n.sender?.name,
                                            )}
                                            alt={n.sender?.name}
                                            className="w-11 h-11 rounded-full object-cover border-[3px] border-white shadow-sm"
                                            onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(n.sender?.name || "User")}&background=7C3AED&color=fff&bold=true`;
                                            }}
                                          />
                                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-50">
                                            {notifIcon(n.type)}
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                          <p
                                            className={`text-[13px] leading-relaxed text-slate-700 ${n.isRead ? "font-normal" : "font-semibold text-slate-900"}`}
                                          >
                                            <span className="font-extrabold text-slate-900 mr-1">
                                              {n.sender?.name}
                                            </span>
                                            {n.message
                                              ?.replace(n.sender?.name, "")
                                              .trim()}
                                          </p>
                                          <p className="text-[11px] text-slate-400 font-medium mt-1 group-hover:text-brand-600 transition-colors">
                                            {moment(n.createdAt).fromNow()}
                                          </p>

                                          {/* Action Buttons for Requests */}
                                          {n.type === "follow_request" && (
                                            <div className="flex gap-2 mt-3">
                                              <button
                                                onClick={(e) =>
                                                  handleAcceptRequest(
                                                    e,
                                                    n.sender?._id,
                                                  )
                                                }
                                                className="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-all active:scale-95"
                                              >
                                                Accept
                                              </button>
                                              <button
                                                onClick={(e) =>
                                                  handleRejectRequest(
                                                    e,
                                                    n.sender?._id,
                                                  )
                                                }
                                                className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors active:scale-95"
                                              >
                                                Reject
                                              </button>
                                            </div>
                                          )}
                                          {n.type === "message_request" &&
                                            n.room && (
                                              <div className="flex gap-2 mt-3">
                                                <button
                                                  onClick={(e) =>
                                                    handleAcceptMessage(
                                                      e,
                                                      n.room,
                                                      n._id,
                                                    )
                                                  }
                                                  className="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-all active:scale-95"
                                                >
                                                  Accept
                                                </button>
                                                <button
                                                  onClick={(e) =>
                                                    handleRejectMessage(
                                                      e,
                                                      n.room,
                                                      n._id,
                                                    )
                                                  }
                                                  className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors active:scale-95"
                                                >
                                                  Reject
                                                </button>
                                              </div>
                                            )}
                                          {n.type === "join_request" &&
                                            n.joinRequest && (
                                              <div className="flex gap-2 mt-3">
                                                <button
                                                  onClick={(e) =>
                                                    handleAcceptJoin(
                                                      e,
                                                      typeof n.group ===
                                                        "object"
                                                        ? n.group._id
                                                        : n.group,
                                                      n.joinRequest,
                                                      n._id,
                                                    )
                                                  }
                                                  className="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-all active:scale-95"
                                                >
                                                  Approve
                                                </button>
                                                <button
                                                  onClick={(e) =>
                                                    handleRejectJoin(
                                                      e,
                                                      typeof n.group ===
                                                        "object"
                                                        ? n.group._id
                                                        : n.group,
                                                      n.joinRequest,
                                                      n._id,
                                                    )
                                                  }
                                                  className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors active:scale-95"
                                                >
                                                  Decline
                                                </button>
                                              </div>
                                            )}
                                        </div>
                                        {!n.isRead && (
                                          <div className="shrink-0 pt-2">
                                            <div className="w-2 h-2 bg-brand-600 rounded-full" />
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                </div>
                              </div>
                            ),
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Create Dropdown */}
          <Menu as="div" className="relative w-full">
            <Menu.Button className="w-full btn-primary my-4 py-3 text-sm">
              <PlusSquare className="w-4.5 h-4.5" />
              Create
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Menu.Items className="absolute left-[calc(100%+16px)] bottom-0 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 focus:outline-none p-2 origin-bottom-left">
                <div className="space-y-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsCreateStoryOpen(true)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? "bg-slate-50" : "bg-transparent"}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                          <PlusSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Create Story
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Share moments for 24h
                          </p>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsCreatePostOpen(true)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? "bg-slate-50" : "bg-transparent"}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                          <PlusSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Post a Memory
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Share travel photos
                          </p>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/social/buddy/new"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? "bg-slate-50" : "bg-transparent"}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Create Trip Group
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Host a travel squad
                          </p>
                        </div>
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item disabled>
                    {() => (
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-50 cursor-not-allowed">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-400 shrink-0">
                          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            Go Live
                            <span className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[9px] font-bold uppercase rounded-full tracking-wider">
                              Soon
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Broadcast to followers
                          </p>
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <Link
            to="/profile"
            className={navItemClass(location.pathname === "/profile")}
          >
            <User className={iconClass(location.pathname === "/profile")} />
            Profile
          </Link>
        </div>

        {/* Bottom User Area */}
        <div className="border-t border-slate-200 pt-5">
          {user ? (
            <ProfileMenu />
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="btn-secondary py-2 px-4 text-center text-sm font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary py-2 px-4 text-center text-sm font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>

      {/* mobile top header */}
      {(() => {
        const path = location.pathname;
        const hideTopHeader =
          /^\/social\/chat\/.+/.test(path) ||
          path.startsWith("/social/buddy/new") ||
          path.startsWith("/social/buddy/edit") ||
          path.startsWith("/social/journey/") ||
          path.startsWith("/updateProfile");

        if (hideTopHeader) return null;

        return (
          <div className="lg:hidden sticky top-0 bg-white z-[990] px-4 h-12 border-b border-slate-100 flex justify-between items-center">
            {location.pathname.startsWith("/settings/") ? (
              <Link
                to="/settings"
                className="flex items-center gap-2 text-slate-800 font-extrabold text-[15px] hover:text-brand-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-brand-600" />
                <span>Settings</span>
              </Link>
            ) : (
              <Link to="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/10 overflow-hidden">
                  <span className="relative z-10 text-white font-extrabold text-xs tracking-tighter">
                    GY
                  </span>
                </div>
                <span className="text-[17px] font-black tracking-tight text-slate-900">
                  Go YatriGo.
                </span>
              </Link>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
              {user && (
                <>
                  <Link
                    to="/social/journeys"
                    aria-label="Journeys"
                    className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${
                      location.pathname.startsWith("/social/journeys")
                        ? "text-brand-600"
                        : "text-slate-500"
                    }`}
                  >
                    <Map className="w-4.5 h-4.5" />
                  </Link>
                  <button
                    onClick={() => {
                      setShowNotifPanel((prev) => !prev);
                      if (!showNotifPanel && unreadCount > 0) handleMarkAllRead();
                    }}
                    className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  <Link
                    to="/settings"
                    aria-label="Settings"
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <Settings className="w-4.5 h-4.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* mobile bottom nav */}
      {user && (() => {
        const path = location.pathname;
        const hideBottomNav =
          /^\/social\/chat\/.+/.test(path) ||
          path.startsWith("/settings/") ||
          path.startsWith("/social/buddy/new") ||
          path.startsWith("/social/buddy/edit") ||
          path.startsWith("/social/journey/") ||
          path.startsWith("/updateProfile");

        if (hideBottomNav) return null;

        return (
          <nav id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_25px_rgba(0,0,0,0.04)] z-[990] h-16 flex justify-around items-center px-1 pb-safe">
            <Link
              to="/"
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
                location.pathname === "/"
                  ? "text-brand-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="text-[9px] font-bold leading-none">Home</span>
            </Link>

            <Link
              to="/social/buddy"
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
                location.pathname.startsWith("/social/buddy")
                  ? "text-brand-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[9px] font-bold leading-none">Explore</span>
            </Link>

            {/* FAB Create */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1"
            >
              <div className="p-1.5 bg-brand-600 text-white rounded-xl shadow-md shadow-brand-600/20 active:scale-95 transition-transform">
                <PlusSquare className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold leading-none text-slate-400">Create</span>
            </button>

            <Link
              to="/social/chat"
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
                location.pathname.startsWith("/social/chat")
                  ? "text-brand-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[9px] font-bold leading-none">Messages</span>
            </Link>

            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-0 ${
                location.pathname === "/profile"
                  ? "text-brand-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] font-bold leading-none">Profile</span>
            </Link>
          </nav>
        );
      })()}

      {/* Mobile Create Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-create-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[1000] bg-slate-900/20 lg:hidden"
          />
        )}
        {isOpen && (
          <motion.div
            key="mobile-create-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-3xl shadow-2xl lg:hidden pb-safe border-t border-slate-100"
          >
            <div className="p-6">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
              <h3 className="text-base font-bold text-slate-800 mb-4">
                Create New
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateStoryOpen(true);
                  }}
                  className="w-full text-left flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                    <PlusSquare className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Create Story
                    </p>
                    <p className="text-xs text-slate-400">
                      Share moments for 24h
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreatePostOpen(true);
                  }}
                  className="w-full text-left flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                    <PlusSquare className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Post a Memory
                    </p>
                    <p className="text-xs text-slate-400">
                      Share your travel photos
                    </p>
                  </div>
                </button>
                <Link
                  to="/social/buddy/new"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Create a Trip
                    </p>
                    <p className="text-xs text-slate-400">
                      Host a travel squad
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Drawer */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            key="search-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 z-[1000] bg-slate-900/10"
          />
        )}
        {isSearchOpen && (
          <motion.div
            key="search-drawer-content"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[1001] w-full lg:w-[380px] lg:max-w-sm bg-white lg:border-l lg:border-slate-100 shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand-600" /> Search
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                  Travelers Â· Trips Â· Memories
                </p>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-b border-slate-50 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search people, trips, destinations..."
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-brand-500/50 focus:bg-white focus:shadow-xs transition-all"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-50 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden">
              {["all", "travelers", "groups", "posts"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSearchTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${searchTab === tab ? "bg-brand-600 text-white shadow-xs" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  {tab === "posts" ? "Travel Memories" : tab}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {searchLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse border border-slate-100/50"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-2 bg-slate-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !searchQuery ? (
                <div className="text-center py-14 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                    <Search className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Start exploring
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto leading-relaxed text-center">
                    Search destinations, travelers, groups, or tags
                  </p>
                </div>
              ) : searchResults ? (
                <div className="space-y-5">
                  {(searchTab === "all" || searchTab === "travelers") && (
                    <div className="space-y-2">
                      {searchTab === "all" &&
                        searchResults.travelers?.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                            Travelers
                          </span>
                        )}
                      {searchResults.travelers?.length > 0 ? (
                        searchResults.travelers.map((traveler) => (
                          <div
                            key={traveler._id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/profile/${traveler._id}`);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-brand-500/10 hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <Avatar
                              user={traveler}
                              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-bold text-slate-800 truncate flex items-center gap-1">
                                {traveler.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 capitalize">
                                {traveler.type || "Traveler"}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition-colors" />
                          </div>
                        ))
                      ) : searchTab === "travelers" ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No travelers found
                        </p>
                      ) : null}
                    </div>
                  )}

                  {(searchTab === "all" || searchTab === "groups") && (
                    <div className="space-y-2">
                      {searchTab === "all" &&
                        searchResults.trips?.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                            Active Trips
                          </span>
                        )}
                      {searchResults.trips?.length > 0 ? (
                        searchResults.trips.map((trip) => (
                          <div
                            key={trip._id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/social/buddy/${trip._id}`);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-brand-500/10 hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
                              {trip.destination
                                ? trip.destination.substring(0, 2).toUpperCase()
                                : "TR"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-bold text-slate-800 truncate">
                                {trip.title}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[8px] bg-brand-50 text-brand-600 font-bold px-1.5 py-0.5 rounded">
                                  {trip.category}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate">
                                  â†’ {trip.destination}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition-colors" />
                          </div>
                        ))
                      ) : searchTab === "groups" ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No groups found
                        </p>
                      ) : null}
                    </div>
                  )}

                  {(searchTab === "all" || searchTab === "posts") && (
                    <div className="space-y-2">
                      {searchTab === "all" &&
                        searchResults.memories?.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                            Memories
                          </span>
                        )}
                      {searchResults.memories?.length > 0 ? (
                        searchResults.memories.map((memory) => (
                          <div
                            key={memory._id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/`);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-brand-500/10 hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <img
                              src={memory.image}
                              alt={memory.title}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[13px] font-bold text-slate-800 truncate">
                                {memory.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                by {memory.userId?.name || "Traveler"}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition-colors" />
                          </div>
                        ))
                      ) : searchTab === "posts" ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No posts found
                        </p>
                      ) : null}
                    </div>
                  )}

                  {searchTab === "all" &&
                    !searchResults.travelers?.length &&
                    !searchResults.trips?.length &&
                    !searchResults.memories?.length && (
                      <div className="text-center py-14 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                          <Search className="w-5 h-5 text-rose-300" />
                        </div>
                        <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                          No results
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto text-center">
                          Nothing matched "{searchQuery}"
                        </p>
                      </div>
                    )}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
};

export default SocialSidebar;

