import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-transparent px-4 py-8 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] font-medium text-slate-500">
          <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
          <Link to="/social/buddy" className="hover:text-slate-800 transition-colors">Travel Groups</Link>
          <Link to="/social/memories" className="hover:text-slate-800 transition-colors">Memories</Link>
          <Link to="/social/chat" className="hover:text-slate-800 transition-colors">Messages</Link>
          <Link to="/contactus" className="hover:text-slate-800 transition-colors">Support</Link>
          <Link to="/safety" className="hover:text-slate-800 transition-colors">Safety</Link>
        </div>
        <div className="text-[12px] font-medium text-slate-400 flex items-center gap-2">
          <span>© {new Date().getFullYear()} Go  YatriGo.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

