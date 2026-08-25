import React from "react";
import { Link } from "react-router-dom";
import {
PlusCircle,
Users,
MessageCircle,
ShieldCheck,
Compass,
ClipboardList,
DollarSign,
Briefcase,
CloudSun,
FileText,
AlertTriangle,
PlayCircle,
Camera,
Map } from
"lucide-react";
import { motion } from "framer-motion";





const QuickActions = ({ journey }) => {
  const status = journey?.status || "None";


  const getActions = () => {
    switch (status) {
      case "Planning":
        return [
        {
          title: "Invite Buddies",
          subtitle: "Add trip companions",
          icon: Users,
          to: `/social/journeys/${journey._id}`,
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Trip Budget",
          subtitle: "Set expense limits",
          icon: DollarSign,
          to: `/social/journeys/${journey._id}`,
          color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
          title: "Checklist",
          subtitle: "Manage group tasks",
          icon: ClipboardList,
          to: `/social/journeys/${journey._id}`,
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Squad Chat",
          subtitle: "Coordinate details",
          icon: MessageCircle,
          to: `/social/chat/${journey.chatRoomId || ""}`,
          color: "text-amber-600 bg-amber-50 border-amber-100"
        }];


      case "Upcoming":
        return [
        {
          title: "Packing List",
          subtitle: "Check gear items",
          icon: Briefcase,
          to: `/social/journeys/${journey._id}`,
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Weather Advisories",
          subtitle: "Forecast status",
          icon: CloudSun,
          to: `/social/journeys/${journey._id}`,
          color: "text-amber-600 bg-amber-50 border-amber-100"
        },
        {
          title: "Documents",
          subtitle: "Permits & ID scans",
          icon: FileText,
          to: `/social/journeys/${journey._id}`,
          color: "text-slate-600 bg-slate-100 border-slate-200"
        },
        {
          title: "Squad Chat",
          subtitle: "Confirm meetup spots",
          icon: MessageCircle,
          to: `/social/chat/${journey.chatRoomId || ""}`,
          color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        }];


      case "Ongoing":
        return [
        {
          title: "Safe Check-In",
          subtitle: "Register node arrival",
          icon: ShieldCheck,
          to: `/social/journeys/${journey._id}`,
          color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
          title: "Expenses Tracker",
          subtitle: "Split cab & stays",
          icon: DollarSign,
          to: `/social/journeys/${journey._id}`,
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Emergency SOS",
          subtitle: "Contact dashboard",
          icon: AlertTriangle,
          to: "/emergency-contacts",
          color: "text-rose-600 bg-rose-50 border-rose-100"
        },
        {
          title: "Squad Chat",
          subtitle: "Real-time messages",
          icon: MessageCircle,
          to: `/social/chat/${journey.chatRoomId || ""}`,
          color: "text-brand-600 bg-brand-50 border-brand-100"
        }];


      case "Completed":
        return [
        {
          title: "Journey Replay",
          subtitle: "Interactive timelines",
          icon: PlayCircle,
          to: `/social/journeys/${journey._id}`,
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Share Memories",
          subtitle: "Publish logs & photos",
          icon: Camera,
          to: "/",
          color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
          title: "Explorer Footprint",
          subtitle: "Travel passport maps",
          icon: Map,
          to: "/profile",
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Crew Chat",
          subtitle: "Share post-trip notes",
          icon: MessageCircle,
          to: `/social/chat/${journey.chatRoomId || ""}`,
          color: "text-amber-600 bg-amber-50 border-amber-100"
        }];


      default:

        return [
        {
          title: "Plan Journey",
          subtitle: "Map route & budgets",
          icon: PlusCircle,
          to: "/social/buddy/new",
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Find Buddies",
          subtitle: "Browse companion trips",
          icon: Users,
          to: "/social/buddy",
          color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
          title: "Squad Chats",
          subtitle: "Co-travel messages",
          icon: MessageCircle,
          to: "/social/chat",
          color: "text-brand-600 bg-brand-50 border-brand-100"
        },
        {
          title: "Safety Center",
          subtitle: "Manage SOS contacts",
          icon: ShieldCheck,
          to: "/emergency-contacts",
          color: "text-rose-600 bg-rose-50 border-rose-100"
        }];

    }
  };

  const actions = getActions();

  return (
    <div className="card p-5 bg-white border border-slate-100">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-50">
        <div className="p-1 bg-brand-50 text-brand-600 rounded-lg">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            Command Shortcuts
          </h4>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
            {status === "None" ? "Explorer Core Operations" : `Stage: ${status}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((act, idx) =>
        <Link key={idx} to={act.to} className="block group">
            <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start text-left transition-all duration-300 group-hover:bg-white group-hover:shadow-sm">

              <div className={`p-2 rounded-xl mb-3 border ${act.color}`}>
                <act.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                {act.title}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 leading-normal">
                {act.subtitle}
              </span>
            </motion.div>
          </Link>
        )}
      </div>
    </div>);

};

export default QuickActions;