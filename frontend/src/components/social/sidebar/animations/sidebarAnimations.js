export const notificationVariants = {
  initial: { opacity: 0, x: -8, scale: 0.97 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -8, scale: 0.97 },
  transition: { type: "spring", stiffness: 420, damping: 28 },
};

export const notificationItemVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.3, type: "spring", bounce: 0.4 },
};

export const dropdownVariants = {
  enter: "transition ease-out duration-300",
  enterFrom: "opacity-0 scale-95 blur-sm translate-y-4",
  enterTo: "opacity-100 scale-100 blur-0 translate-y-0",
  leave: "transition ease-in duration-200",
  leaveFrom: "opacity-100 scale-100 blur-0 translate-y-0",
  leaveTo: "opacity-0 scale-95 blur-sm translate-y-4",
};

export const drawerVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  sheet: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
    transition: { type: "spring", stiffness: 320, damping: 30 },
  }
};
