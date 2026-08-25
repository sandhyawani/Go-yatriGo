import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { ICONS } from "../constants/icons";
import { createActions } from "../constants/createActions";
import { dropdownVariants } from "../animations/sidebarAnimations";
import { useSidebar } from "../SidebarProvider";

const CreateDropdown = () => {
  const { openCreateJourney, openCreatePost } = useSidebar();
  const navigate = useNavigate();

  const handleActionClick = (action) => {
    if (!action.isAction) return;
    if (action.action === "openCreateJourney") {
      openCreateJourney();
    } else if (action.action === "openCreatePost") {
      openCreatePost();
    }
  };

  return (
    <Menu as="div" className="relative mt-2.5">
      <Menu.Button className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gradient-to-r from-brand-600 to-[#7C4CFF] hover:from-brand-700 hover:to-[#6D3EF5] text-white rounded-xl font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
        <div className="flex items-center gap-2">
          <ICONS.PlusSquare className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm">Create</span>
        </div>
        <ICONS.ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter={dropdownVariants.enter}
        enterFrom={dropdownVariants.enterFrom}
        enterTo={dropdownVariants.enterTo}
        leave={dropdownVariants.leave}
        leaveFrom={dropdownVariants.leaveFrom}
        leaveTo={dropdownVariants.leaveTo}
      >
        <Menu.Items className="absolute left-full bottom-0 ml-3 w-72 origin-bottom-left bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] focus:outline-none z-[100] p-2 border border-white/50">
          <div className="px-4 py-3 border-b border-slate-100/50 mb-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ICONS.Sparkles className="w-3.5 h-3.5 text-[#6D3EF5]" />
              Quick Actions
            </h4>
          </div>

          {createActions.map((action, idx) => {
            const ActionIcon = action.icon;

            return (
              <Menu.Item key={idx}>
                {({ active }) => {
                  const content = (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6D3EF5]/20 to-[#6D3EF5]/5 flex items-center justify-center text-[#6D3EF5] shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <ActionIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#6D3EF5] transition-colors leading-snug">
                          {action.label}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium leading-snug">
                          {action.description}
                        </p>
                      </div>
                      <ICONS.ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#6D3EF5] group-hover:translate-x-1 transition-all duration-300" />
                    </>
                  );

                  const commonClasses = `group flex items-center gap-3 w-full p-2.5 rounded-2xl transition-all duration-200 ${
                    active ? "bg-slate-50 shadow-sm" : ""
                  }`;

                  // path-based action (Travel Squad → /social/buddy/new)
                  if (action.path) {
                    return (
                      <button
                        className={commonClasses}
                        onClick={() => navigate(action.path)}
                      >
                        {content}
                      </button>
                    );
                  }

                  // action-based items (Start Journey, Travel Memory)
                  return (
                    <button
                      onClick={() => handleActionClick(action)}
                      className={commonClasses}
                    >
                      {content}
                    </button>
                  );
                }}
              </Menu.Item>
            );
          })}

          <div className="pt-3 border-t border-slate-200/50 mt-1 text-center">
            <p className="text-[10px] font-bold text-[#6D3EF5] uppercase tracking-widest opacity-60">
              Powered by Go YatriGo Explorer System
            </p>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default React.memo(CreateDropdown);
