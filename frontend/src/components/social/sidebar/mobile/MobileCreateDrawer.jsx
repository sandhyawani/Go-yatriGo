import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { drawerVariants } from "../animations/sidebarAnimations";
import { createActions } from "../constants/createActions";
import { ICONS } from "../constants/icons";
import { useSidebar } from "../SidebarProvider";

const MobileCreateDrawer = () => {
  const { drawerOpen, closeDrawer, setIsCreatePostOpen } = useSidebar();

  const handleActionClick = (action) => {
    closeDrawer();
    if (action.isAction && action.action === "openCreatePost") {
      setIsCreatePostOpen(true);
    }
  };

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.div
          key="mobile-create-backdrop"
          variants={drawerVariants.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={closeDrawer}
          className="fixed inset-0 z-[1000] bg-slate-900/20 lg:hidden"
        />
      )}

      {drawerOpen && (
        <motion.div
          key="mobile-create-sheet"
          variants={drawerVariants.sheet}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed bottom-0 left-0 right-0 z-[1001] bg-white/95 backdrop-blur-3xl rounded-t-[32px] shadow-[0_-20px_60px_-15px_rgba(109,62,245,0.2)] lg:hidden pb-safe border-t border-white/50"
        >
          <div className="p-6">
            <div className="w-12 h-1.5 bg-slate-200/80 rounded-full mx-auto mb-6" />

            <div className="mb-6 text-center">
              <h3 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                <span>✈️</span> Launch Expedition
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1.5">
                Choose your next travel experience
              </p>
            </div>

            <div className="space-y-3">
              {createActions.map((action, idx) => {
                const ActionIcon = action.icon;
                if (action.path) {
                  return (
                    <Link
                      key={idx}
                      to={action.path}
                      onClick={closeDrawer}
                      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-white/50 hover:bg-gradient-to-r hover:from-[#6D3EF5]/10 hover:to-transparent hover:shadow-[0_8px_20px_rgba(109,62,245,0.12)] transition-all duration-300"
                      style={{ border: "1px solid rgba(109,62,245,0.1)" }}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6D3EF5]/20 to-[#6D3EF5]/5 flex items-center justify-center text-[#6D3EF5] shrink-0 shadow-inner">
                        <ActionIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-slate-800">
                          {action.label}
                        </p>
                        <p className="text-[13px] text-slate-500 font-medium">
                          {action.description}
                        </p>
                      </div>
                      <ICONS.ArrowRight className="w-5 h-5 text-slate-300" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleActionClick(action)}
                    className="w-full text-left flex items-center gap-4 p-4 rounded-2xl bg-white/50 hover:bg-gradient-to-r hover:from-[#6D3EF5]/10 hover:to-transparent hover:shadow-[0_8px_20px_rgba(109,62,245,0.12)] transition-all duration-300"
                    style={{ border: "1px solid rgba(109,62,245,0.1)" }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6D3EF5]/20 to-[#6D3EF5]/5 flex items-center justify-center text-[#6D3EF5] shrink-0 shadow-inner">
                      <ActionIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-slate-800">
                        {action.label}
                      </p>
                      <p className="text-[13px] text-slate-500 font-medium">
                        {action.description}
                      </p>
                    </div>
                    <ICONS.ArrowRight className="w-5 h-5 text-slate-300" />
                  </button>
                );
              })}
            </div>

            <div className="pt-6 text-center">
              <p className="text-[10px] font-bold text-[#6D3EF5] uppercase tracking-widest opacity-60">
                Powered by Go YatriGo Explorer System
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileCreateDrawer;
