import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { ICONS } from "../constants/icons";
import { createActions } from "../constants/createActions";
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
    <Menu as="div" className="relative w-full">
      {({ open }) => (
        <>
          <Menu.Button
            data-tour="nav-create"
            className={`relative flex items-center justify-between gap-3 py-2.5 px-3 transition-all duration-200 group w-full select-none text-[13.5px] rounded-xl cursor-pointer ${
              open
                ? "bg-white/95 text-brand font-bold shadow-[0_2px_8px_rgba(15,23,42,0.06)] border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <ICONS.PlusSquare
                className={`w-[19px] h-[19px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  open ? "text-brand" : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              <span className="flex-1 text-left">Create</span>
            </div>
            <ICONS.ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                open ? "rotate-90 text-brand" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
          </Menu.Button>

          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95 -translate-x-2"
            enterTo="opacity-100 scale-100 translate-x-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-x-0"
            leaveTo="opacity-0 scale-95 -translate-x-2"
          >
            <Menu.Items className="absolute left-[calc(100%+22px)] top-0 w-[270px] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_15px_35px_rgba(15,23,42,0.16),0_2px_8px_rgba(15,23,42,0.06)] focus:outline-none z-[100] p-1.5 border border-slate-200/80">
              {/* Pointer arrow notch pointing to the Create button */}
              <div className="absolute -left-1.5 top-3.5 w-3 h-3 bg-white border-l border-t border-slate-200/80 -rotate-45 pointer-events-none" />

              <div className="relative px-2.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                <h4 className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ICONS.Sparkles className="w-3.5 h-3.5 text-brand" />
                  Quick Actions
                </h4>
              </div>

              <div className="space-y-0.5">
                {createActions.map((action, idx) => {
                  const ActionIcon = action.icon;

                  return (
                    <Menu.Item key={idx}>
                      {({ active }) => {
                        const content = (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-sky-50 text-brand flex items-center justify-center shrink-0">
                              <ActionIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-[12.5px] font-bold text-slate-900 group-hover:text-brand transition-colors leading-tight truncate">
                                {action.label}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                                {action.description}
                              </p>
                            </div>
                            <ICONS.ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                          </>
                        );

                        const commonClasses = `group flex items-center gap-2 w-full p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                          active ? "bg-slate-100/90 shadow-2xs" : "hover:bg-slate-50"
                        }`;

                        if (action.path) {
                          return (
                            <button
                              type="button"
                              className={commonClasses}
                              onClick={() => navigate(action.path)}
                            >
                              {content}
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
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
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};


export default React.memo(CreateDropdown);


